import os
import requests
import difflib
from django.core.management.base import BaseCommand
from api.models import League, Team

class Command(BaseCommand):
    help = 'Menarik logo tim dari API-Football dan menyimpannya di model Team'

    def handle(self, *args, **kwargs):
        api_key = os.getenv('API_FOOTBALL_KEY')
        if not api_key:
            self.stdout.write(self.style.ERROR("Error: API_FOOTBALL_KEY tidak ditemukan di file .env"))
            return

        LEAGUE_MAPPING = {
            'E0': 39, 'SP1': 140, 'I1': 135, 'D1': 78, 'F1': 61, 'N1': 88, 'P1': 94,
        }
        
        headers = {'x-apisports-key': api_key}
        season = 2024

        for league_code, api_id in LEAGUE_MAPPING.items():
            league_obj = League.objects.filter(name=league_code).first()
            if not league_obj:
                continue

            self.stdout.write(f"\nMenarik tim untuk liga {league_code}...")
            url = f"https://v3.football.api-sports.io/teams?league={api_id}&season={season}"
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                self.stdout.write(self.style.ERROR(f"Gagal akses API untuk {league_code}"))
                continue

            data = response.json()
            teams_data = data.get('response', [])
            
            db_teams = list(Team.objects.filter(league=league_obj))
            db_team_names = [t.name for t in db_teams]
            
            for item in teams_data:
                api_team_name = item['team']['name']
                api_logo = item['team']['logo']

                matches = difflib.get_close_matches(api_team_name, db_team_names, n=1, cutoff=0.45)
                
                if matches:
                    best_match_name = matches[0]
                    db_team = next((t for t in db_teams if t.name == best_match_name), None)
                    if db_team:
                        db_team.logo = api_logo
                        db_team.save()
                        self.stdout.write(f"  [+] Cocok: {api_team_name} -> {best_match_name}")
                else:
                    self.stdout.write(f"  [-] Tidak ditemukan kecocokan untuk: {api_team_name}")

        self.stdout.write(self.style.SUCCESS("\nProses penarikan logo selesai!"))