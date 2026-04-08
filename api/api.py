from .models import League, Team, MatchRecord, Fixture, Article
import os
import io
import joblib
import warnings
import numpy as np
import pandas as pd
import jwt
from datetime import datetime
from pandas.errors import PerformanceWarning
from django.conf import settings
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from ninja import NinjaAPI, Schema, File
from ninja.files import UploadedFile
from ninja.errors import HttpError
from typing import List
from dotenv import load_dotenv

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

load_dotenv()
JWT_SECRET = os.getenv('JWT_SECRET_KEY', settings.SECRET_KEY)
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')

warnings.simplefilter(action='ignore', category=PerformanceWarning)

api = NinjaAPI(title="API Prediksi Sepak Bola")

LEAGUE_FOLDER_MAP = {
    'N1': 'belanda', 'B1': 'belgia', 'E0': 'inggris', 'I1': 'itali',
    'D1': 'jerman', 'F1': 'perancis', 'P1': 'portugal', 'SC0': 'skotlandia',
    'SP1': 'spanyol', 'T1': 'turki', 'G1': 'yunani'
}

# --- Fungsi Bantu Autentikasi Internal ---
def get_user_from_request(request):
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            return User.objects.get(id=payload['user_id'])
        except:
            return None
    return None

# ==========================================
# 1. SCHEMAS
# ==========================================
class AuthRegisterIn(Schema):
    username: str
    email: str
    password: str

class AuthLoginIn(Schema):
    username: str
    password: str

class AuthGoogleIn(Schema):
    credential: str

class AuthOut(Schema):
    token: str
    username: str
    email: str
    is_admin: bool

class LeagueOut(Schema):
    name: str

class TeamOut(Schema):
    name: str
    elo_rating: float
    pts_last_5: int
    form_string: str = ""  
    avg_gf: float
    avg_ga: float
    avg_sot: float
    goal_diff: float

    @staticmethod
    def resolve_form_string(obj):
        return getattr(obj, 'calculated_form', "")


class PredictIn(Schema):
    league_name: str
    home_team: str
    away_team: str
    odds_h: float
    odds_d: float
    odds_a: float
    odds_over: float
    odds_under: float

class PredictionOut(Schema):
    dnb_prediction: str
    dnb_home_prob: float
    dnb_away_prob: float
    ou_prediction: str
    ou_over_prob: float
    ou_under_prob: float
    btts_prediction: str
    btts_yes_prob: float
    btts_no_prob: float

class MatchData(Schema):
    league: str
    date: str
    time: str
    home_team: str
    away_team: str
    fthg: int
    ftag: int
    ftr: str
    home_elo: float
    away_elo: float
    home_pts_last_5: int
    away_pts_last_5: int
    home_avg_gf: float
    home_avg_ga: float
    away_avg_gf: float
    away_avg_ga: float
    home_avg_sot: float
    away_avg_sot: float
    h2h_home_win_rate: float
    home_goal_diff: float
    away_goal_diff: float
    elo_diff: float
    dnb_prediction: str = ""
    dnb_home_prob: float = 0.0
    dnb_away_prob: float = 0.0
    ou_prediction: str = ""
    ou_over_prob: float = 0.0
    ou_under_prob: float = 0.0
    btts_prediction: str = ""
    btts_yes_prob: float = 0.0
    btts_no_prob: float = 0.0

class MatchSavePayload(Schema):
    matches: List[MatchData]

class PerformanceStats(Schema):
    season: str
    total_matches: int
    hda_accuracy: float
    ou_accuracy: float
    btts_accuracy: float

class FixtureOut(Schema):
    id: int
    league_name: str
    date: str
    time: str
    home_team: str
    away_team: str
    odds_h: float
    odds_d: float
    odds_a: float
    odds_over: float
    odds_under: float

class ArticleOut(Schema):
    id: int
    title: str
    category: str
    excerpt: str
    content: str  
    read_time: str
    color: str
    created_at: str

    @staticmethod
    def resolve_created_at(obj):
        return obj.created_at.strftime("%d %b %Y")

class ArticleIn(Schema):
    title: str
    category: str
    excerpt: str
    content: str  
    read_time: str
    color: str = "bg-blue-500/20 text-blue-400 border-blue-500/30"

# --- SCHEMAS BET & LEADERBOARD ---
class BetIn(Schema):
    league: str
    match_date: str
    home_team: str
    away_team: str
    bet_category: str
    bet_choice: str
    odds: float
    stake: int

class BetOut(Schema):
    id: int
    league: str
    match_date: str
    home_team: str
    away_team: str
    bet_category: str
    bet_choice: str
    odds: float
    stake: int
    status: str
    created_at: str

    @staticmethod
    def resolve_created_at(obj):
        return obj.created_at.strftime("%d %b %Y, %H:%M")

class LeaderboardOut(Schema):
    username: str
    points: int

