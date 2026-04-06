import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ==========================================
# 1. PERSIAPAN DATA (DATA PREPARATION)
# ==========================================
print("Memuat dataset untuk Prediksi Home vs Away (Tanpa Draw)...")
df = pd.read_csv('dataset/yunani/dataset_siap_ml.csv')

# ---> PERUBAHAN UTAMA: Membuang semua baris dengan hasil 'Draw' (Seri) <---
df = df[df['FTR'] != 'D'].reset_index(drop=True)
print(f"Sisa pertandingan setelah 'Draw' dibuang: {len(df)} baris")

# Memisahkan Fitur (X) dan Target (y)
cols_to_drop = ['Div', 'Date', 'Time', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR', 'O_U_2.5', 'BTTS']
X = df.drop(columns=cols_to_drop)

# Menghapus/mengganti karakter khusus dari nama kolom (Mencegah error)
X.columns = X.columns.str.replace('<', '_under_').str.replace('>', '_over_')

# Mengubah target 'FTR' menjadi numerik biner (Karena Draw sudah dihapus)
# A (Away Win) = 0, H (Home Win) = 1
y = df['FTR'].map({'A': 0, 'H': 1})

# Mengisi nilai kosong (NaN) dengan rata-rata kolom tersebut
X = X.fillna(X.mean())

# ==========================================
# 2. CHRONOLOGICAL TRAIN-TEST SPLIT
# ==========================================
split_index = int(len(df) * 0.8)

X_train, X_test = X.iloc[:split_index], X.iloc[split_index:]
y_train, y_test = y.iloc[:split_index], y.iloc[split_index:]

print(f"Jumlah Data Latih: {len(X_train)} baris")
print(f"Jumlah Data Uji: {len(X_test)} baris\n")

# ==========================================
# 3. FEATURE SCALING (STANDARDISASI)
# ==========================================
scaler = StandardScaler()
X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=X_train.columns)
X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=X_test.columns)

target_names = ['Away Win (0)', 'Home Win (1)']

# ==========================================
# 4. PELATIHAN MODEL: RANDOM FOREST
# ==========================================
print("="*40)
print("EVALUASI MODEL: RANDOM FOREST (HOME VS AWAY / DRAW NO BET)")
print("="*40)

# Menggunakan Random Forest dengan konfigurasi terbaik dari eksperimen sebelumnya
rf_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
rf_model.fit(X_train_scaled, y_train)

rf_preds = rf_model.predict(X_test_scaled)

# Evaluasi Hasil
print(f"\nAkurasi Random Forest (Tanpa Draw): {accuracy_score(y_test, rf_preds):.4f}")
print(classification_report(y_test, rf_preds, target_names=target_names, zero_division=0))

# ==========================================
# 5. MENAMPILKAN FITUR PALING BERPENGARUH
# ==========================================
print("\n" + "="*40)
print("PENGARUH FITUR (FEATURE IMPORTANCE):")
print("="*40)
# Mengambil tingkat kepentingan fitur dari model Random Forest
importances = pd.DataFrame({
    'Fitur': X.columns,
    'Bobot/Pentingnya': rf_model.feature_importances_
})
# Mengurutkan dari yang paling berpengaruh hingga yang terendah
importances = importances.sort_values(by='Bobot/Pentingnya', ascending=False)
print(importances.to_string(index=False))

# ==========================================
# 6. MENYIMPAN MODEL & SCALER
# ==========================================
joblib.dump(rf_model, 'model/yunani/model_rf_dnb.pkl')
joblib.dump(scaler, 'model/yunani/scaler_hda.pkl')
print("\n[SUCCESS] Model disimpan sebagai 'model_rf_dnb.pkl'")
print("[SUCCESS] Scaler disimpan sebagai 'scaler_hda.pkl'")