// File: app/(tabs)/portfolio.jsx
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  SafeAreaView, TouchableOpacity, RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { ThemeLangContext } from '../../context/ThemeLangContext'; // IMPORT GUDANG UTAMA

// PENTING: Ganti dengan IP Address laptop Anda (IPv4)
const API_BASE_URL = 'https://l1prediksikan.my.id/api'; 

const leagueMap = {
  'E0': 'Premier League', 'I1': 'Serie A', 'D1': 'Bundesliga', 'SP1': 'La Liga', 'F1': 'Ligue 1',
  'N1': 'Eredivisie', 'B1': 'Pro League', 'P1': 'Liga Portugal Betclic', 'SC0': 'Scottish Premiership', 'T1': 'Trendyol Süper Lig', 'G1': 'Stoiximan Super League'
};

export default function PortfolioScreen() {
  // PANGGIL THEME & BAHASA DARI CONTEXT
  const { t, colors } = useContext(ThemeLangContext);
  const styles = getStyles(colors);

  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ balance: 0, winRate: 0, rank: 'N/A' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPortfolioData();
    }, [])
  );

  const fetchPortfolioData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // 1. Ambil Balance/Koin User
      const balanceRes = await fetch(`${API_BASE_URL}/user/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const balanceData = await balanceRes.json();

      // 2. Ambil Riwayat Prediksi (Bets)
      const historyRes = await fetch(`${API_BASE_URL}/bets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historyData = await historyRes.ok ? await historyRes.json() : [];

      // 3. Kalkulasi Win Rate
      let calculatedWinRate = 0;
      if (Array.isArray(historyData)) {
        const completedBets = historyData.filter(b => b.status === 'WON' || b.status === 'LOST');
        const wonBets = completedBets.filter(b => b.status === 'WON');
        if (completedBets.length > 0) {
          calculatedWinRate = ((wonBets.length / completedBets.length) * 100).toFixed(1);
        }
        setHistory(historyData.sort((a, b) => new Date(b.created_at || b.match_date) - new Date(a.created_at || a.match_date)));
      }

      setStats({
        balance: balanceData.points || 0,
        winRate: balanceData.win_rate || calculatedWinRate,
        rank: balanceData.rank ? `#${balanceData.rank}` : 'Unranked'
      });

    } catch (error) {
      console.error("Gagal memuat data portofolio:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPortfolioData();
  };

  const getStatusStyle = (status) => {
    if (status === 'WON') return { bg: colors.secondary, text: '#FFFFFF', label: t.won || 'WON' };
    if (status === 'LOST') return { bg: colors.border, text: colors.textSec, label: t.lost || 'LOST' };
    return { bg: colors.gold, text: '#000000', label: t.pending || 'PENDING' };
  };

  const renderHistoryItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    
    return (
      <View style={styles.historyCard}>
        {/* Card Header */}
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.leagueText}>{leagueMap[item.league] || item.league}</Text>
            <Text style={styles.dateText}>{item.match_date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>

        {/* Match Info */}
        <View style={styles.matchInfo}>
          <Text style={styles.teamText} numberOfLines={1}>{item.home_team}</Text>
          <View style={styles.scoreBox}>
             <Text style={styles.scoreText}>{item.status === 'PENDING' ? 'VS' : 'FT'}</Text>
          </View>
          <Text style={styles.teamText} numberOfLines={1}>{item.away_team}</Text>
        </View>

        {/* Bet Details */}
        <View style={styles.betDetails}>
          <View>
            <Text style={styles.detailLabel}>{t.predicted || 'PREDICTED'}</Text>
            <Text style={styles.detailValue}>{item.bet_choice} <Text style={styles.oddsText}>({item.odds}x)</Text></Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.detailLabel}>{item.status === 'WON' ? (t.profit || 'PROFIT') : (t.stake || 'STAKE')}</Text>
            <Text style={[
              styles.detailValue, 
              item.status === 'WON' ? { color: colors.secondary } : item.status === 'LOST' ? { color: colors.danger } : { color: colors.gold }
            ]}>
              {item.status === 'WON' ? '+' : item.status === 'LOST' ? '-' : ''}
              {item.status === 'WON' ? (item.stake * item.odds).toFixed(0) : item.stake} {t.coins || 'Coins'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Dashboard Stat */}
      <View style={styles.statsContainer}>
        <View style={styles.balanceBox}>
          <Text style={styles.statsLabel}>{t.totalBalance || 'TOTAL BALANCE'}</Text>
          <Text style={styles.balanceValue}>
            {stats.balance.toLocaleString()} <Text style={styles.balanceSuffix}>{t.coins || 'COINS'}</Text>
          </Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.subStatBox}>
            <Text style={styles.statsLabel}>{t.winRate || 'WIN RATE'}</Text>
            <Text style={styles.subStatValue}>{stats.winRate}%</Text>
          </View>
          <View style={styles.subStatDivider} />
          <View style={styles.subStatBox}>
            <Text style={styles.statsLabel}>{t.rank || 'RANK'}</Text>
            <Text style={styles.rankValue}>{stats.rank}</Text>
          </View>
        </View>
      </View>

      {/* History Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{t.historyOfPredictions || 'History of Predictions'}</Text>
        <TouchableOpacity>
           <Text style={styles.filterText}>{t.filter || 'Filter'} ≑</Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t.fetchingHistory || 'Fetching Oracle History...'}</Text>
        </View>
      ) : history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t.noHistory || 'No prediction history yet.'}</Text>
          <Text style={styles.emptySubText}>{t.startPredictingHint || 'Use the Prediction menu to start analyzing.'}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// STRATEGI STYLING DINAMIS
const getStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  statsContainer: { backgroundColor: c.surface, margin: 20, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: c.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  balanceBox: { marginBottom: 20 },
  statsLabel: { color: c.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 5 },
  balanceValue: { color: c.text, fontSize: 36, fontWeight: '900' },
  balanceSuffix: { color: c.textSec, fontSize: 16, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: c.surfaceHighlight, borderRadius: 12, padding: 15, borderWidth: 1, borderColor: c.border },
  subStatBox: { flex: 1 },
  subStatDivider: { width: 1, backgroundColor: c.border, marginHorizontal: 15 },
  subStatValue: { color: c.text, fontSize: 18, fontWeight: 'bold' },
  rankValue: { color: '#F472B6', fontSize: 18, fontWeight: 'bold' }, // Warna pink khusus ranking (tetap)
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  listTitle: { color: c.text, fontSize: 18, fontWeight: 'bold' },
  filterText: { color: c.textSec, fontSize: 12, fontWeight: 'bold' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 }, // PADDING BOTTOM DITAMBAHKAN AGAR TIDAK TERTUTUP NAVBAR BAWAH
  historyCard: { backgroundColor: c.surface, borderRadius: 12, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: c.border },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  leagueText: { color: c.textSec, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  dateText: { color: c.textMuted, fontSize: 9, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  matchInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border },
  teamText: { flex: 1, color: c.text, fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  scoreBox: { paddingHorizontal: 10 },
  scoreText: { color: c.textMuted, fontSize: 10, fontWeight: 'bold' },
  betDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: c.textMuted, fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  detailValue: { color: c.text, fontSize: 13, fontWeight: 'bold' },
  oddsText: { color: c.textSec, fontWeight: 'normal', fontSize: 11 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  loadingText: { color: c.textSec, marginTop: 15, fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: c.text, fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  emptySubText: { color: c.textSec, fontSize: 12 }
});