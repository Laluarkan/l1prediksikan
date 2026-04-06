// File: app/(tabs)/home.jsx
import React, { useState, useCallback, useContext } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, FlatList, SafeAreaView, RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, router } from 'expo-router';
import { ThemeLangContext } from '../../context/ThemeLangContext'; 

// PENTING: Ganti dengan IP Address laptop Anda (IPv4)
const API_BASE_URL = 'http://172.17.72.241:8000/api'; 

const leagueMap = {
  'E0': 'Premier League', 'I1': 'Serie A', 'D1': 'Bundesliga', 'SP1': 'La Liga', 'F1': 'Ligue 1',
  'N1': 'Eredivisie', 'B1': 'Pro League', 'P1': 'Liga Portugal Betclic', 'SC0': 'Scottish Premiership', 'T1': 'Trendyol Süper Lig', 'G1': 'Stoiximan Super League'
};

const TOP_5_LEAGUES = ['E0', 'I1', 'D1', 'SP1', 'F1'];

export default function HomeScreen() {
  const { t, colors } = useContext(ThemeLangContext);
  const styles = getStyles(colors); // Aktifkan render dinamis

  const [username, setUsername] = useState('User');
  const [balance, setBalance] = useState(0);
  const [articles, setArticles] = useState([]);
  const [fixtures, setFixtures] = useState([]); 
  const [leaders, setLeaders] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => { fetchHomeData(); }, [])
  );

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) setUsername(storedUsername);

      if (token) {
        const balanceRes = await fetch(`${API_BASE_URL}/user/balance`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (balanceRes.ok) { const balanceData = await balanceRes.json(); setBalance(balanceData.points || 0); }
      }

      const articlesRes = await fetch(`${API_BASE_URL}/articles`);
      if (articlesRes.ok) { const articlesData = await articlesRes.json(); setArticles(articlesData.slice(0, 3)); }

      const fixturesRes = await fetch(`${API_BASE_URL}/fixtures`);
      if (fixturesRes.ok) {
        const fixturesData = await fixturesRes.json();
        const topMatches = fixturesData.filter(match => TOP_5_LEAGUES.includes(match.league_name) || ['Premier League', 'Serie A', 'Bundesliga', 'La Liga', 'Ligue 1'].includes(match.league_name));
        setFixtures(topMatches.slice(0, 5));
      }

      const leadersRes = await fetch(`${API_BASE_URL}/leaderboard`);
      if (leadersRes.ok) { const leadersData = await leadersRes.json(); setLeaders(leadersData.slice(0, 15)); }
    } catch (error) { console.error("Gagal memuat data home:", error);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchHomeData(); };

  const renderArticleCard = ({ item }) => (
    <TouchableOpacity style={styles.articleCard} onPress={() => alert(`Buka artikel: ${item.title}`)}>
      <View style={styles.articleContent}>
        <View style={styles.articleHeader}>
          <Text style={styles.articleCategory}>{item.category.toUpperCase()}</Text>
          <Text style={styles.articleReadTime}>{item.read_time}</Text>
        </View>
        <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.articleExcerpt} numberOfLines={2}>{item.excerpt}</Text>
      </View>
      <View style={[styles.articleIndicator, { backgroundColor: item.color ? item.color.split(' ')[0] : colors.primary }]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}>
        
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.subtitleText}>SYNTHETIC ORACLE</Text>
            <Text style={styles.welcomeText}>{(t.welcomeBack || 'WELCOME BACK')}, <Text style={styles.usernameText}>{username.toUpperCase()}</Text></Text>
          </View>
          <View style={styles.balanceBadge}><Text style={styles.balanceText}>🪙 {balance.toLocaleString()}</Text></View>
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)/predict')}>
          <Text style={styles.ctaButtonText}>{t.startPredicting || 'START PREDICTING NOW 🚀'}</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.latestInsights || 'LATEST INSIGHTS'}</Text>
        </View>

        {loading && !refreshing ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} /> : articles.length > 0 ? (
          <FlatList data={articles} keyExtractor={(item) => item.id.toString()} renderItem={renderArticleCard} horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.articlesList} />
        ) : <View style={styles.emptyState}><Text style={styles.emptyText}>{t.noInsights || 'Belum ada insight terbaru.'}</Text></View>}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.upcomingMatches || 'BIG 5 LEAGUES UPCOMING'}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}><Text style={styles.seeAllText}>{t.viewAll || 'VIEW ALL'}</Text></TouchableOpacity>
        </View>

        {loading && !refreshing ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} /> : fixtures.length > 0 ? (
          fixtures.map((item, index) => (
            <TouchableOpacity key={item.id.toString()} style={styles.fixtureCard} activeOpacity={0.7} onPress={() => {
                router.push({ pathname: '/(tabs)/predict', params: { league_name: item.league_name, home_team: item.home_team, away_team: item.away_team, odds_h: item.odds_h, odds_d: item.odds_d, odds_a: item.odds_a, odds_over: item.odds_over, odds_under: item.odds_under } });
              }}>
              <View style={styles.fixtureTimeBox}><Text style={styles.fixtureTime}>{item.time}</Text></View>
              <View style={styles.fixtureMatch}>
                <Text style={styles.fixtureTeam} numberOfLines={1}>{item.home_team}</Text>
                <View style={styles.vsBox}><Text style={styles.vsText}>VS</Text></View>
                <Text style={styles.fixtureTeam} numberOfLines={1}>{item.away_team}</Text>
              </View>
              <View style={styles.fixtureLeagueBox}><Text style={styles.fixtureLeagueText} numberOfLines={1}>{leagueMap[item.league_name] || item.league_name}</Text></View>
            </TouchableOpacity>
          ))
        ) : <View style={styles.emptyState}><Text style={styles.emptyText}>{t.noUpcoming || 'Tidak ada jadwal liga top mendatang.'}</Text></View>}

        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>{t.topAnalysts || 'TOP ANALYSTS'}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/ranking')}><Text style={styles.seeAllText}>{t.viewRanking || 'VIEW RANKING'}</Text></TouchableOpacity>
        </View>

        {loading && !refreshing ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} /> : leaders.length > 0 ? (
          <View style={styles.leaderboardContainer}>
            <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
              {leaders.map((item, index) => (
                <View key={index.toString()} style={styles.leaderboardRow}>
                  <Text style={[styles.rankNumber, index < 3 && styles.topRankNumber]}>{index + 1}</Text>
                  <View style={styles.leaderAvatar}><Text style={styles.leaderAvatarText}>{item.username.charAt(0).toUpperCase()}</Text></View>
                  <Text style={styles.leaderName} numberOfLines={1}>@{item.username}</Text>
                  <View style={styles.leaderPointsBox}>
                    <Text style={styles.leaderPoints}>{item.points.toLocaleString()}</Text><Text style={styles.ptsLabel}>PTS</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : <View style={styles.emptyState}><Text style={styles.emptyText}>{t.noRanking || 'Belum ada data ranking.'}</Text></View>}

      </ScrollView>
    </SafeAreaView>
  );
}

// STRATEGI BARU: Menerima objek 'c' (colors) untuk styling dinamis
const getStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  welcomeSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  subtitleText: { color: c.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 },
  welcomeText: { color: c.text, fontSize: 20, fontWeight: '900' },
  usernameText: { color: c.secondary },
  balanceBadge: { backgroundColor: c.badgeBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: c.primary },
  balanceText: { color: c.gold, fontSize: 14, fontWeight: 'bold' },
  ctaButton: { backgroundColor: c.secondary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 30, shadowColor: c.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  ctaButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 }, // Tetap putih untuk tombol
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { color: c.textSec, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
  seeAllText: { color: c.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  articlesList: { paddingBottom: 15 },
  articleCard: { flexDirection: 'row', width: 280, height: 120, backgroundColor: c.surface, borderRadius: 16, marginRight: 15, overflow: 'hidden', borderWidth: 1, borderColor: c.border },
  articleContent: { flex: 1, padding: 15 },
  articleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  articleCategory: { color: c.text, fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  articleReadTime: { color: c.textMuted, fontSize: 9, fontWeight: 'bold' },
  articleTitle: { color: c.text, fontSize: 13, fontWeight: 'bold', marginBottom: 5 },
  articleExcerpt: { color: c.textSec, fontSize: 10, lineHeight: 14 },
  articleIndicator: { width: 4, height: '100%' },
  emptyState: { backgroundColor: c.surface, borderRadius: 12, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: c.border },
  emptyText: { color: c.textMuted, fontSize: 12, fontStyle: 'italic' },
  fixtureCard: { flexDirection: 'row', backgroundColor: c.surfaceHighlight, borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: c.border },
  fixtureTimeBox: { width: 50, borderRightWidth: 1, borderRightColor: c.border, alignItems: 'center', paddingRight: 10 },
  fixtureTime: { color: c.text, fontSize: 13, fontWeight: '900' },
  fixtureMatch: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  fixtureTeam: { flex: 1, color: c.textSec, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  vsBox: { backgroundColor: c.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginHorizontal: 5, borderWidth: 1, borderColor: c.border },
  vsText: { color: c.textMuted, fontSize: 8, fontWeight: '900' },
  fixtureLeagueBox: { width: 60, alignItems: 'flex-end' },
  fixtureLeagueText: { color: c.primary, fontSize: 8, fontWeight: 'bold', textAlign: 'right' },
  leaderboardContainer: { height: 280, backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 10, marginBottom: 20 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surfaceHighlight, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: c.border },
  rankNumber: { color: c.textMuted, fontSize: 14, fontWeight: '900', width: 25, textAlign: 'center' },
  topRankNumber: { color: c.gold },
  leaderAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.border, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
  leaderAvatarText: { color: c.textSec, fontSize: 12, fontWeight: 'bold' },
  leaderName: { flex: 1, color: c.text, fontSize: 13, fontWeight: 'bold' },
  leaderPointsBox: { alignItems: 'flex-end' },
  leaderPoints: { color: c.gold, fontSize: 14, fontWeight: '900' },
  ptsLabel: { color: c.textMuted, fontSize: 8, fontWeight: 'bold', marginTop: 2 }
});