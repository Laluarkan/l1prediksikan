import os
import glob
import joblib
import numpy as np
import pandas as pd
from django.conf import settings
from django.core.management.base import BaseCommand
from api.models import League, Team, MatchRecord

class Command(BaseCommand):
    help = 'Migrasi data 3 musim, Batch Prediksi, dan status terakhir tim dari semua folder liga ke DB'

    def handle(self, *args, **kwargs):
        dataset_folder = 'dataset'
        search_pattern = os.path.join(dataset_folder, "**", "dataset_siap_ml.csv")
        all_files = glob.glob(search_pattern, recursive=True)
        
        if not all_files:
            self.stdout.write(self.style.ERROR('File tidak ditemukan!'))
            return

        self.stdout.write(f'Membaca {len(all_files)} file dataset...')
        df_list = [pd.read_csv(f) for f in all_files]
        df = pd.concat(df_list, ignore_index=True)

        df.columns = df.columns.str.replace('<', '_under_').str.replace('>', '_over_')
        df = df.fillna(0)
        df['Datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], format='mixed', dayfirst=True)
        df = df.sort_values('Datetime')

        # === PROSES BATCH PREDIKSI ===
        self.stdout.write('Memproses AI Batch Prediction untuk semua pertandingan historis...')
        df['dnb_prediction'] = ''
        df['dnb_home_prob'] = 0.0
        df['dnb_away_prob'] = 0.0
        df['ou_prediction'] = ''
        df['ou_over_prob'] = 0.0
        df['ou_under_prob'] = 0.0
        df['btts_prediction'] = ''
        df['btts_yes_prob'] = 0.0
        df['btts_no_prob'] = 0.0

        LEAGUE_FOLDER_MAP = {
            'N1': 'belanda', 'B1': 'belgia', 'E0': 'inggris', 'I1': 'itali',
            'D1': 'jerman', 'F1': 'perancis', 'P1': 'portugal', 'SC0': 'skotlandia',
            'SP1': 'spanyol', 'T1': 'turki', 'G1': 'yunani'
        }
        cols_to_drop = ['Div', 'Date', 'Time', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR', 'O_U_2.5', 'BTTS', 'Datetime']

        for league_code, group in df.groupby('Div'):
            folder_name = LEAGUE_FOLDER_MAP.get(league_code, league_code.lower())
            model_dir = os.path.join(settings.BASE_DIR, 'model', folder_name)

            if not os.path.exists(model_dir):
                continue

            try:
                model_dnb = joblib.load(os.path.join(model_dir, 'model_rf_dnb.pkl'))
                scaler_hda = joblib.load(os.path.join(model_dir, 'scaler_hda.pkl'))
                model_ou = joblib.load(os.path.join(model_dir, 'model_lr_ou.pkl'))
                scaler_ou = joblib.load(os.path.join(model_dir, 'scaler_ou.pkl'))
                model_btts = joblib.load(os.path.join(model_dir, 'model_lr_btts.pkl'))
                scaler_btts = joblib.load(os.path.join(model_dir, 'scaler_btts.pkl'))

                X_raw = group.drop(columns=cols_to_drop, errors='ignore').copy()
                all_expected_cols = set(list(scaler_hda.feature_names_in_) + list(scaler_ou.feature_names_in_) + list(scaler_btts.feature_names_in_))

                for col in all_expected_cols:
                    if col not in X_raw.columns:
                        X_raw[col] = 0

                cols_hda = scaler_hda.feature_names_in_
                X_scaled_hda = pd.DataFrame(scaler_hda.transform(X_raw[cols_hda]), columns=cols_hda)
                cols_ou = scaler_ou.feature_names_in_
                X_scaled_ou = pd.DataFrame(scaler_ou.transform(X_raw[cols_ou]), columns=cols_ou)
                cols_btts = scaler_btts.feature_names_in_
                X_scaled_btts = pd.DataFrame(scaler_btts.transform(X_raw[cols_btts]), columns=cols_btts)

                prob_dnb = model_dnb.predict_proba(X_scaled_hda)
                prob_ou = model_ou.predict_proba(X_scaled_ou)
                prob_btts = model_btts.predict_proba(X_scaled_btts)

                df.loc[group.index, 'dnb_away_prob'] = prob_dnb[:, 0] * 100
                df.loc[group.index, 'dnb_home_prob'] = prob_dnb[:, 1] * 100
                df.loc[group.index, 'dnb_prediction'] = np.where(prob_dnb[:, 1] > prob_dnb[:, 0], group['HomeTeam'] + ' Win', group['AwayTeam'] + ' Win')

                df.loc[group.index, 'ou_under_prob'] = prob_ou[:, 0] * 100
                df.loc[group.index, 'ou_over_prob'] = prob_ou[:, 1] * 100
                df.loc[group.index, 'ou_prediction'] = np.where(prob_ou[:, 1] > prob_ou[:, 0], 'Over 2.5', 'Under 2.5')

                df.loc[group.index, 'btts_no_prob'] = prob_btts[:, 0] * 100
                df.loc[group.index, 'btts_yes_prob'] = prob_btts[:, 1] * 100
                df.loc[group.index, 'btts_prediction'] = np.where(prob_btts[:, 1] > prob_btts[:, 0], 'Yes', 'No')

            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Gagal memprediksi liga {league_code}: {e}"))
                continue

        # === MENYIMPAN KE DATABASE ===
        latest_team_stats = {}
        teams_cache = {}
        matches_to_create = []

        for index, row in df.iterrows():
            div = row['Div']
            home = row['HomeTeam']
            away = row['AwayTeam']
            latest_team_stats[home] = {
                'league': div, 'elo_rating': row['Home_Elo'], 'pts_last_5': row['Home_Pts_Last_5'],
                'avg_gf': row['Home_Avg_GF'], 'avg_ga': row['Home_Avg_GA'], 'avg_sot': row['Home_Avg_SOT'], 'goal_diff': row['Home_Goal_Difference']
            }
            latest_team_stats[away] = {
                'league': div, 'elo_rating': row['Away_Elo'], 'pts_last_5': row['Away_Pts_Last_5'],
                'avg_gf': row['Away_Avg_GF'], 'avg_ga': row['Away_Avg_GA'], 'avg_sot': row['Away_Avg_SOT'], 'goal_diff': row['Away_Goal_Difference']
            }

        self.stdout.write('Memperbarui data Liga dan Tim...')
        for team_name, stats in latest_team_stats.items():
            league_obj, _ = League.objects.get_or_create(name=stats['league'])
            team_obj, _ = Team.objects.update_or_create(
                league=league_obj, name=team_name,
                defaults={
                    'elo_rating': stats['elo_rating'], 'pts_last_5': stats['pts_last_5'],
                    'avg_gf': stats['avg_gf'], 'avg_ga': stats['avg_ga'],
                    'avg_sot': stats['avg_sot'], 'goal_diff': stats['goal_diff']
                }
            )
            teams_cache[team_name] = team_obj 

        self.stdout.write('Menyimpan riwayat pertandingan ke Database...')
        for index, row in df.iterrows():
            match = MatchRecord(
                league=teams_cache[row['HomeTeam']].league, date=row['Datetime'].date(), time=row['Datetime'].time(),
                home_team=teams_cache[row['HomeTeam']], away_team=teams_cache[row['AwayTeam']],
                fthg=row['FTHG'], ftag=row['FTAG'], ftr=row['FTR'],
                home_elo=row['Home_Elo'], away_elo=row['Away_Elo'],
                home_pts_last_5=row['Home_Pts_Last_5'], away_pts_last_5=row['Away_Pts_Last_5'],
                home_avg_gf=row['Home_Avg_GF'], home_avg_ga=row['Home_Avg_GA'],
                away_avg_gf=row['Away_Avg_GF'], away_avg_ga=row['Away_Avg_GA'],
                home_avg_sot=row['Home_Avg_SOT'], away_avg_sot=row['Away_Avg_SOT'],
                h2h_home_win_rate=row['H2H_Home_Win_Rate'],
                home_goal_diff=row['Home_Goal_Difference'], away_goal_diff=row['Away_Goal_Difference'], elo_diff=row['Elo_Difference'],
                dnb_prediction=row.get('dnb_prediction', ''), dnb_home_prob=row.get('dnb_home_prob', 0.0), dnb_away_prob=row.get('dnb_away_prob', 0.0),
                ou_prediction=row.get('ou_prediction', ''), ou_over_prob=row.get('ou_over_prob', 0.0), ou_under_prob=row.get('ou_under_prob', 0.0),
                btts_prediction=row.get('btts_prediction', ''), btts_yes_prob=row.get('btts_yes_prob', 0.0), btts_no_prob=row.get('btts_no_prob', 0.0)
            )
            matches_to_create.append(match)

        # Hapus riwayat lama (untuk reset) lalu insert data baru
        MatchRecord.objects.all().delete()
        MatchRecord.objects.bulk_create(matches_to_create, batch_size=500)

        self.stdout.write(self.style.SUCCESS(f'Berhasil! AI telah memprediksi dan menyimpan {len(matches_to_create)} pertandingan.'))