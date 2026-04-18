import os
import time
import requests
import difflib
from django.core.management.base import BaseCommand
from api.models import League, Team

class Command(BaseCommand):
    help = 'Menarik logo tim dari football-data.org dan API-Sports dengan Mapping Manual'

    def handle(self, *args, **kwargs):
        fd_org_key = os.getenv('FOOTBALL_DATA_ORG_KEY')
        api_sports_key = os.getenv('API_FOOTBALL_KEY')

        if not fd_org_key:
            self.stdout.write(self.style.WARNING("Peringatan: FOOTBALL_DATA_ORG_KEY tidak ditemukan di .env"))
        if not api_sports_key:
            self.stdout.write(self.style.WARNING("Peringatan: API_FOOTBALL_KEY tidak ditemukan di .env"))

        CUSTOM_MAPPING = {
            "Wolverhampton Wanderers FC": "Wolves",
            "Leeds United FC": "Leeds",
            "Manchester City FC": "Man City",
            "Newcastle United FC": "Newcastle",
            "Tottenham Hotspur FC": "Tottenham",
            "Brighton & Hove Albion FC": "Brighton",
            "West Ham United FC": "West Ham",
            "Athletic Club": "Ath Bilbao",
            "Club Atlético de Madrid": "Ath Madrid",
            "RCD Espanyol de Barcelona": "Espanyol",
            "Rayo Vallecano de Madrid": "Rayo Vallecano",
            "Real Betis Balompié": "Real Betis",
            "Real Sociedad de Fútbol": "Sociedad",
            "Deportivo Alavés": "Alaves",
            "RC Celta de Vigo": "Celta",
            "FC Internazionale Milano": "Inter",
            "Bologna FC 1909": "Bologna",
            "Parma Calcio 1913": "Parma",
            "Hellas Verona FC": "Verona",
            "US Sassuolo Calcio": "Sassuolo",
            "AC Pisa 1909": "Pisa",
            "Como 1907": "Como",
            "Borussia Dortmund": "Dortmund",
            "1. FSV Mainz 05": "Mainz",
            "Borussia Mönchengladbach": "M'gladbach",
            "FC St. Pauli 1910": "St Pauli",
            "1. FC Heidenheim 1846": "Heidenheim",
            "Olympique Lyonnais": "Lyon",
            "Stade Rennais FC 1901": "Rennes",
            "Racing Club de Lens": "Lens",
            "Stade Brestois 29": "Brest",
            "Olympique de Marseille": "Marseille",
            "Paris Saint-Germain FC": "Paris SG",
            "PSV": "PSV Eindhoven",
            "AZ": "AZ Alkmaar",
            "NEC": "N.E.C.",
            "FC Twente '65": "Twente",
            "Feyenoord Rotterdam": "Feyenoord",
            "Sporting Clube de Portugal": "Sp Lisbon",
            "Sport Lisboa e Benfica": "Benfica",
            "Vitória SC": "Vitoria",
            "GD Estoril Praia": "Estoril",
            "Sporting Clube de Braga": "Sp Braga",
            "CF Estrela da Amadora": "Estrela",
            "Heart Of Midlothian": "Hearts",
            "Ayr Utd": "Ayr",
            "Partick": "Partick Thistle",
            "Aris Thessalonikis": "Aris",
            "AEK Athens FC": "AEK",
            "Patro Eisden": "Patro Eisden",
            "OH Leuven": "Oud-Heverlee Leuven",
            "Başakşehir": "Buyuksehyr",
            "Bodrum FK": "Bodrumspor",
            "OFI": "OFI Crete",
        }

        def match_and_save_logo(api_team_name, api_logo, db_teams, db_team_names):
            if not api_team_name or not api_logo:
                return

            search_name = CUSTOM_MAPPING.get(api_team_name, api_team_name)
            db_team = next((t for t in db_teams if t.name == search_name), None)

            if not db_team:
                matches = difflib.get_close_matches(search_name, db_team_names, n=1, cutoff=0.65)
                if matches:
                    db_team = next((t for t in db_teams if t.name == matches[0]), None)

            if db_team:
                db_team.logo = api_logo
                db_team.save()
                self.stdout.write(f"  [+] Cocok: {api_team_name} -> {db_team.name}")
            else:
                self.stdout.write(f"  [-] Tidak ditemukan: {api_team_name} (Dicari sebagai: {search_name})")

        if fd_org_key:
            self.stdout.write(self.style.SUCCESS("\n=== FASE 1: SINKRONISASI DARI FOOTBALL-DATA.ORG ==="))
            FD_ORG_MAPPING = {
                'E0': 'PL', 'SP1': 'PD', 'I1': 'SA', 'D1': 'BL1',
                'F1': 'FL1', 'N1': 'DED', 'P1': 'PPL'
            }
            headers_fd = {'X-Auth-Token': fd_org_key}
            
            for league_code, api_league_code in FD_ORG_MAPPING.items():
                league_obj = League.objects.filter(name=league_code).first()
                if not league_obj:
                    continue

                self.stdout.write(f"\nMenarik logo (FD.ORG) untuk liga {league_code}...")
                url = f"https://api.football-data.org/v4/competitions/{api_league_code}/teams"
                
                response = requests.get(url, headers=headers_fd)
                if response.status_code == 429:
                    time.sleep(10)
                    response = requests.get(url, headers=headers_fd)

                if response.status_code != 200:
                    continue

                data = response.json()
                db_teams = list(Team.objects.filter(league=league_obj))
                db_team_names = [t.name for t in db_teams]
                
                for item in data.get('teams', []):
                    api_name = item.get('name') or item.get('shortName')
                    api_logo = item.get('crest')
                    match_and_save_logo(api_name, api_logo, db_teams, db_team_names)
                
                time.sleep(2)

        if api_sports_key:
            self.stdout.write(self.style.SUCCESS("\n=== FASE 2: SINKRONISASI DARI API-SPORTS ==="))
            API_SPORTS_MAPPING = {
                'B1': 144, 'SC0': 179, 'T1': 203, 'G1': 197
            }
            headers_api_sports = {'x-apisports-key': api_sports_key}
            season = 2024
            
            for league_code, api_id in API_SPORTS_MAPPING.items():
                league_obj = League.objects.filter(name=league_code).first()
                if not league_obj:
                    continue

                self.stdout.write(f"\nMenarik logo (API-Sports) untuk liga {league_code}...")
                url = f"https://v3.football.api-sports.io/teams?league={api_id}&season={season}"
                response = requests.get(url, headers=headers_api_sports)
                
                if response.status_code != 200:
                    continue

                data = response.json()
                db_teams = list(Team.objects.filter(league=league_obj))
                db_team_names = [t.name for t in db_teams]
                
                for item in data.get('response', []):
                    api_name = item['team']['name']
                    api_logo = item['team']['logo']
                    match_and_save_logo(api_name, api_logo, db_teams, db_team_names)

        self.stdout.write(self.style.SUCCESS("\nProses penarikan logo selesai dari kedua sumber!"))