from django.core.management.base import BaseCommand
from django.db.models import Q
from api.models import League, Team, MatchRecord, UserBet
from api.api import LEAGUE_FOLDER_MAP

import pandas as pd
import numpy as np
import joblib
import os
import io
from curl_cffi import requests 
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class Command(BaseCommand):
    help = 'Update Hasil Pertandingan & Selesaikan Taruhan User'

    def handle(self, *args, **kwargs):
        self.stdout.write("🚀 START: Cek Hasil Laga Terbaru...")
        base_url = 'https://football-data.co.uk/mmz4281/2526/'
        
        for code, folder in LEAGUE_FOLDER_MAP.items():
            url = f"{base_url}{code}.csv"
            try:
                res = requests.get(url, impersonate="chrome110", timeout=20, verify=False)
                if res.status_code != 200: continue
                df = pd.read_csv(io.StringIO(res.content.decode('utf-8', errors='ignore')))
                df = df.dropna(subset=['HomeTeam', 'AwayTeam'])
                if 'Time' not in df.columns: df['Time'] = '12:00'
                df['Datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], format='mixed', dayfirst=True)
                df = df.sort_values('Datetime')
            except Exception:
                continue

            # Cari kapan match terakhir dari liga ini di database kita
            latest_match = MatchRecord.objects.filter(league__name=code).order_by('-date', '-time').first()
            if latest_match:
                latest_dt = pd.to_datetime(f"{latest_match.date} {latest_match.time}")
                df = df[df['Datetime'] > latest_dt].copy()
            
            if df.empty:
                self.stdout.write(f"💤 {code}: Tidak ada laga baru.")
                continue

            self.stdout.write(self.style.SUCCESS(f"📥 {code}: Ditemukan {len(df)} laga baru. Memproses..."))
            self.process_new_matches(df, code, folder)

    def process_new_matches(self, df, code, folder):
        model_dir = os.path.join(os.getcwd(), 'model', folder)
        try:
            m_dnb = joblib.load(os.path.join(model_dir, 'model_rf_dnb.pkl'))
            s_hda = joblib.load(os.path.join(model_dir, 'scaler_hda.pkl'))
            m_ou = joblib.load(os.path.join(model_dir, 'model_lr_ou.pkl'))
            s_ou = joblib.load(os.path.join(model_dir, 'scaler_ou.pkl'))
            m_btts = joblib.load(os.path.join(model_dir, 'model_lr_btts.pkl'))
            s_btts = joblib.load(os.path.join(model_dir, 'scaler_btts.pkl'))
        except: 
            return # Skip kalau model ML belum ada di folder

        league_obj, _ = League.objects.get_or_create(name=code)
        
        for _, row in df.iterrows():
            h_name, a_name = row['HomeTeam'], row['AwayTeam']
            h_team, _ = Team.objects.get_or_create(league=league_obj, name=h_name)
            a_team, _ = Team.objects.get_or_create(league=league_obj, name=a_name)

            h2h = MatchRecord.objects.filter(
                Q(home_team=h_team, away_team=a_team) | Q(home_team=a_team, away_team=h_team)
            ).order_by('-date')[:5]
            hw = sum(1 for m in h2h if (m.home_team == h_team and m.ftr == 'H') or (m.away_team == h_team and m.ftr == 'A'))
            h2h_rate = hw / len(h2h) if len(h2h) > 0 else 0.5

            feat = {
                'Home_Pts_Last_5': h_team.pts_last_5, 'Away_Pts_Last_5': a_team.pts_last_5,
                'Home_Avg_GF': h_team.avg_gf, 'Home_Avg_GA': h_team.avg_ga,
                'Away_Avg_GF': a_team.avg_gf, 'Away_Avg_GA': a_team.avg_ga,
                'Home_Avg_SOT': h_team.avg_sot, 'Away_Avg_SOT': a_team.avg_sot,
                'H2H_Home_Win_Rate': h2h_rate, 'Home_Elo': h_team.elo_rating, 'Away_Elo': a_team.elo_rating,
                'Home_Goal_Difference': h_team.avg_gf - h_team.avg_ga, 'Away_Goal_Difference': a_team.avg_gf - a_team.avg_ga,
                'Elo_Difference': (h_team.elo_rating + 80) - a_team.elo_rating,
                'PSH': row.get('PSH', row.get('B365H', 1)), 'PSD': row.get('PSD', row.get('B365D', 1)),
                'PSA': row.get('PSA', row.get('B365A', 1)),
                'P_over_2.5': row.get('P>2.5', row.get('B365>2.5', 1)), 'P_under_2.5': row.get('P<2.5', row.get('B365<2.5', 1))
            }

            f_df = pd.DataFrame([feat]).fillna(0)
            
            c_hda = list(s_hda.feature_names_in_)
            for c in c_hda: 
                if c not in f_df: f_df[c] = 0
            p_dnb = m_dnb.predict_proba(s_hda.transform(f_df[c_hda]))[0]
            
            c_ou = list(s_ou.feature_names_in_)
            for c in c_ou: 
                if c not in f_df: f_df[c] = 0
            p_ou = m_ou.predict_proba(s_ou.transform(f_df[c_ou]))[0]

            c_btts = list(s_btts.feature_names_in_)
            for c in c_btts: 
                if c not in f_df: f_df[c] = 0
            p_btts = m_btts.predict_proba(s_btts.transform(f_df[c_btts]))[0]

            fthg = int(row.get('FTHG', 0)) if pd.notna(row.get('FTHG')) else 0
            ftag = int(row.get('FTAG', 0)) if pd.notna(row.get('FTAG')) else 0
            if fthg > ftag: ftr = 'H'; h_pts, a_pts = 3, 0; s_h, s_a = 1, 0
            elif fthg < ftag: ftr = 'A'; h_pts, a_pts = 0, 3; s_h, s_a = 0, 1
            else: ftr = 'D'; h_pts, a_pts = 1, 1; s_h, s_a = 0.5, 0.5

            # Save Match
            MatchRecord.objects.create(
                league=league_obj, date=row['Datetime'].date(), time=row['Datetime'].time(),
                home_team=h_team, away_team=a_team, fthg=fthg, ftag=ftag, ftr=ftr,
                home_elo=h_team.elo_rating, away_elo=a_team.elo_rating,
                home_pts_last_5=h_team.pts_last_5, away_pts_last_5=a_team.pts_last_5,
                home_avg_gf=h_team.avg_gf, home_avg_ga=h_team.avg_ga,
                away_avg_gf=a_team.avg_gf, away_avg_ga=a_team.avg_ga,
                home_avg_sot=h_team.avg_sot, away_avg_sot=a_team.avg_sot,
                h2h_home_win_rate=h2h_rate, home_goal_diff=feat['Home_Goal_Difference'],
                away_goal_diff=feat['Away_Goal_Difference'], elo_diff=feat['Elo_Difference'],
                dnb_prediction=h_name + ' Win' if p_dnb[1]>p_dnb[0] else a_name + ' Win',
                dnb_home_prob=p_dnb[1]*100, dnb_away_prob=p_dnb[0]*100,
                ou_prediction='Over 2.5' if p_ou[1]>p_ou[0] else 'Under 2.5',
                ou_over_prob=p_ou[1]*100, ou_under_prob=p_ou[0]*100,
                btts_prediction='Yes' if p_btts[1]>p_btts[0] else 'No',
                btts_yes_prob=p_btts[1]*100, btts_no_prob=p_btts[0]*100
            )

            # Update ELO & Points
            we_h = 1 / (10 ** ((a_team.elo_rating - (h_team.elo_rating + 80)) / 400) + 1)
            h_team.elo_rating += 20 * (s_h - we_h)
            a_team.elo_rating += 20 * (s_a - (1 - we_h))
            h_team.pts_last_5 = h_pts; a_team.pts_last_5 = a_pts
            h_team.save(); a_team.save()

            # SETTLEMENT TARUHAN USER (Otomatis Tambah Koin Kalau Menang)
            pending_bets = UserBet.objects.filter(status='Pending', match_date=row['Datetime'].date(), home_team=h_name, away_team=a_name)
            for bet in pending_bets:
                won = False
                if bet.bet_category == 'DNB':
                    if ftr == 'D':
                        bet.status = 'Refund'
                        bet.user.profile.points += bet.stake
                    elif bet.bet_choice == h_name and ftr == 'H': won = True
                    elif bet.bet_choice == a_name and ftr == 'A': won = True
                elif bet.bet_category == 'OU':
                    tg = fthg + ftag
                    if bet.bet_choice == 'Over 2.5' and tg > 2.5: won = True
                    elif bet.bet_choice == 'Under 2.5' and tg < 2.5: won = True
                elif bet.bet_category == 'BTTS':
                    btts = fthg > 0 and ftag > 0
                    if bet.bet_choice == 'Yes' and btts: won = True
                    elif bet.bet_choice == 'No' and not btts: won = True

                if bet.status != 'Refund':
                    if won:
                        bet.status = 'Won'
                        bet.user.profile.points += int(bet.stake * bet.odds)
                    else: 
                        bet.status = 'Lost'
                
                bet.user.profile.save()
                bet.save()
