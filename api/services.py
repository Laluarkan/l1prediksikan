from datetime import timedelta
from .models import MatchRecord, UserBet, LeaguePerformance

def update_league_performance(league_name: str):
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

    for season, data in seasons.items():
        if data['total'] > 0:
            LeaguePerformance.objects.update_or_create(
                league_name=league_name,
                season=season,
                defaults={
                    'total_matches': data['total'],
                    'hda_accuracy': round((data['hda_correct'] / data['total']) * 100, 1),
                    'ou_accuracy': round((data['ou_correct'] / data['total']) * 100, 1),
                    'btts_accuracy': round((data['btts_correct'] / data['total']) * 100, 1),
                }
            )

def process_bet_settlements():
    pending_bets = UserBet.objects.filter(status='Pending')
    for bet in pending_bets:
        start_date = bet.match_date - timedelta(days=2)
        end_date = bet.match_date + timedelta(days=2)
        
        match = MatchRecord.objects.filter(
            date__range=[start_date, end_date],
            home_team__name=bet.home_team,
            away_team__name=bet.away_team
        ).first()
        
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