# ==========================================
# 1.5. ENDPOINTS AUTH 
# ==========================================
@api.post("/auth/register", response=AuthOut)
def register_user(request, payload: AuthRegisterIn):
    if User.objects.filter(username=payload.username).exists():
        return api.create_response(request, {"detail": "Username sudah terpakai"}, status=400)
    if User.objects.filter(email=payload.email).exists():
        return api.create_response(request, {"detail": "Email sudah terdaftar"}, status=400)
    
    user = User.objects.create(
        username=payload.username,
        email=payload.email,
        password=make_password(payload.password)
    )
    from .models import UserProfile
    UserProfile.objects.create(user=user, points=1000)
    token = jwt.encode({"user_id": user.id, "username": user.username}, JWT_SECRET, algorithm="HS256")
    is_admin = user.is_staff or user.is_superuser
    return AuthOut(token=token, username=user.username, email=user.email, is_admin=is_admin)

@api.post("/auth/login", response=AuthOut)
def login_user(request, payload: AuthLoginIn):
    user = User.objects.filter(username=payload.username).first()
    if not user or not check_password(payload.password, user.password):
        return api.create_response(request, {"detail": "Username atau password salah"}, status=400)
    
    token = jwt.encode({"user_id": user.id, "username": user.username}, JWT_SECRET, algorithm="HS256")
    is_admin = user.is_staff or user.is_superuser
    return AuthOut(token=token, username=user.username, email=user.email, is_admin=is_admin)

@api.post("/auth/google", response=AuthOut)
def google_login(request, payload: AuthGoogleIn):
    try:
        if not settings.GOOGLE_CLIENT_ID:
            return api.create_response(request, {"detail": "GOOGLE_CLIENT_ID belum diatur di Backend."}, status=500)

        idinfo = id_token.verify_oauth2_token(
            payload.credential, 
            google_requests.Request(), 
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=60
        )
        email = idinfo['email']
        
        user = User.objects.filter(email=email).first()
        if not user:
            base_username = email.split("@")[0]
            new_username = base_username
            counter = 1
            while User.objects.filter(username=new_username).exists():
                new_username = f"{base_username}{counter}"
                counter += 1
                
            user = User(
                username=new_username,
                email=email
            )
            user.set_unusable_password()
            user.save()
            
            from .models import UserProfile
            UserProfile.objects.create(user=user, points=1000)
        
        token = jwt.encode({"user_id": user.id, "username": user.username}, JWT_SECRET, algorithm="HS256")
        is_admin = user.is_staff or user.is_superuser
        return AuthOut(token=token, username=user.username, email=user.email, is_admin=is_admin)
    except ValueError as ve:
        return api.create_response(request, {"detail": f"Token Google ditolak: {str(ve)}"}, status=400)
    except Exception as e:
        return api.create_response(request, {"detail": f"Gagal autentikasi Google: {str(e)}"}, status=400)

# ==========================================
# 2. ENDPOINTS BET TRACKER & LEADERBOARD
# ==========================================
@api.get("/user/balance")
def get_user_balance(request):
    user = get_user_from_request(request)
    if not user: 
        return api.create_response(request, {"detail": "Unauthorized"}, status=401)
    
    # Gunakan get_or_create agar user lama yang belum punya profil otomatis dibuatkan
    from .models import UserProfile, UserBet
    profile, created = UserProfile.objects.get_or_create(user=user, defaults={'points': 1000})
    
    # Hitung Win Rate secara real-time
    completed_bets = UserBet.objects.filter(user=user, status__in=['Won', 'Lost'])
    total = completed_bets.count()
    if total > 0:
        won = completed_bets.filter(status='Won').count()
        profile.win_rate = round((won / total) * 100, 1)
        profile.save()

    # Hitung Rank (Peringkat ke berapa berdasarkan points)
    # Ini menghitung ada berapa banyak orang yang poinnya lebih tinggi dari user ini
    higher_points_count = UserProfile.objects.filter(points__gt=profile.points).count()
    profile.rank = higher_points_count + 1
    profile.save()

    return {
        "points": profile.points,
        "win_rate": profile.win_rate,
        "rank": profile.rank
    }

@api.post("/bets/place")
def place_bet(request, payload: BetIn):
    user = get_user_from_request(request)
    if not user: return api.create_response(request, {"detail": "Silakan login untuk memasang taruhan."}, status=401)
    
    if payload.stake <= 0:
        return api.create_response(request, {"detail": "Nominal koin tidak valid."}, status=400)
        
    if user.profile.points < payload.stake:
        return api.create_response(request, {"detail": "Koin tidak mencukupi."}, status=400)
    
    # Potong koin
    user.profile.points -= payload.stake
    user.profile.save()
    
    from .models import UserBet
    UserBet.objects.create(
        user=user, league=payload.league, match_date=datetime.strptime(payload.match_date, "%Y-%m-%d").date(),
        home_team=payload.home_team, away_team=payload.away_team,
        bet_category=payload.bet_category, bet_choice=payload.bet_choice,
        odds=payload.odds, stake=payload.stake
    )
    return {"success": True, "message": "Taruhan berhasil disimpan!", "new_balance": user.profile.points}

