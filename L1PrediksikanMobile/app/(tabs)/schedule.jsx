// File: app/(tabs)/schedule.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  TextInput, TouchableOpacity, SafeAreaView 
} from 'react-native';
import { router } from 'expo-router'; 
import { ThemeLangContext } from '../../context/ThemeLangContext'; // IMPORT GUDANG UTAMA

// PENTING: Ganti dengan IP Address laptop Anda (IPv4)
const API_BASE_URL = 'http://172.17.72.241:8000/api'; 

const leagueMap = {
  'E0': 'Premier League', 'I1': 'Serie A', 'D1': 'Bundesliga', 'SP1': 'La Liga', 'F1': 'Ligue 1',
  'N1': 'Eredivisie', 'B1': 'Pro League', 'P1': 'Liga Portugal Betclic', 'SC0': 'Scottish Premiership', 'T1': 'Trendyol Süper Lig', 'G1': 'Stoiximan Super League'
};

export default function ScheduleScreen() {
  // PANGGIL THEME & BAHASA DARI CONTEXT
  const { t, colors } = useContext(ThemeLangContext);
  const styles = getStyles(colors);

  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFixtures();
  }, []);

  const fetchFixtures = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/fixtures`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setFixtures(data);
      }
    } catch (error) {
      console.error("Gagal memuat jadwal:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFixtures = fixtures.filter((f) => {
    const searchLower = searchTerm.toLowerCase();
    const homeTeamLower = f.home_team.toLowerCase();
    const awayTeamLower = f.away_team.toLowerCase();
    const realLeagueName = (leagueMap[f.league_name] || f.league_name).toLowerCase();
    
    return (
      homeTeamLower.includes(searchLower) || 
      awayTeamLower.includes(searchLower) || 
      realLeagueName.includes(searchLower)
    );
  });

  const renderFixtureItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: '/(tabs)/predict',
          params: {
            league_name: item.league_name,
            home_team: item.home_team,
            away_team: item.away_team,
            odds_h: item.odds_h,
            odds_d: item.odds_d,
            odds_a: item.odds_a,
            odds_over: item.odds_over,
            odds_under: item.odds_under
          }
        });
      }}
    >
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{item.time}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>

      <View style={styles.matchColumn}>
        <View style={styles.teamRow}>
          <Text style={styles.teamText} numberOfLines={1}>{item.home_team}</Text>
        </View>
        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        <View style={styles.teamRow}>
          <Text style={styles.teamText} numberOfLines={1}>{item.away_team}</Text>
        </View>
      </View>

      <View style={styles.leagueColumn}>
        <View style={styles.leagueBadge}>
          <Text style={styles.leagueText}>{leagueMap[item.league_name] || item.league_name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.matchSchedule || 'MATCH SCHEDULE'}</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{t.wibLive || 'WIB (LIVE)'}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchPlaceholder || 'Search team or league...'}
          placeholderTextColor={colors.textMuted}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Text style={styles.clearIcon}>✖</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t.loadingSchedule || 'Memuat Jadwal...'}</Text>
        </View>
      ) : filteredFixtures.length > 0 ? (
        <FlatList
          data={filteredFixtures}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFixtureItem}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t.noScheduleFound || 'Tidak ada jadwal ditemukan.'}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// STRATEGI STYLING DINAMIS
const getStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: c.text, letterSpacing: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: c.border },
  liveDot: { width: 8, height: 8, backgroundColor: '#10B981', borderRadius: 4, marginRight: 6 },
  liveText: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, marginHorizontal: 20, marginBottom: 15, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: 15, height: 50 },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, color: c.text, fontSize: 14 },
  clearIcon: { color: c.textMuted, fontSize: 14, padding: 5 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: c.surfaceHighlight, borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: c.border },
  timeColumn: { width: 60, borderRightWidth: 1, borderRightColor: c.border, paddingRight: 10 },
  timeText: { color: c.text, fontSize: 16, fontWeight: '900' },
  dateText: { color: c.textMuted, fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  matchColumn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  teamRow: { flex: 1, alignItems: 'center' },
  teamText: { color: c.text, fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  vsBadge: { backgroundColor: c.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginHorizontal: 8, borderWidth: 1, borderColor: c.border },
  vsText: { color: c.textMuted, fontSize: 9, fontWeight: '900' },
  leagueColumn: { width: 70, alignItems: 'flex-end' },
  leagueBadge: { backgroundColor: c.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: c.border },
  leagueText: { color: c.primary, fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: c.textMuted, marginTop: 10, fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: c.textMuted, fontSize: 14, fontStyle: 'italic' }
});