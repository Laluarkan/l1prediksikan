import os
import time
import requests
from django.core.management.base import BaseCommand
from api.models import League, Standing

class Command(BaseCommand):
    help = 'Mengambil data klasemen terbaru dari football-data.org'

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
        }

        headers = {
            'X-Auth-Token': api_key,
        }

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
                
                if 'standings' not in data or len(data['standings']) == 0:
                    self.stdout.write(self.style.WARNING(f"Data klasemen kosong untuk {league_code}"))
                    continue

                current_season = int(data['season']['startDate'][:4])

                standings_list = []
                for standing in data['standings']:
                    if standing['type'] == 'TOTAL':
                        standings_list = standing['table']
                        break
                        
                if not standings_list:
                    self.stdout.write(self.style.WARNING(f"Tabel 'TOTAL' tidak ditemukan untuk {league_code}"))
                    continue

                Standing.objects.filter(league=league_obj, season=current_season).delete()

                standings_to_create = []
                for team_data in standings_list:
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

                Standing.objects.bulk_create(standings_to_create)
                self.stdout.write(self.style.SUCCESS(f"Berhasil memperbarui {len(standings_to_create)} tim untuk liga {league_code}"))

                time.sleep(1)

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Terjadi kesalahan saat memproses {league_code}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS("Proses sinkronisasi klasemen selesai!"))