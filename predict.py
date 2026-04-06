import pandas as pd
import joblib

# ==========================================
# 1. MEMUAT DATASET UNTUK SIMULASI
# ==========================================
print("Memuat data untuk prediksi...")
df = pd.read_csv('dataset/belanda/dataset_siap_ml.csv')

# Membersihkan nama kolom (wajib sama dengan saat training)
df.columns = df.columns.str.replace('<', '_under_').str.replace('>', '_over_')

# Mengambil 5 pertandingan paling akhir di dataset sebagai contoh prediksi
sample_matches = df.tail(5).copy().reset_index(drop=True)

# Memisahkan Fitur (X)
cols_to_drop = ['Div', 'Date', 'Time', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR', 'O_U_2.5', 'BTTS']
X_new = sample_matches.drop(columns=cols_to_drop)

# Mengisi NaN jika ada
X_new = X_new.fillna(X_new.mean())

# ==========================================
# 2. MEMUAT MODEL DAN SCALER
# ==========================================
try:
    print("Memuat Model Machine Learning...")
    # Model HDA (Draw No Bet) 
    model_dnb = joblib.load('model/belanda/model_rf_dnb.pkl')
    scaler_hda = joblib.load('model/belanda/scaler_hda.pkl')

    # Model Over/Under
    model_ou = joblib.load('model/belanda/model_lr_ou.pkl')
    scaler_ou = joblib.load('model/belanda/scaler_ou.pkl')

    # Model BTTS
    model_btts = joblib.load('model/belanda/model_lr_btts.pkl')
    scaler_btts = joblib.load('model/belanda/scaler_btts.pkl')
except Exception as e:
    print(f"\n[ERROR] Gagal memuat file model. Pastikan file .pkl ada di folder yang sama.\nDetail: {e}")
    exit()

# ==========================================
# 3. PREDIKSI
# ==========================================
# Melakukan scaling data secara terpisah menggunakan scaler masing-masing model
X_scaled_hda = pd.DataFrame(scaler_hda.transform(X_new), columns=X_new.columns)
X_scaled_ou = pd.DataFrame(scaler_ou.transform(X_new), columns=X_new.columns)
X_scaled_btts = pd.DataFrame(scaler_btts.transform(X_new), columns=X_new.columns)

# Menghasilkan tebakan
preds_dnb = model_dnb.predict(X_scaled_hda)
preds_ou = model_ou.predict(X_scaled_ou)
preds_btts = model_btts.predict(X_scaled_btts)

# Mengambil probabilitas
prob_dnb = model_dnb.predict_proba(X_scaled_hda)
prob_ou = model_ou.predict_proba(X_scaled_ou)
prob_btts = model_btts.predict_proba(X_scaled_btts)

# ==========================================
# 4. MENAMPILKAN HASIL AKHIR & VALIDASI
# ==========================================
print("\n" + "="*70)
print("   HASIL PREDIKSI VS HASIL ASLI (VALIDASI MODEL)")
print("="*70)

for i in range(len(sample_matches)):
    home = sample_matches.iloc[i]['HomeTeam']
    away = sample_matches.iloc[i]['AwayTeam']
    fthg = sample_matches.iloc[i]['FTHG']
    ftag = sample_matches.iloc[i]['FTAG']
    ftr = sample_matches.iloc[i]['FTR']
    
    # 1. Format hasil DNB
    if preds_dnb[i] == 1:
        dnb_pred = f"{home} Win"
        dnb_conf = prob_dnb[i][1] * 100
    else:
        dnb_pred = f"{away} Win"
        dnb_conf = prob_dnb[i][0] * 100
    
    # Status DNB (Jika Draw, maka taruhan dianggap batal/tidak dihitung di DNB)
    if ftr == 'D':
        dnb_status = "DRAW (REFUND)"
    elif (preds_dnb[i] == 1 and ftr == 'H') or (preds_dnb[i] == 0 and ftr == 'A'):
        dnb_status = "✅ WIN"
    else:
        dnb_status = "❌ LOSE"

    # 2. Format hasil O/U
    ou_pred = "Over 2.5" if preds_ou[i] == 1 else "Under 2.5"
    ou_conf = prob_ou[i][1] * 100 if preds_ou[i] == 1 else prob_ou[i][0] * 100
    actual_ou = "Over 2.5" if (fthg + ftag) > 2.5 else "Under 2.5"
    ou_status = "✅" if ou_pred == actual_ou else "❌"

    # 3. Format hasil BTTS
    btts_pred = "Yes" if preds_btts[i] == 1 else "No"
    btts_conf = prob_btts[i][1] * 100 if preds_btts[i] == 1 else prob_btts[i][0] * 100
    actual_btts = "Yes" if (fthg > 0 and ftag > 0) else "No"
    btts_status = "✅" if btts_pred == actual_btts else "❌"

    print(f"LAGA: {home} {int(fthg)} - {int(ftag)} {away}")
    print(f"  ⚽ DNB Prediction : {dnb_pred:<15} ({dnb_conf:.1f}%) -> {dnb_status}")
    print(f"  📈 O/U Prediction : {ou_pred:<15} ({ou_conf:.1f}%) -> {ou_status} (Actual: {actual_ou})")
    print(f"  🥅 BTTS Prediction: {btts_pred:<15} ({btts_conf:.1f}%) -> {btts_status} (Actual: {actual_btts})")
    print("-" * 70)