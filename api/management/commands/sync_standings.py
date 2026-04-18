import os
import time
import json
import requests
from django.core.management.base import BaseCommand
from api.models import League, Standing
from django.conf import settings

class Command(BaseCommand):
    help = 'Mengambil data klasemen terbaru dari football-data.org termasuk UCL'

    def handle(self, *args, **kwargs):
        api_key = os.getenv('FOOTBALL_DATA_ORG_KEY') or os.getenv('API_FOOTBALL_KEY')
        if not api_key:
            self.stdout.write(self.style.ERROR("Error: API Key tidak ditemukan di file .env"))
            return

        LEAGUE_MAPPING = {
            'E0': 'PL',   
            'SP1': 'PD',  
            'I1': 'SA',   
            'D1': 'BL1',  
            'F1': 'FL1',  
            'N1': 'DED',  
            'P1': 'PPL',
            'UCL': 'CL',
        }

        headers = {
            'X-Auth-Token': api_key,
        }

        dataset_dir = os.path.join(settings.BASE_DIR, 'dataset')
        os.makedirs(dataset_dir, exist_ok=True)

        self.stdout.write("Memulai sinkronisasi klasemen dari football-data.org...")

        for league_code, api_league_code in LEAGUE_MAPPING.items():
            try:
                league_obj = League.objects.filter(name=league_code).first()
                if not league_obj:
                    self.stdout.write(self.style.WARNING(f"Liga {league_code} tidak ada di database, dilewati."))
                    continue

                self.stdout.write(f"Menarik klasemen untuk liga {league_code}...")
                url = f"https://api.football-data.org/v4/competitions/{api_league_code}/standings"
                
                response = requests.get(url, headers=headers)
                
                if response.status_code == 429:
                    self.stdout.write(self.style.WARNING("Rate limit tercapai. Menunggu 10 detik..."))
                    time.sleep(10)
                    response = requests.get(url, headers=headers)

                if response.status_code != 200:
                    self.stdout.write(self.style.ERROR(f"Gagal mengambil data untuk {league_code}. Status: {response.status_code} - {response.text}"))
                    continue

                data = response.json()
                
                if league_code == 'UCL':
                    raw_file_path = os.path.join(dataset_dir, f'raw_ucl_standings_{int(time.time())}.json')
                    with open(raw_file_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=4)
                    self.stdout.write(self.style.SUCCESS(f"Data mentah UCL disimpan ke {raw_file_path} untuk dataset ML"))

                if 'standings' not in data or len(data['standings']) == 0:
                    self.stdout.write(self.style.WARNING(f"Data klasemen kosong untuk {league_code}"))
                    continue

                current_season = int(data['season']['startDate'][:4])
                Standing.objects.filter(league=league_obj, season=current_season).delete()

                standings_to_create = []
                for standing in data['standings']:
                    if standing['type'] == 'TOTAL':
                        for team_data in standing['table']:
                            raw_form = team_data.get('form')
                            clean_form = raw_form.replace(',', '') if raw_form else ''

                            standings_to_create.append(Standing(
                                league=league_obj,
                                season=current_season,
                                rank=team_data['position'],
                                team_name=team_data['team']['name'],
                                team_logo=team_data['team']['crest'],
                                points=team_data['points'],
                                played=team_data['playedGames'],
                                win=team_data['won'],
                                draw=team_data['draw'],
                                lose=team_data['lost'],
                                goals_for=team_data['goalsFor'],
                                goals_against=team_data['goalsAgainst'],
                                goal_diff=team_data['goalDifference'],
                                form=clean_form
                            ))

                if standings_to_create:
                    Standing.objects.bulk_create(standings_to_create)
                    self.stdout.write(self.style.SUCCESS(f"Berhasil memperbarui {len(standings_to_create)} tim untuk liga {league_code}"))
                else:
                    self.stdout.write(self.style.WARNING(f"Tidak ada data tabel TOTAL untuk {league_code}"))

                time.sleep(1)

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Terjadi kesalahan saat memproses {league_code}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS("Proses sinkronisasi klasemen selesai!"))