from django.contrib import admin
from .models import UserProfile, League, Team, MatchRecord, Fixture, Article, LeaguePerformance, UserBet

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'points')
    search_fields = ('user__username', 'user__email')

@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'league', 'elo_rating', 'pts_last_5')
    list_filter = ('league',)
    search_fields = ('name',)
    ordering = ('league', 'name')
    list_select_related = ('league',)

@admin.register(MatchRecord)
class MatchRecordAdmin(admin.ModelAdmin):
    list_display = ('date', 'home_team', 'away_team', 'fthg', 'ftag', 'ftr', 'league')
    list_filter = ('league', 'date', 'ftr')
    search_fields = ('home_team__name', 'away_team__name')
    date_hierarchy = 'date'
    list_select_related = ('home_team', 'away_team', 'league')

@admin.register(Fixture)
class FixtureAdmin(admin.ModelAdmin):
    list_display = ('date', 'time', 'home_team', 'away_team', 'league')
    list_filter = ('league', 'date')
    search_fields = ('home_team', 'away_team')
    date_hierarchy = 'date'
    list_select_related = ('league',)

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'created_at', 'read_time')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'category', 'excerpt')
    date_hierarchy = 'created_at'

@admin.register(LeaguePerformance)
class LeaguePerformanceAdmin(admin.ModelAdmin):
    list_display = ('league_name', 'season', 'total_matches', 'hda_accuracy', 'ou_accuracy', 'btts_accuracy', 'updated_at')
    list_filter = ('league_name', 'season')
    search_fields = ('league_name', 'season')

@admin.register(UserBet)
class UserBetAdmin(admin.ModelAdmin):
    list_display = ('user', 'league', 'match_date', 'home_team', 'away_team', 'bet_category', 'stake', 'status')
    list_filter = ('status', 'league', 'bet_category')
    search_fields = ('user__username', 'home_team', 'away_team')
    date_hierarchy = 'match_date'