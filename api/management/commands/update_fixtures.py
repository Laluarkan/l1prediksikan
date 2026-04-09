from django.core.management.base import BaseCommand
from api.models import League, Fixture
from api.api import LEAGUE_FOLDER_MAP

import pandas as pd
import time
from curl_cffi import requests 
import io
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class Command(BaseCommand):
    help = 'Update Jadwal Pertandingan (Fixtures) Murni Tanpa AI'

    def handle(self, *args, **kwargs):
        self.stdout.write("⏳ Memulai update Fixtures...")
        URL = "https://www.football-data.co.uk/fixtures.csv"
        
        df = None
        for attempt in range(3):
            try:
                response = requests.get(URL, impersonate="chrome110", timeout=30, verify=False)
                if response.status_code == 200:
                    df = pd.read_csv(io.StringIO(response.content.decode('utf-8', errors='ignore')))
                    df.columns = df.columns.str.strip()
                    self.stdout.write(self.style.SUCCESS("✅ CSV Fixtures berhasil dibaca!"))
                    break 
            except Exception:
                time.sleep(5)

        valid_leagues = list(LEAGUE_FOLDER_MAP.keys())
        if df is None or 'Div' not in df.columns:
             self.stdout.write(self.style.ERROR("❌ Gagal download/parse CSV Fixtures."))
             return

        # Filter liga yang didukung
        df = df[df['Div'].isin(valid_leagues)].copy()
        if 'Time' not in df.columns: df['Time'] = '12:00'
        
        try:
            df['Datetime'] = pd.to_datetime(df['Date'].astype(str) + ' ' + df['Time'].astype(str), format='mixed', dayfirst=True)
            df['Datetime'] = df['Datetime'].dt.tz_localize('Europe/London', ambiguous='NaT', nonexistent='NaT').dt.tz_convert('Asia/Jakarta')
            df = df.dropna(subset=['Datetime'])
        except Exception as e:
             self.stdout.write(self.style.ERROR(f"❌ Error parse tanggal: {e}"))
             return

        # Hapus data lama, siapkan data baru
        Fixture.objects.all().delete()
        fixtures_to_create = []
        now_wib = pd.Timestamp.now(tz='Asia/Jakarta').tz_localize(None)

        def safe_float(val):
            try: return float(val) if pd.notna(val) else 0.0
            except: return 0.0

        for _, row in df.iterrows():
            # Hanya simpan jadwal yang waktunya masih di masa depan
            if row['Datetime'].tz_localize(None) > now_wib:
                league_obj, _ = League.objects.get_or_create(name=row['Div'])
                fixtures_to_create.append(Fixture(
                    league=league_obj, 
                    date=row['Datetime'].date(), 
                    time=row['Datetime'].time(),
                    home_team=row['HomeTeam'], 
                    away_team=row['AwayTeam'],
                    odds_h=safe_float(row.get('PSH', row.get('B365H', row.get('AvgH')))),
                    odds_d=safe_float(row.get('PSD', row.get('B365D', row.get('AvgD')))),
                    odds_a=safe_float(row.get('PSA', row.get('B365A', row.get('AvgA')))),
                    odds_over=safe_float(row.get('P>2.5', row.get('B365>2.5', row.get('Avg>2.5')))),
                    odds_under=safe_float(row.get('P<2.5', row.get('B365<2.5', row.get('Avg<2.5'))))
                ))
        
        if fixtures_to_create:
            Fixture.objects.bulk_create(fixtures_to_create)
            self.stdout.write(self.style.SUCCESS(f"✅ Tersimpan {len(fixtures_to_create)} jadwal masa depan ke database."))
        else:
            self.stdout.write(self.style.WARNING("⚠️ Tidak ada jadwal masa depan yang ditemukan."))
