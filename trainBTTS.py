import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ==========================================
# 1. PERSIAPAN DATA (DATA PREPARATION)
# ==========================================
print("Memuat dataset untuk Prediksi BTTS (Both Teams To Score)...")
df = pd.read_csv('dataset/yunani/dataset_siap_ml.csv')

# Memisahkan Fitur (X) dan Target (y)
cols_to_drop = ['Div', 'Date', 'Time', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR', 'O_U_2.5', 'BTTS']
X = df.drop(columns=cols_to_drop)

# Menghapus/mengganti karakter khusus dari nama kolom agar aman untuk algoritma apapun
X.columns = X.columns.str.replace('<', '_under_').str.replace('>', '_over_')

# Target adalah BTTS (0 = No, 1 = Yes)
y = df['BTTS']

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

target_names = ['BTTS No (0)', 'BTTS Yes (1)']

# ==========================================
# 4. PELATIHAN MODEL 1: LOGISTIC REGRESSION (BALANCED)
# ==========================================
print("="*40)
print("EVALUASI MODEL 1: LOGISTIC REGRESSION (BALANCED)")
print("="*40)

# Menggunakan class_weight='balanced' agar model adil dalam menebak Yes atau No
lr_model = LogisticRegression(max_iter=2000, random_state=42, class_weight='balanced')
lr_model.fit(X_train_scaled, y_train)

lr_preds = lr_model.predict(X_test_scaled)
print(f"Akurasi Logistic Regression: {accuracy_score(y_test, lr_preds):.4f}")
print(classification_report(y_test, lr_preds, target_names=target_names, zero_division=0))


# ==========================================
# 5. PELATIHAN MODEL 2: RANDOM FOREST (BALANCED)
# ==========================================
print("\n" + "="*40)
print("EVALUASI MODEL 2: RANDOM FOREST (BALANCED)")
print("="*40)

rf_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42, class_weight='balanced')
rf_model.fit(X_train_scaled, y_train)

rf_preds = rf_model.predict(X_test_scaled)
print(f"Akurasi Random Forest: {accuracy_score(y_test, rf_preds):.4f}")
print(classification_report(y_test, rf_preds, target_names=target_names, zero_division=0))


# ==========================================
# 6. MENYIMPAN MODEL TERBAIK & SCALER
# ==========================================
# Menyimpan model BTTS dan scalernya ke file terpisah
joblib.dump(lr_model, 'model/yunani/model_lr_btts.pkl')
joblib.dump(scaler, 'model/yunani/scaler_btts.pkl')

print("\n" + "="*40)
print("[SUCCESS] Model BTTS disimpan sebagai 'model_lr_btts.pkl'")
print("[SUCCESS] Scaler BTTS disimpan sebagai 'scaler_btts.pkl'")
print("="*40)