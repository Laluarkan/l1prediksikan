from ninja import Schema
from typing import List, Optional

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
    logo: Optional[str] = None
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
    home_logo: Optional[str] = None
    away_team: str
    away_logo: Optional[str] = None
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
    home_logo: Optional[str] = None
    away_team: str
    away_logo: Optional[str] = None
    bet_category: str
    bet_choice: str
    odds: float
    stake: int
    status: str
    created_at: str

    @staticmethod
    def resolve_match_date(obj):
        return obj.match_date.strftime("%d %b %Y")

    @staticmethod
    def resolve_created_at(obj):
        return obj.created_at.strftime("%d %b %Y, %H:%M")

class LeaderboardOut(Schema):
    username: str
    points: int

class StandingOut(Schema):
    rank: int
    team_name: str
    team_logo: Optional[str] = None
    points: int
    played: int
    win: int
    draw: int
    lose: int
    goals_for: int
    goals_against: int
    goal_diff: int
    form: Optional[str] = None