@api.get("/bets/history", response=List[BetOut])
def get_bet_history(request):
    user = get_user_from_request(request)
    if not user: return api.create_response(request, {"detail": "Unauthorized"}, status=401)
    from .models import UserBet
    return UserBet.objects.filter(user=user).order_by('-created_at')

@api.get("/leaderboard", response=List[LeaderboardOut])
def get_leaderboard(request):
    from .models import UserProfile
    profiles = UserProfile.objects.all().order_by('-points')[:100]
    return [{"username": p.user.username, "points": p.points} for p in profiles]

# ==========================================
# 3. ENDPOINTS USER UTAMA (PREDIKSI & INFO)
# ==========================================
@api.get("/leagues", response=List[LeagueOut])
def get_leagues(request):
    return League.objects.all().order_by('name')

@api.get("/teams/{league_name}", response=List[TeamOut])
def get_teams(request, league_name: str):
    teams = list(Team.objects.filter(league__name=league_name).order_by('name'))
    matches = list(MatchRecord.objects.filter(league__name=league_name).order_by('-date', '-time'))
    
    for team in teams:
        team_matches = [m for m in matches if m.home_team_id == team.id or m.away_team_id == team.id][:5]
        form = []
        for m in team_matches:
            if m.home_team_id == team.id:
                if m.ftr == 'H': form.append('W')
                elif m.ftr == 'A': form.append('L')
                else: form.append('D')
            else:
                if m.ftr == 'A': form.append('W')
                elif m.ftr == 'H': form.append('L')
                else: form.append('D')
        team.calculated_form = "".join(reversed(form))
        
    return teams

@api.post("/predict", response=PredictionOut)
def predict_match(request, payload: PredictIn):
    home = Team.objects.get(name=payload.home_team, league__name=payload.league_name)
    away = Team.objects.get(name=payload.away_team, league__name=payload.league_name)

    h2h_matches = MatchRecord.objects.filter(
        Q(home_team=home, away_team=away) | Q(home_team=away, away_team=home)
    ).order_by('-date', '-time')[:5]

    home_wins = sum(1 for m in h2h_matches if (m.home_team == home and m.ftr == 'H') or (m.away_team == home and m.ftr == 'A'))
    h2h_rate = home_wins / len(h2h_matches) if len(h2h_matches) > 0 else 0.5
    elo_diff = (home.elo_rating + 80) - away.elo_rating

    h_gd = home.avg_gf - home.avg_ga
    a_gd = away.avg_gf - away.avg_ga

    feature_dict = {
        'Home_Pts_Last_5': home.pts_last_5, 'Away_Pts_Last_5': away.pts_last_5,
        'Home_Avg_GF': home.avg_gf, 'Home_Avg_GA': home.avg_ga,
        'Away_Avg_GF': away.avg_gf, 'Away_Avg_GA': away.avg_ga,
        'Home_Avg_SOT': home.avg_sot, 'Away_Avg_SOT': away.avg_sot,
        'H2H_Home_Win_Rate': h2h_rate, 'Home_Elo': home.elo_rating,
        'Away_Elo': away.elo_rating, 'Home_Goal_Difference': h_gd,
        'Away_Goal_Difference': a_gd, 'Elo_Difference': elo_diff,
        'PSH': payload.odds_h, 'PSD': payload.odds_d, 'PSA': payload.odds_a,
        'P_over_2.5': payload.odds_over, 'P_under_2.5': payload.odds_under,
        'Avg_over_2.5': payload.odds_over, 'Avg_under_2.5': payload.odds_under 
    }

    X_new = pd.DataFrame([feature_dict])
    X_new = X_new.loc[:, ~X_new.columns.duplicated()].copy()

    folder_name = LEAGUE_FOLDER_MAP.get(payload.league_name, payload.league_name.lower())
    model_dir = os.path.join(settings.BASE_DIR, 'model', folder_name)

    model_dnb = joblib.load(os.path.join(model_dir, 'model_rf_dnb.pkl'))
    scaler_hda = joblib.load(os.path.join(model_dir, 'scaler_hda.pkl'))
    model_ou = joblib.load(os.path.join(model_dir, 'model_lr_ou.pkl'))
    scaler_ou = joblib.load(os.path.join(model_dir, 'scaler_ou.pkl'))
    model_btts = joblib.load(os.path.join(model_dir, 'model_lr_btts.pkl'))
    scaler_btts = joblib.load(os.path.join(model_dir, 'scaler_btts.pkl'))

    all_expected_cols = set(list(scaler_hda.feature_names_in_) + list(scaler_ou.feature_names_in_) + list(scaler_btts.feature_names_in_))
    for col in all_expected_cols:
        if col not in X_new.columns:
            if 'over' in col.lower(): X_new[col] = payload.odds_over
            elif 'under' in col.lower(): X_new[col] = payload.odds_under
            elif col.endswith('H'): X_new[col] = payload.odds_h
            elif col.endswith('D'): X_new[col] = payload.odds_d
            elif col.endswith('A'): X_new[col] = payload.odds_a
            else: X_new[col] = 0

    X_numeric = X_new[list(all_expected_cols)].apply(pd.to_numeric, errors='coerce').fillna(0)

    cols_s_hda = list(scaler_hda.feature_names_in_)
    X_s_hda_np = scaler_hda.transform(X_numeric[cols_s_hda])
    X_s_hda_df = pd.DataFrame(X_s_hda_np, columns=cols_s_hda)
    cols_m_hda = list(model_dnb.feature_names_in_) if hasattr(model_dnb, 'feature_names_in_') else cols_s_hda
    prob_dnb = model_dnb.predict_proba(X_s_hda_df[cols_m_hda].to_numpy())[0]

    cols_s_ou = list(scaler_ou.feature_names_in_)
    X_s_ou_np = scaler_ou.transform(X_numeric[cols_s_ou])
    X_s_ou_df = pd.DataFrame(X_s_ou_np, columns=cols_s_ou)
    cols_m_ou = list(model_ou.feature_names_in_) if hasattr(model_ou, 'feature_names_in_') else cols_s_ou
    prob_ou = model_ou.predict_proba(X_s_ou_df[cols_m_ou].to_numpy())[0]

    cols_s_btts = list(scaler_btts.feature_names_in_)
    X_s_btts_np = scaler_btts.transform(X_numeric[cols_s_btts])
    X_s_btts_df = pd.DataFrame(X_s_btts_np, columns=cols_s_btts)
    cols_m_btts = list(model_btts.feature_names_in_) if hasattr(model_btts, 'feature_names_in_') else cols_s_btts
    prob_btts = model_btts.predict_proba(X_s_btts_df[cols_m_btts].to_numpy())[0]

    return PredictionOut(
        dnb_prediction=f"{payload.home_team} Win" if prob_dnb[1] > prob_dnb[0] else f"{payload.away_team} Win",
        dnb_home_prob=round(prob_dnb[1] * 100, 1), dnb_away_prob=round(prob_dnb[0] * 100, 1),
        ou_prediction="Over 2.5" if prob_ou[1] > prob_ou[0] else "Under 2.5",
        ou_over_prob=round(prob_ou[1] * 100, 1), ou_under_prob=round(prob_ou[0] * 100, 1),
        btts_prediction="Yes" if prob_btts[1] > prob_btts[0] else "No",
        btts_yes_prob=round(prob_btts[1] * 100, 1), btts_no_prob=round(prob_btts[0] * 100, 1)
    )

