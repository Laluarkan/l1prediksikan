import pandas as pd
import os
import glob
import numpy as np

# 1. KONFIGURASI FOLDER
dataset_path = 'dataset/jerman' 

# Mengumpulkan semua file CSV dari folder dan subfolder
all_files = glob.glob(os.path.join(dataset_path, "**", "*.csv"), recursive=True)

df_list = []
for file in all_files:
    try:
        temp_df = pd.read_csv(file)
        df_list.append(temp_df)
    except Exception as e:
        print(f"Gagal membaca {file}: {e}")

df = pd.concat(df_list, ignore_index=True)

# 2. PEMBERSIHAN & PENGURUTAN WAKTU
if 'Time' not in df.columns:
    df['Time'] = '00:00'
df['Time'] = df['Time'].fillna('00:00')

df['Datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], format='mixed', dayfirst=True)
df = df.sort_values('Datetime').reset_index(drop=True)

# PENDETEKSI MUSIM OTOMATIS
df['Season'] = 1
current_season = 1
for i in range(1, len(df)):
    if (df.loc[i, 'Datetime'] - df.loc[i-1, 'Datetime']).days > 45:
        current_season += 1
    df.loc[i, 'Season'] = current_season

# 3. PERSIAPAN VARIABEL TARGET
df['O_U_2.5'] = np.where((df['FTHG'] + df['FTAG']) > 2.5, 1, 0)
df['BTTS'] = np.where((df['FTHG'] > 0) & (df['FTAG'] > 0), 1, 0)

# 4. REKAYASA FITUR (HISTORIS, H2H & ELO RATING)
team_history = {}
h2h_history = {}
team_elo = {} 
features_list = []

K_FACTOR = 20       
HOME_ADVANTAGE = 80 
INITIAL_ELO = 1500  

for index, row in df.iterrows():
    home = row['HomeTeam']
    away = row['AwayTeam']
    
    if home not in team_history:
        team_history[home] = {'points': [], 'goals_scored': [], 'goals_conceded': [], 'shots_on_target': [], 'fouls': []}
        team_elo[home] = INITIAL_ELO 
    if away not in team_history:
        team_history[away] = {'points': [], 'goals_scored': [], 'goals_conceded': [], 'shots_on_target': [], 'fouls': []}
        team_elo[away] = INITIAL_ELO 
        
    matchup = tuple(sorted([home, away]))
    if matchup not in h2h_history:
        h2h_history[matchup] = [] 

    def get_avg(history_list, last_n=5):
        return np.mean(history_list[-last_n:]) if len(history_list) > 0 else 0
    def get_sum(history_list, last_n=5):
        return sum(history_list[-last_n:]) if len(history_list) > 0 else 0

    h_points_last_5 = get_sum(team_history[home]['points'])
    h_avg_goals_scored = get_avg(team_history[home]['goals_scored'])
    h_avg_goals_conceded = get_avg(team_history[home]['goals_conceded'])
    h_avg_sot = get_avg(team_history[home]['shots_on_target'])
    
    a_points_last_5 = get_sum(team_history[away]['points'])
    a_avg_goals_scored = get_avg(team_history[away]['goals_scored'])
    a_avg_goals_conceded = get_avg(team_history[away]['goals_conceded'])
    a_avg_sot = get_avg(team_history[away]['shots_on_target'])

    h2h_matches = h2h_history[matchup][-5:]
    h2h_home_win_rate = h2h_matches.count(home) / len(h2h_matches) if len(h2h_matches) > 0 else 0.5 

    current_home_elo = team_elo[home]
    current_away_elo = team_elo[away]
    
    # ---> TAMBAHAN: Fitur Difference <---
    home_goal_diff = h_avg_goals_scored - h_avg_goals_conceded
    away_goal_diff = a_avg_goals_scored - a_avg_goals_conceded
    elo_diff_feature = (current_home_elo + HOME_ADVANTAGE) - current_away_elo
    
    features_list.append({
        'Home_Pts_Last_5': h_points_last_5,
        'Away_Pts_Last_5': a_points_last_5,
        'Home_Avg_GF': h_avg_goals_scored,
        'Home_Avg_GA': h_avg_goals_conceded,
        'Away_Avg_GF': a_avg_goals_scored,
        'Away_Avg_GA': a_avg_goals_conceded,
        'Home_Avg_SOT': h_avg_sot,
        'Away_Avg_SOT': a_avg_sot,
        'H2H_Home_Win_Rate': h2h_home_win_rate,
        'Home_Elo': current_home_elo, 
        'Away_Elo': current_away_elo,
        'Home_Goal_Difference': home_goal_diff, 
        'Away_Goal_Difference': away_goal_diff, 
        'Elo_Difference': elo_diff_feature      
    })

    if row['FTR'] == 'H':
        h_pt, a_pt = 3, 0
        w_home, w_away = 1, 0
        h2h_history[matchup].append(home)
    elif row['FTR'] == 'A':
        h_pt, a_pt = 0, 3
        w_home, w_away = 0, 1
        h2h_history[matchup].append(away)
    else:
        h_pt, a_pt = 1, 1
        w_home, w_away = 0.5, 0.5
        h2h_history[matchup].append('Draw')

    elo_diff = current_away_elo - (current_home_elo + HOME_ADVANTAGE)
    we_home = 1 / (1 + 10 ** (elo_diff / 400))
    we_away = 1 - we_home

    team_elo[home] = current_home_elo + K_FACTOR * (w_home - we_home)
    team_elo[away] = current_away_elo + K_FACTOR * (w_away - we_away)

    team_history[home]['points'].append(h_pt)
    team_history[home]['goals_scored'].append(row.get('FTHG', 0))
    team_history[home]['goals_conceded'].append(row.get('FTAG', 0))
    team_history[home]['shots_on_target'].append(row.get('HST', 0))
    
    team_history[away]['points'].append(a_pt)
    team_history[away]['goals_scored'].append(row.get('FTAG', 0))
    team_history[away]['goals_conceded'].append(row.get('FTHG', 0))
    team_history[away]['shots_on_target'].append(row.get('AST', 0))

# 5. MENGGABUNGKAN FITUR BARU KE DATAFRAME UTAMA
features_df = pd.DataFrame(features_list)
df_final = pd.concat([df, features_df], axis=1)

# 6. MEMILIH KOLOM FINAL
columns_to_keep = [
    'Season', 'Div', 'Date', 'Time', 'HomeTeam', 'AwayTeam', 
    'FTHG', 'FTAG', 'FTR', 'O_U_2.5', 'BTTS',
    'Home_Pts_Last_5', 'Away_Pts_Last_5',
    'Home_Avg_GF', 'Home_Avg_GA', 'Away_Avg_GF', 'Away_Avg_GA',
    'Home_Avg_SOT', 'Away_Avg_SOT', 'H2H_Home_Win_Rate',
    'Home_Elo', 'Away_Elo',
    'Home_Goal_Difference', 'Away_Goal_Difference', 'Elo_Difference' 
]

optional_odds = ['PSH', 'PSD', 'PSA', 'P>2.5', 'P<2.5', 'Avg>2.5', 'Avg<2.5']
for col in optional_odds:
    if col in df_final.columns:
        columns_to_keep.append(col)

df_final = df_final[columns_to_keep]

# ---> PERUBAHAN: HANYA MEMBUANG BEBERAPA PERTANDINGAN AWAL SAAT HISTORI MASIH KOSONG <---
df_final = df_final[(df_final['Home_Pts_Last_5'] > 0) | (df_final['Away_Pts_Last_5'] > 0)]

# Drop kolom 'Season' jika tidak diperlukan di Machine Learning
df_final = df_final.drop(columns=['Season']).reset_index(drop=True)

df_final.to_csv('dataset/jerman/dataset_siap_ml.csv', index=False)
print("Berhasil! Fitur Difference ditambahkan dan data 3 musim utuh telah disimpan.")