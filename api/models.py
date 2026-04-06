from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    points = models.IntegerField(default=1000)
    win_rate = models.FloatField(default=0.0)
    rank = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return self.user.username

class League(models.Model):
    name = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.name

class Team(models.Model):
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=100)
    elo_rating = models.FloatField(default=1500.0)
    pts_last_5 = models.IntegerField(default=0)
    avg_gf = models.FloatField(default=0.0)
    avg_ga = models.FloatField(default=0.0)
    avg_sot = models.FloatField(default=0.0)
    goal_diff = models.FloatField(default=0.0)

    class Meta:
        unique_together = ('league', 'name')

    def __str__(self):
        return self.name

    @property
    def form_string(self):
        matches = MatchRecord.objects.filter(
            models.Q(home_team=self) | models.Q(away_team=self)
        ).order_by('-date', '-time')[:5]
        form = []
        for m in matches:
            if m.home_team == self:
                if m.ftr == 'H': form.append('W')
                elif m.ftr == 'A': form.append('L')
                else: form.append('D')
            else:
                if m.ftr == 'A': form.append('W')
                elif m.ftr == 'H': form.append('L')
                else: form.append('D')
        return "".join(reversed(form))

    @property
    def real_avg_gf(self):
        matches = MatchRecord.objects.filter(models.Q(home_team=self) | models.Q(away_team=self)).order_by('-date', '-time')[:5]
        if not matches: return 0.0
        total_gf = sum([m.fthg if m.home_team == self else m.ftag for m in matches])
        return round(total_gf / len(matches), 2)

    @property
    def real_avg_ga(self):
        matches = MatchRecord.objects.filter(models.Q(home_team=self) | models.Q(away_team=self)).order_by('-date', '-time')[:5]
        if not matches: return 0.0
        total_ga = sum([m.ftag if m.home_team == self else m.fthg for m in matches])
        return round(total_ga / len(matches), 2)

class MatchRecord(models.Model):
    league = models.ForeignKey(League, on_delete=models.CASCADE)
    date = models.DateField()
    time = models.TimeField()
    home_team = models.ForeignKey(Team, related_name='home_matches', on_delete=models.CASCADE)
    away_team = models.ForeignKey(Team, related_name='away_matches', on_delete=models.CASCADE)
    fthg = models.IntegerField()
    ftag = models.IntegerField()
    ftr = models.CharField(max_length=1)
    home_elo = models.FloatField()
    away_elo = models.FloatField()
    home_pts_last_5 = models.IntegerField()
    away_pts_last_5 = models.IntegerField()
    home_avg_gf = models.FloatField()
    home_avg_ga = models.FloatField()
    away_avg_gf = models.FloatField()
    away_avg_ga = models.FloatField()
    home_avg_sot = models.FloatField()
    away_avg_sot = models.FloatField()
    h2h_home_win_rate = models.FloatField()
    home_goal_diff = models.FloatField()
    away_goal_diff = models.FloatField()
    elo_diff = models.FloatField()
    dnb_prediction = models.CharField(max_length=50, null=True, blank=True)
    dnb_home_prob = models.FloatField(null=True, blank=True)
    dnb_away_prob = models.FloatField(null=True, blank=True)
    ou_prediction = models.CharField(max_length=50, null=True, blank=True)
    ou_over_prob = models.FloatField(null=True, blank=True)
    ou_under_prob = models.FloatField(null=True, blank=True)
    btts_prediction = models.CharField(max_length=50, null=True, blank=True)
    btts_yes_prob = models.FloatField(null=True, blank=True)
    btts_no_prob = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.date} - {self.home_team} vs {self.away_team}"

class Fixture(models.Model):
    league = models.ForeignKey(League, on_delete=models.CASCADE)
    date = models.DateField()
    time = models.TimeField()
    home_team = models.CharField(max_length=100)
    away_team = models.CharField(max_length=100)
    odds_h = models.FloatField(default=0.0)
    odds_d = models.FloatField(default=0.0)
    odds_a = models.FloatField(default=0.0)
    odds_over = models.FloatField(default=0.0)
    odds_under = models.FloatField(default=0.0)

    def __str__(self):
        return f"[{self.league.name}] {self.date} {self.time} - {self.home_team} vs {self.away_team}"

class Article(models.Model):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    excerpt = models.TextField()
    content = models.TextField(default="")  
    read_time = models.CharField(max_length=50)
    color = models.CharField(max_length=100, default="bg-blue-500/20 text-blue-400 border-blue-500/30")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class UserBet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bets')
    league = models.CharField(max_length=100)
    match_date = models.DateField()
    home_team = models.CharField(max_length=100)
    away_team = models.CharField(max_length=100)
    bet_category = models.CharField(max_length=50) # DNB, OU, BTTS
    bet_choice = models.CharField(max_length=100)
    odds = models.FloatField()
    stake = models.IntegerField()
    status = models.CharField(max_length=20, default='Pending') # Pending, Won, Lost, Refund
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.home_team} vs {self.away_team} ({self.status})"