// File: app/(tabs)/ranking.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { ThemeLangContext } from '../../context/ThemeLangContext'; // IMPORT GUDANG UTAMA

// PENTING: Ganti dengan IP Address laptop Anda (IPv4)
const API_BASE_URL = 'https://l1prediksikan.my.id/api'; 

export default function RankingScreen() {
  // PANGGIL THEME & BAHASA
  const { t, colors } = useContext(ThemeLangContext);
  const styles = getStyles(colors);

  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/leaderboard`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLeaders(data);
        }
      })
      .catch(err => console.error("Gagal memuat leaderboard:", err))
      .finally(() => setLoading(false));
  }, []);

  // Pisahkan Top 3 untuk podium, sisanya untuk list ke bawah
  const top3 = leaders.slice(0, 3);
  const remaining = leaders.slice(3);

  // Komponen untuk List Ranking ke-4 dan seterusnya
  const renderItem = ({ item, index }) => (
    <View style={styles.listItem}>
      <Text style={styles.listRank}>{String(index + 4).padStart(2, '0')}</Text>
      
      <View style={styles.listAvatar}>
        <Text style={styles.avatarTextSm}>{item.username.charAt(0).toUpperCase()}</Text>
      </View>
      
      <View style={styles.listInfo}>
        <Text style={styles.listUsername}>@{item.username}</Text>
        <Text style={styles.listRole}>{t.elitePredictor || 'ELITE PREDICTOR'}</Text>
      </View>
      
      <View style={styles.listPoints}>
        <Text style={styles.pointsValue}>{item.points.toLocaleString()}</Text>
        <Text style={styles.pointsLabel}>{t.coins || 'COINS'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.seasonBadge}>
          <Text style={styles.seasonText}>{t.currentSeason || 'CURRENT SEASON'}</Text>
        </View>
        <Text style={styles.title}>{t.globalRankingsTitle || 'Global Rankings'}</Text>
        <Text style={styles.subtitle}>
          {t.globalRankingsDesc || 'Predict matches, climb the leaderboard, and claim your place among the elite tactical analysts.'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t.syncRanking || 'SINKRONISASI RANKING...'}</Text>
        </View>
      ) : leaders.length > 0 ? (
        <FlatList
          data={remaining}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.podiumContainer}>
              {/* RANK 2 (KIRI) */}
              {top3[1] && (
                <View style={[styles.podiumCard, styles.podiumSide]}>
                  <View style={styles.medalBox}><Text style={{fontSize: 16}}>🥈</Text></View>
                  <View style={[styles.avatarLg, { borderColor: '#9CA3AF' }]}>
                    <Text style={styles.avatarTextLg}>{top3[1].username.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>@{top3[1].username}</Text>
                  <Text style={styles.podiumRole}>{t.silverOracle || 'Silver Oracle'}</Text>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeText}>🪙 {top3[1].points.toLocaleString()}</Text>
                  </View>
                </View>
              )}

              {/* RANK 1 (TENGAH) */}
              {top3[0] && (
                <View style={[styles.podiumCard, styles.podiumCenter]}>
                  <View style={styles.crownBadge}>
                    <Text style={styles.crownText}>{t.currentKing || 'CURRENT KING'}</Text>
                  </View>
                  <View style={styles.medalBoxCenter}><Text style={{fontSize: 20}}>🏆</Text></View>
                  <View style={[styles.avatarXl, { borderColor: '#F59E0B' }]}>
                    <Text style={styles.avatarTextXl}>{top3[0].username.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.podiumNameCenter} numberOfLines={1}>@{top3[0].username}</Text>
                  <Text style={styles.podiumRoleCenter}>{t.masterProphet || 'Master Prophet'}</Text>
                  <View style={styles.pointsBadgeCenter}>
                    <Text style={styles.pointsBadgeTextCenter}>🪙 {top3[0].points.toLocaleString()}</Text>
                  </View>
                </View>
              )}

              {/* RANK 3 (KANAN) */}
              {top3[2] && (
                <View style={[styles.podiumCard, styles.podiumSide]}>
                  <View style={styles.medalBox}><Text style={{fontSize: 16}}>🥉</Text></View>
                  <View style={[styles.avatarLg, { borderColor: '#D97706' }]}>
                    <Text style={styles.avatarTextLg}>{top3[2].username.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>@{top3[2].username}</Text>
                  <Text style={styles.podiumRole}>{t.bronzeAnalyst || 'Bronze Analyst'}</Text>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeText}>🪙 {top3[2].points.toLocaleString()}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t.noUsersLeaderboard || 'Belum ada pengguna di leaderboard.'}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// STRATEGI STYLING DINAMIS
const getStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 30, paddingBottom: 20 },
  seasonBadge: { backgroundColor: c.badgeBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  seasonText: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  title: { color: c.text, fontSize: 28, fontWeight: '900', marginBottom: 10 },
  subtitle: { color: c.textSec, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: c.textMuted, marginTop: 15, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  emptyText: { color: c.textMuted, fontSize: 14, fontStyle: 'italic' },
  listContainer: { paddingBottom: 100 }, // Padding bottom agar tidak tertutup TabBar
  
  // PODIUM STYLES
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 10, marginTop: 10, marginBottom: 30, height: 250 },
  podiumCard: { backgroundColor: c.surface, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: c.border, paddingVertical: 15, paddingHorizontal: 5 },
  podiumSide: { width: '30%', height: 180, marginHorizontal: 5 },
  podiumCenter: { width: '35%', height: 220, marginHorizontal: 5, backgroundColor: c.badgeBg, borderColor: c.primary, borderWidth: 1.5, zIndex: 10, shadowColor: c.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  medalBox: { position: 'absolute', top: 10, right: 10 },
  medalBoxCenter: { position: 'absolute', top: 25, right: 10 },
  crownBadge: { position: 'absolute', top: -12, backgroundColor: c.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  crownText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  avatarLg: { width: 50, height: 50, borderRadius: 25, backgroundColor: c.surfaceHighlight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 10, marginTop: 15 },
  avatarXl: { width: 60, height: 60, borderRadius: 30, backgroundColor: c.surfaceHighlight, justifyContent: 'center', alignItems: 'center', borderWidth: 3, marginBottom: 10, marginTop: 20 },
  avatarTextLg: { color: c.text, fontSize: 20, fontWeight: 'bold' },
  avatarTextXl: { color: c.text, fontSize: 24, fontWeight: 'bold' },
  podiumName: { color: c.textSec, fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  podiumNameCenter: { color: c.text, fontSize: 14, fontWeight: '900', marginBottom: 2 },
  podiumRole: { color: c.textMuted, fontSize: 8, marginBottom: 10 },
  podiumRoleCenter: { color: c.primary, fontSize: 9, fontWeight: 'bold', marginBottom: 15 },
  pointsBadge: { backgroundColor: c.surfaceHighlight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pointsBadgeCenter: { backgroundColor: c.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  pointsBadgeText: { color: c.gold, fontSize: 10, fontWeight: 'bold' },
  pointsBadgeTextCenter: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  // LIST STYLES (Rank 4+)
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, marginHorizontal: 20, marginBottom: 10, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: c.border },
  listRank: { color: c.textMuted, fontSize: 16, fontWeight: '900', width: 30 },
  listAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.surfaceHighlight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTextSm: { color: c.textSec, fontSize: 14, fontWeight: 'bold' },
  listInfo: { flex: 1 },
  listUsername: { color: c.text, fontSize: 14, fontWeight: 'bold' },
  listRole: { color: c.textMuted, fontSize: 9, marginTop: 2 },
  listPoints: { alignItems: 'flex-end' },
  pointsValue: { color: c.gold, fontSize: 14, fontWeight: '900' },
  pointsLabel: { color: c.textMuted, fontSize: 8, fontWeight: 'bold', marginTop: 2 }
});