@api.get("/performance/{league_name}", response=List[PerformanceStats])
def get_performance(request, league_name: str):
    matches = MatchRecord.objects.select_related('home_team', 'away_team').filter(league__name=league_name).exclude(dnb_prediction="")
    seasons = {}
    for m in matches:
        year = m.date.year
        season_str = f"{year}/{year+1}" if m.date.month > 6 else f"{year-1}/{year}"
        if season_str not in seasons:
            seasons[season_str] = {'total': 0, 'hda_correct': 0, 'ou_correct': 0, 'btts_correct': 0}
        stat = seasons[season_str]
        stat['total'] += 1
        
        is_home_win = m.ftr == 'H'
        is_away_win = m.ftr == 'A'
        if "Win" in m.dnb_prediction:
            predicted_team = m.dnb_prediction.replace(" Win", "")
            if (predicted_team == m.home_team.name and is_home_win) or \
               (predicted_team == m.away_team.name and is_away_win):
                stat['hda_correct'] += 1
        
        total_goals = m.fthg + m.ftag
        is_over = total_goals > 2.5
        if (m.ou_prediction == "Over 2.5" and is_over) or \
           (m.ou_prediction == "Under 2.5" and not is_over):
            stat['ou_correct'] += 1
            
        is_btts = m.fthg > 0 and m.ftag > 0
        if (m.btts_prediction == "Yes" and is_btts) or \
           (m.btts_prediction == "No" and not is_btts):
            stat['btts_correct'] += 1

    result = []
    for season, data in sorted(seasons.items(), reverse=True):
        result.append({
            "season": season, "total_matches": data['total'],
            "hda_accuracy": round((data['hda_correct'] / data['total']) * 100, 1) if data['total'] > 0 else 0,
            "ou_accuracy": round((data['ou_correct'] / data['total']) * 100, 1) if data['total'] > 0 else 0,
            "btts_accuracy": round((data['btts_correct'] / data['total']) * 100, 1) if data['total'] > 0 else 0,
        })
    return result

