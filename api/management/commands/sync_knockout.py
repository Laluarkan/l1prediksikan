import os
import time
import json
import requests
from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils.timezone import make_aware
from api.models import League, KnockoutMatch
from django.conf import settings

class Command(BaseCommand):
    help = 'Mengambil dataset ekstensif pertandingan knockout dari football-data.org'

    def handle(self, *args, **kwargs):
        api_key = os.getenv('FOOTBALL_DATA_ORG_KEY') or os.getenv('API_FOOTBALL_KEY')
        if not api_key:
            self.stdout.write(self.style.ERROR("Error: API Key tidak ditemukan di file .env"))
            return

        LEAGUE_MAPPING = {
            'E0': 'PL', 'SP1': 'PD', 'I1': 'SA', 'D1': 'BL1',
            'F1': 'FL1', 'N1': 'DED', 'P1': 'PPL', 'UCL': 'CL',
        }

        headers = {'X-Auth-Token': api_key}
        dataset_dir = os.path.join(settings.BASE_DIR, 'dataset')
        os.makedirs(dataset_dir, exist_ok=True)

        KNOCKOUT_STAGES = [
            'LAST_16', 'ROUND_OF_16', 'QUARTER_FINALS', 
            'SEMI_FINALS', 'FINAL', 'THIRD_PLACE', 'PLAYOFFS', 'PLAYOFF_ROUND'
        ]

        self.stdout.write("Memulai sinkronisasi dataset knockout...")

        for league_code, api_league_code in LEAGUE_MAPPING.items():
            try:
                league_obj = League.objects.filter(name=league_code).first()
                if not league_obj:
                    continue

                self.stdout.write(f"Menarik pertandingan untuk liga {league_code}...")
                url = f"https://api.football-data.org/v4/competitions/{api_league_code}/matches"
                
                response = requests.get(url, headers=headers)
                
                if response.status_code == 429:
                    time.sleep(10)
                    response = requests.get(url, headers=headers)

                if response.status_code != 200:
                    continue

                data = response.json()
                matches = data.get('matches', [])
                
                if not matches:
                    continue

                knockout_matches = [m for m in matches if m.get('stage') in KNOCKOUT_STAGES]

                # Menyimpan Raw JSON untuk dataset ML
                if knockout_matches:
                    raw_file_path = os.path.join(dataset_dir, f'raw_knockout_{league_code}_{int(time.time())}.json')
                    with open(raw_file_path, 'w', encoding='utf-8') as f:
                        json.dump(knockout_matches, f, ensure_ascii=False, indent=4)
                    self.stdout.write(self.style.SUCCESS(f"  -> File JSON mentah disimpan di {raw_file_path}"))

                knockout_matches_found = 0

                for match in knockout_matches:
                    stage = match.get('stage')
                    group = match.get('group')
                    season_year = int(match['season']['startDate'][:4])
                    
                    match_date_str = match.get('utcDate')
                    match_date = make_aware(datetime.strptime(match_date_str, "%Y-%m-%dT%H:%M:%SZ"))

                    # Perbaikan: Tambahkan "or {}" agar jika API mengirim null, tetap jadi dictionary kosong
                    home_team_data = match.get('homeTeam') or {}
                    away_team_data = match.get('awayTeam') or {}
                    
                    # Perbaikan: Paksa fallback ke 'TBD' jika nama tim sama sekali tidak ada
                    home_team_name = home_team_data.get('name') or home_team_data.get('shortName') or 'TBD'
                    away_team_name = away_team_data.get('name') or away_team_data.get('shortName') or 'TBD'
                    
                    # Ekstraksi Skor Ekstensif
                    score_obj = match.get('score') or {}
                    duration = score_obj.get('duration')
                    winner = score_obj.get('winner')

                    full_time = score_obj.get('fullTime') or {}
                    half_time = score_obj.get('halfTime') or {}
                    reg_time = score_obj.get('regularTime') or {}
                    ext_time = score_obj.get('extraTime') or {}
                    penalties = score_obj.get('penalties') or {}

                    KnockoutMatch.objects.update_or_create(
                        league=league_obj,
                        season=season_year,
                        stage=stage,
                        home_team=home_team_name,
                        away_team=away_team_name,
                        defaults={
                            'group': group,
                            'match_date': match_date,
                            'home_logo': home_team_data.get('crest'),
                            'away_logo': away_team_data.get('crest'),
                            'home_score': full_time.get('home'),
                            'away_score': full_time.get('away'),
                            'home_score_half': half_time.get('home'),
                            'away_score_half': half_time.get('away'),
                            'home_score_regular': reg_time.get('home'),
                            'away_score_regular': reg_time.get('away'),
                            'home_score_extra': ext_time.get('home'),
                            'away_score_extra': ext_time.get('away'),
                            'home_score_penalties': penalties.get('home'),
                            'away_score_penalties': penalties.get('away'),
                            'winner': winner,
                            'duration': duration,
                            'status': match.get('status', 'SCHEDULED')
                        }
                    )
                    knockout_matches_found += 1

                if knockout_matches_found > 0:
                    self.stdout.write(self.style.SUCCESS(f"Berhasil memperbarui {knockout_matches_found} laga ke database untuk {league_code}"))

                time.sleep(1)

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Terjadi kesalahan pada {league_code}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS("Proses sinkronisasi knockout selesai!"))