@api.get("/fixtures", response=List[FixtureOut])
@api.get("/fixtures", response=List[FixtureOut])
def get_fixtures(request):
    now_wib = pd.Timestamp.now(tz='Asia/Jakarta').tz_localize(None)
    
    # PERUBAHAN ADA DI BARIS INI: Tambahkan select_related('league')
    fixtures = Fixture.objects.select_related('league').all().order_by('date', 'time')
    
    valid_fixtures = []
    for f in fixtures:
        match_dt = datetime.combine(f.date, f.time)
        if match_dt >= now_wib:
            valid_fixtures.append({
                "id": f.id, "league_name": f.league.name, "date": str(f.date),
                "time": f.time.strftime('%H:%M'), "home_team": f.home_team, "away_team": f.away_team,
                "odds_h": f.odds_h, "odds_d": f.odds_d, "odds_a": f.odds_a,
                "odds_over": f.odds_over, "odds_under": f.odds_under
            })
    return valid_fixtures

@api.get("/articles", response=List[ArticleOut])
def get_articles(request):
    return Article.objects.all().order_by('-created_at')

@api.get("/articles/{article_id}", response=ArticleOut)
def get_single_article(request, article_id: int):
    return get_object_or_404(Article, id=article_id)

# ==========================================
# 4. ENDPOINTS ADMIN UPLOAD (PREVIEW & SAVE)
# ==========================================
@api.post("/admin/articles/add")
def create_article(request, payload: ArticleIn):
    Article.objects.create(**payload.dict())
    return {"success": True, "message": "Artikel berhasil diterbitkan!"}

@api.post("/admin/fixtures/upload")
def upload_fixtures(request, file: UploadedFile = File(...)):
    content = file.read().decode('utf-8')
    df = pd.read_csv(io.StringIO(content))
    valid_leagues = list(LEAGUE_FOLDER_MAP.keys())
    if 'Div' in df.columns:
        df = df[df['Div'].isin(valid_leagues)]
    if 'Time' not in df.columns: df['Time'] = '12:00'
    df['Datetime'] = pd.to_datetime(df['Date'].astype(str) + ' ' + df['Time'].astype(str), format='mixed', dayfirst=True)
    try:
        df['Datetime'] = df['Datetime'].dt.tz_localize('Europe/London', ambiguous='NaT', nonexistent='NaT').dt.tz_convert('Asia/Jakarta')
    except Exception:
        df['Datetime'] = df['Datetime'] + pd.Timedelta(hours=7)

    def safe_float(val):
        try:
            return float(val) if pd.notna(val) else 0.0
        except:
            return 0.0

    def get_best_odd(row, primary, fallback, avg_col):
        val = row.get(primary)
        if pd.isna(val) or val == '' or val == '-':
            val = row.get(fallback)
        if pd.isna(val) or val == '' or val == '-':
            val = row.get(avg_col)
        return safe_float(val)

    Fixture.objects.all().delete()
    fixtures_to_create = []
    
    for _, row in df.iterrows():
        if pd.isna(row['Datetime']): continue
        league_obj, _ = League.objects.get_or_create(name=row['Div'])
        
        o_h = get_best_odd(row, 'PSH', 'B365H', 'AvgH')
        o_d = get_best_odd(row, 'PSD', 'B365D', 'AvgD')
        o_a = get_best_odd(row, 'PSA', 'B365A', 'AvgA')
        o_over = get_best_odd(row, 'P>2.5', 'B365>2.5', 'Avg>2.5')
        o_under = get_best_odd(row, 'P<2.5', 'B365<2.5', 'Avg<2.5')

        fixtures_to_create.append(Fixture(
            league=league_obj, date=row['Datetime'].date(), time=row['Datetime'].time(),
            home_team=row['HomeTeam'], away_team=row['AwayTeam'],
            odds_h=o_h, odds_d=o_d, odds_a=o_a,
            odds_over=o_over, odds_under=o_under
        ))
        
    Fixture.objects.bulk_create(fixtures_to_create)
    return {"success": True, "message": f"{len(fixtures_to_create)} Jadwal laga beserta Odds berhasil disinkronisasi."}

@api.post("/admin/preview", response=List[MatchData])
def preview_csv(request, file: UploadedFile = File(...)):
    content = file.read().decode('utf-8')
    df = pd.read_csv(io.StringIO(content))
    
    df = df.dropna(subset=['HomeTeam', 'AwayTeam'])
    if 'Time' not in df.columns:
        df['Time'] = '12:00'
        
    df['Datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], format='mixed', dayfirst=True)
    df = df.sort_values('Datetime')

    df.columns = df.columns.str.replace('<', '_under_').str.replace('>', '_over_')
    df = df.loc[:, ~df.columns.duplicated()].copy()

    if 'Home_Elo' not in df.columns:
        elo_dict = {}
        history_dict = {}
        h2h_dict = {}
        
        for t in Team.objects.all():
            elo_dict[t.name] = t.elo_rating
            history_dict[t.name] = [
                {'pts': t.pts_last_5 / 5.0, 'gf': t.avg_gf, 'ga': t.avg_ga, 'sot': t.avg_sot}
            ] * 5
            
        features = []
        for index, row in df.iterrows():
            home = row['HomeTeam']
            away = row['AwayTeam']
            
            if home not in elo_dict: elo_dict[home] = 1500.0; history_dict[home] = []
            if away not in elo_dict: elo_dict[away] = 1500.0; history_dict[away] = []
            
            h_elo = elo_dict[home]
            a_elo = elo_dict[away]
            
            h_hist = history_dict[home][-5:]
            a_hist = history_dict[away][-5:]
            
            h_pts_5 = sum(x['pts'] for x in h_hist) if h_hist else 0
            a_pts_5 = sum(x['pts'] for x in a_hist) if a_hist else 0
            h_avg_gf = sum(x['gf'] for x in h_hist) / len(h_hist) if h_hist else 0.0
            h_avg_ga = sum(x['ga'] for x in h_hist) / len(h_hist) if h_hist else 0.0
            h_avg_sot = sum(x['sot'] for x in h_hist) / len(h_hist) if h_hist else 0.0
            a_avg_gf = sum(x['gf'] for x in a_hist) / len(a_hist) if a_hist else 0.0
            a_avg_ga = sum(x['ga'] for x in a_hist) / len(a_hist) if a_hist else 0.0
            a_avg_sot = sum(x['sot'] for x in a_hist) / len(a_hist) if a_hist else 0.0
            
            pair = tuple(sorted([home, away]))
            if pair not in h2h_dict:
                past_matches = MatchRecord.objects.filter(
                    Q(home_team__name=home, away_team__name=away) | Q(home_team__name=away, away_team__name=home)
                ).order_by('date', 'time')
                db_h2h = []
                for m in past_matches:
                    if m.ftr == 'H': db_h2h.append(m.home_team.name)
                    elif m.ftr == 'A': db_h2h.append(m.away_team.name)
                    else: db_h2h.append('Draw')
                h2h_dict[pair] = db_h2h[-5:]
                
            h2h_list = h2h_dict[pair][-5:]
            h2h_rate = h2h_list.count(home) / len(h2h_list) if h2h_list else 0.5
            
            elo_diff = (h_elo + 80) - a_elo
            h_gd = h_avg_gf - h_avg_ga
            a_gd = a_avg_gf - a_avg_ga

            features.append({
                'Home_Elo': h_elo, 'Away_Elo': a_elo,
                'Home_Pts_Last_5': h_pts_5, 'Away_Pts_Last_5': a_pts_5,
                'Home_Avg_GF': h_avg_gf, 'Home_Avg_GA': h_avg_ga,
                'Away_Avg_GF': a_avg_gf, 'Away_Avg_GA': a_avg_ga,
                'Home_Avg_SOT': h_avg_sot, 'Away_Avg_SOT': a_avg_sot,
                'H2H_Home_Win_Rate': h2h_rate,
                'Home_Goal_Difference': h_gd, 'Away_Goal_Difference': a_gd,
                'Elo_Difference': elo_diff
            })
            
            fthg = int(row.get('FTHG', 0) if pd.notna(row.get('FTHG')) else 0)
            ftag = int(row.get('FTAG', 0) if pd.notna(row.get('FTAG')) else 0)
            hst = float(row.get('HST', 0) if pd.notna(row.get('HST')) else 0)
            ast = float(row.get('AST', 0) if pd.notna(row.get('AST')) else 0)
            
            if fthg > ftag:
                ftr = 'H'; h_pts = 3; a_pts = 0; winner = home
            elif fthg < ftag:
                ftr = 'A'; h_pts = 0; a_pts = 3; winner = away
            else:
                ftr = 'D'; h_pts = 1; a_pts = 1; winner = 'Draw'
                
            K = 20
            w_e_home = 1 / (10 ** ((a_elo - (h_elo + 80)) / 400) + 1)
            w_e_away = 1 - w_e_home
            s_home = 1 if ftr == 'H' else (0 if ftr == 'A' else 0.5)
            s_away = 1 if ftr == 'A' else (0 if ftr == 'H' else 0.5)
                
            elo_dict[home] += K * (s_home - w_e_home)
            elo_dict[away] += K * (s_away - w_e_away)
            history_dict[home].append({'pts': h_pts, 'gf': fthg, 'ga': ftag, 'sot': hst})
            history_dict[away].append({'pts': a_pts, 'gf': ftag, 'ga': fthg, 'sot': ast})
            h2h_dict[pair].append(winner)

        features_df = pd.DataFrame(features, index=df.index)
        for col in features_df.columns:
            df[col] = features_df[col]

        df['PSH'] = df.get('PSH', df.get('B365H', 1.0))
        df['PSD'] = df.get('PSD', df.get('B365D', 1.0))
        df['PSA'] = df.get('PSA', df.get('B365A', 1.0))
        df['P_over_2.5'] = df.get('P_over_2.5', df.get('B365>2.5', df.get('Avg>2.5', 1.0)))
        df['P_under_2.5'] = df.get('P_under_2.5', df.get('B365<2.5', df.get('Avg<2.5', 1.0)))

    df = df.fillna(0)

    df = df.assign(
        dnb_prediction='', dnb_home_prob=0.0, dnb_away_prob=0.0,
        ou_prediction='', ou_over_prob=0.0, ou_under_prob=0.0,
        btts_prediction='', btts_yes_prob=0.0, btts_no_prob=0.0
    )

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

            X_raw = group.copy()
            all_expected_cols = set(list(scaler_hda.feature_names_in_) + list(scaler_ou.feature_names_in_) + list(scaler_btts.feature_names_in_))

            for col in all_expected_cols:
                if col not in X_raw.columns:
                    X_raw[col] = 0

            X_numeric = X_raw[list(all_expected_cols)].apply(pd.to_numeric, errors='coerce').fillna(0)

            cols_s_hda = list(scaler_hda.feature_names_in_)
            X_s_hda = pd.DataFrame(scaler_hda.transform(X_numeric[cols_s_hda]), columns=cols_s_hda)
            if hasattr(model_dnb, 'feature_names_in_'): X_s_hda = X_s_hda[list(model_dnb.feature_names_in_)]

            cols_s_ou = list(scaler_ou.feature_names_in_)
            X_s_ou = pd.DataFrame(scaler_ou.transform(X_numeric[cols_s_ou]), columns=cols_s_ou)
            if hasattr(model_ou, 'feature_names_in_'): X_s_ou = X_s_ou[list(model_ou.feature_names_in_)]

            cols_s_btts = list(scaler_btts.feature_names_in_)
            X_s_btts = pd.DataFrame(scaler_btts.transform(X_numeric[cols_s_btts]), columns=cols_s_btts)
            if hasattr(model_btts, 'feature_names_in_'): X_s_btts = X_s_btts[list(model_btts.feature_names_in_)]

            prob_dnb = model_dnb.predict_proba(X_s_hda.to_numpy())
            prob_ou = model_ou.predict_proba(X_s_ou.to_numpy())
            prob_btts = model_btts.predict_proba(X_s_btts.to_numpy())

            home_teams = group['HomeTeam'].astype(str).values
            away_teams = group['AwayTeam'].astype(str).values

            df.loc[group.index, 'dnb_away_prob'] = prob_dnb[:, 0] * 100
            df.loc[group.index, 'dnb_home_prob'] = prob_dnb[:, 1] * 100
            df.loc[group.index, 'dnb_prediction'] = np.where(prob_dnb[:, 1] > prob_dnb[:, 0], home_teams + ' Win', away_teams + ' Win')

            df.loc[group.index, 'ou_under_prob'] = prob_ou[:, 0] * 100
            df.loc[group.index, 'ou_over_prob'] = prob_ou[:, 1] * 100
            df.loc[group.index, 'ou_prediction'] = np.where(prob_ou[:, 1] > prob_ou[:, 0], 'Over 2.5', 'Under 2.5')

            df.loc[group.index, 'btts_no_prob'] = prob_btts[:, 0] * 100
            df.loc[group.index, 'btts_yes_prob'] = prob_btts[:, 1] * 100
            df.loc[group.index, 'btts_prediction'] = np.where(prob_btts[:, 1] > prob_btts[:, 0], 'Yes', 'No')

        except Exception as e:
            print(f"Peringatan: Gagal memprediksi saat preview - {e}")
            continue
    
    new_matches = []
    for index, row in df.iterrows():
        match_date = row['Datetime'].date()
        home = row['HomeTeam']
        away = row['AwayTeam']
        
        if not MatchRecord.objects.filter(date=match_date, home_team__name=home, away_team__name=away).exists():
            new_matches.append({
                'league': row['Div'], 'date': str(match_date), 'time': str(row['Datetime'].time()),
                'home_team': home, 'away_team': away, 'fthg': int(row.get('FTHG', 0)),
                'ftag': int(row.get('FTAG', 0)), 'ftr': str(row.get('FTR', '')),
                'home_elo': float(row['Home_Elo']), 'away_elo': float(row['Away_Elo']),
                'home_pts_last_5': int(row['Home_Pts_Last_5']), 'away_pts_last_5': int(row['Away_Pts_Last_5']),
                'home_avg_gf': float(row['Home_Avg_GF']), 'home_avg_ga': float(row['Home_Avg_GA']),
                'away_avg_gf': float(row['Away_Avg_GF']), 'away_avg_ga': float(row['Away_Avg_GA']),
                'home_avg_sot': float(row['Home_Avg_SOT']), 'away_avg_sot': float(row['Away_Avg_SOT']),
                'h2h_home_win_rate': float(row['H2H_Home_Win_Rate']),
                'home_goal_diff': float(row['Home_Goal_Difference']), 'away_goal_diff': float(row['Away_Goal_Difference']),
                'elo_diff': float(row['Elo_Difference']),
                'dnb_prediction': str(row.get('dnb_prediction', '')),
                'dnb_home_prob': float(row.get('dnb_home_prob', 0.0)), 'dnb_away_prob': float(row.get('dnb_away_prob', 0.0)),
                'ou_prediction': str(row.get('ou_prediction', '')),
                'ou_over_prob': float(row.get('ou_over_prob', 0.0)), 'ou_under_prob': float(row.get('ou_under_prob', 0.0)),
                'btts_prediction': str(row.get('btts_prediction', '')),
                'btts_yes_prob': float(row.get('btts_yes_prob', 0.0)), 'btts_no_prob': float(row.get('btts_no_prob', 0.0)),
            })
    return new_matches

@api.post("/admin/save")
def save_matches(request, payload: MatchSavePayload):
    for data in payload.matches:
        league_obj, _ = League.objects.get_or_create(name=data.league)
        home_team, _ = Team.objects.update_or_create(
            league=league_obj, name=data.home_team,
            defaults={
                'elo_rating': data.home_elo, 'pts_last_5': data.home_pts_last_5,
                'avg_gf': data.home_avg_gf, 'avg_ga': data.home_avg_ga,
                'avg_sot': data.home_avg_sot, 'goal_diff': data.home_goal_diff
            }
        )
        away_team, _ = Team.objects.update_or_create(
            league=league_obj, name=data.away_team,
            defaults={
                'elo_rating': data.away_elo, 'pts_last_5': data.away_pts_last_5,
                'avg_gf': data.away_avg_gf, 'avg_ga': data.away_avg_ga,
                'avg_sot': data.away_avg_sot, 'goal_diff': data.away_goal_diff
            }
        )
        MatchRecord.objects.create(
            league=league_obj, date=data.date, time=data.time,
            home_team=home_team, away_team=away_team,
            fthg=data.fthg, ftag=data.ftag, ftr=data.ftr,
            home_elo=data.home_elo, away_elo=data.away_elo,
            home_pts_last_5=data.home_pts_last_5, away_pts_last_5=data.away_pts_last_5,
            home_avg_gf=data.home_avg_gf, home_avg_ga=data.home_avg_ga,
            away_avg_gf=data.away_avg_gf, away_avg_ga=data.away_avg_ga,
            home_avg_sot=data.home_avg_sot, away_avg_sot=data.away_avg_sot,
            h2h_home_win_rate=data.h2h_home_win_rate,
            home_goal_diff=data.home_goal_diff, away_goal_diff=data.away_goal_diff, elo_diff=data.elo_diff,
            dnb_prediction=data.dnb_prediction, dnb_home_prob=data.dnb_home_prob, dnb_away_prob=data.dnb_away_prob,
            ou_prediction=data.ou_prediction, ou_over_prob=data.ou_over_prob, ou_under_prob=data.ou_under_prob,
            btts_prediction=data.btts_prediction, btts_yes_prob=data.btts_yes_prob, btts_no_prob=data.btts_no_prob
        )

    # ---> SISTEM SETTLEMENT OTOMATIS SAAT ADMIN SAVE HASIL PERTANDINGAN <---
    from .models import UserBet
    pending_bets = UserBet.objects.filter(status='Pending')
    for bet in pending_bets:
        match = MatchRecord.objects.filter(date=bet.match_date, home_team__name=bet.home_team, away_team__name=bet.away_team).first()
        if match:
            won = False
            if bet.bet_category == 'DNB':
                if match.ftr == 'D':
                    bet.status = 'Refund'
                    bet.user.profile.points += bet.stake
                    bet.user.profile.save()
                    bet.save()
                    continue
                elif bet.bet_choice == match.home_team.name and match.ftr == 'H': won = True
                elif bet.bet_choice == match.away_team.name and match.ftr == 'A': won = True
            elif bet.bet_category == 'OU':
                total_goals = match.fthg + match.ftag
                if bet.bet_choice == 'Over 2.5' and total_goals > 2.5: won = True
                elif bet.bet_choice == 'Under 2.5' and total_goals < 2.5: won = True
            elif bet.bet_category == 'BTTS':
                btts = match.fthg > 0 and match.ftag > 0
                if bet.bet_choice == 'Yes' and btts: won = True
                elif bet.bet_choice == 'No' and not btts: won = True

            if won:
                bet.status = 'Won'
                bet.user.profile.points += int(bet.stake * bet.odds)
            else:
                bet.status = 'Lost'
            bet.user.profile.save()
            bet.save()

    return {"success": True, "message": f"{len(payload.matches)} data tersimpan dan taruhan disesuaikan."}