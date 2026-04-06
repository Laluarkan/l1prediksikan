// File: app/(tabs)/performance.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Modal, FlatList, SafeAreaView
} from 'react-native';
import { ThemeLangContext } from '../../context/ThemeLangContext'; // IMPORT GUDANG UTAMA

// PENTING: Ganti dengan IP Address laptop Anda (IPv4)
const API_BASE_URL = 'http://172.17.72.241:8000/api'; 

const leagueMap = {
  'E0': 'Premier League', 'I1': 'Serie A', 'D1': 'Bundesliga', 'SP1': 'La Liga', 'F1': 'Ligue 1',
  'N1': 'Eredivisie', 'B1': 'Pro League', 'P1': 'Liga Portugal Betclic', 'SC0': 'Scottish Premiership', 'T1': 'Trendyol Süper Lig', 'G1': 'Stoiximan Super League'
};

export default function PerformanceScreen() {
  // PANGGIL THEME & BAHASA
  const { t, colors } = useContext(ThemeLangContext);
  const styles = getStyles(colors);

  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/leagues`)
      .then(res => res.json())
      .then(data => {
          setLeagues(data);
          if(data.length > 0) {
              setSelectedLeague(data[0].name);
          }
      })
      .catch(() => console.error("Gagal memuat liga"));
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      setLoading(true);
      fetch(`${API_BASE_URL}/performance/${selectedLeague}`)
        .then(res => res.json())
        .then(data => {
          const sortedData = data.sort((a, b) => b.season.localeCompare(a.season));
          setStats(sortedData);
        })
        .catch(() => console.error("Gagal memuat data performa"))
        .finally(() => setLoading(false));
    } else {
        setStats([]);
    }
  }, [selectedLeague]);

  const getAccuracyColor = (val) => {
    if (val >= 65) return '#10B981'; // Green 
    if (val >= 50) return colors.gold || '#F59E0B'; // Yellow 
    return colors.danger || '#EF4444'; // Red 
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.headerBox}>
          <Text style={styles.subtitle}>{t.syntheticOracle || 'THE SYNTHETIC ORACLE'}</Text>
          <Text style={styles.title}>{t.modelAccuracy || 'MODEL ACCURACY'}</Text>
          <Text style={styles.description}>
            {t.modelDesc || 'Historical verification of our AI predictive capabilities across major European football leagues.'}
          </Text>
        </View>

        {/* League Selector */}
        <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
          <Text style={styles.selectorLabel}>{t.currentLeague || 'CURRENT LEAGUE'}</Text>
          <View style={styles.selectorRow}>
            <Text style={styles.selectorValue}>
              {selectedLeague ? (leagueMap[selectedLeague] || selectedLeague) : (t.selectLeague || 'Select a League...')}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* Loading Indicator */}
        {loading ? (
           <View style={styles.center}>
             <ActivityIndicator size="large" color={colors.secondary} />
             <Text style={styles.loadingText}>{t.calcTelemetry || 'CALCULATING TELEMETRY...'}</Text>
           </View>
        ) : stats.length > 0 ? (
          /* Performance Cards per Season */
          stats.map((s, index) => (
            <View key={index} style={styles.seasonBlock}>
              <View style={styles.seasonHeader}>
                <View>
                  <Text style={styles.seasonYear}>{s.season}</Text>
                  <Text style={styles.seasonLabel}>
                    {index === 0 ? (t.currentActiveCycle || 'CURRENT ACTIVE CYCLE') : (t.legacyModel || 'LEGACY MODEL')}
                  </Text>
                </View>
                {index === 0 && (
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>{t.liveUpdates || 'LIVE UPDATES'}</Text>
                  </View>
                )}
              </View>

              <View style={styles.statsGrid}>
                {/* HDA Box */}
                <View style={styles.statBox}>
                   <View style={styles.statHeader}>
                      <Text style={styles.statIcon}>📊</Text>
                      <Text style={styles.statTitle}>{t.hdaAccuracy || 'HDA ACCURACY'}</Text>
                   </View>
                   <Text style={[styles.statValue, { color: getAccuracyColor(s.hda_accuracy) }]}>
                      {s.hda_accuracy}<Text style={styles.percentSymbol}>%</Text>
                   </Text>
                   <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${s.hda_accuracy}%`, backgroundColor: '#3B82F6' }]} />
                   </View>
                </View>

                {/* O/U Box */}
                <View style={styles.statBox}>
                   <View style={styles.statHeader}>
                      <Text style={styles.statIcon}>📈</Text>
                      <Text style={styles.statTitle}>{t.ouAccuracy || 'O/U 2.5 ACCURACY'}</Text>
                   </View>
                   <Text style={[styles.statValue, { color: getAccuracyColor(s.ou_accuracy) }]}>
                      {s.ou_accuracy}<Text style={styles.percentSymbol}>%</Text>
                   </Text>
                   <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${s.ou_accuracy}%`, backgroundColor: '#F472B6' }]} />
                   </View>
                </View>

                {/* BTTS Box */}
                <View style={styles.statBox}>
                   <View style={styles.statHeader}>
                      <Text style={styles.statIcon}>⚽</Text>
                      <Text style={styles.statTitle}>{t.bttsAccuracy || 'BTTS ACCURACY'}</Text>
                   </View>
                   <Text style={[styles.statValue, { color: getAccuracyColor(s.btts_accuracy) }]}>
                      {s.btts_accuracy}<Text style={styles.percentSymbol}>%</Text>
                   </Text>
                   <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${s.btts_accuracy}%`, backgroundColor: '#F59E0B' }]} />
                   </View>
                </View>
              </View>
              
              {/* Total Matches Info */}
              <Text style={styles.matchesText}>{(t.verifiedOver || 'Verified over')} {s.total_matches} {(t.matches || 'matches.')}</Text>
            </View>
          ))
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyText}>{t.noPerfData || 'Tidak ada data performa untuk liga ini.'}</Text>
          </View>
        )}
        
        {/* Footer Methodology Box */}
        <View style={styles.methodologyBox}>
           <View style={{flex: 1, paddingRight: 15}}>
              <Text style={styles.methodologyTitle}>{t.methodologyTitle || 'Detailed Methodology'}</Text>
              <Text style={styles.methodologyDesc}>
                {t.methodologyDesc || 'Our Synthetic Oracle model is retrained every Monday using advanced neural networks and deep-match telemetry.'}
              </Text>
           </View>
           <TouchableOpacity style={styles.methodologyButton}>
              <Text style={styles.methodologyBtnText}>{t.readWhitepaper || 'Read Whitepaper'}</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal Selector League */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectLeagueTitle || 'Select League'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✖</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={leagues}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => {
                    setSelectedLeague(item.name);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText, 
                    selectedLeague === item.name && styles.modalItemTextActive
                  ]}>
                    {leagueMap[item.name] || item.name}
                  </Text>
                  {selectedLeague === item.name && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// STRATEGI STYLING DINAMIS
const getStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  scrollContent: { padding: 20, paddingBottom: 100 },
  headerBox: { backgroundColor: c.surface, padding: 25, borderRadius: 16, borderWidth: 1, borderColor: c.border, marginBottom: 25 },
  subtitle: { color: c.secondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 },
  title: { color: c.text, fontSize: 26, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  description: { color: c.textSec, fontSize: 12, lineHeight: 18 },
  selector: { backgroundColor: c.surfaceHighlight, padding: 15, borderRadius: 12, marginBottom: 30, borderWidth: 1, borderColor: c.border },
  selectorLabel: { color: c.textMuted, fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  selectorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectorValue: { color: c.text, fontSize: 16, fontWeight: 'bold' },
  dropdownIcon: { color: c.textMuted, fontSize: 12 },
  center: { paddingVertical: 50, alignItems: 'center' },
  loadingText: { color: c.textSec, marginTop: 15, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  emptyText: { color: c.textMuted, fontSize: 14, fontStyle: 'italic' },
  seasonBlock: { marginBottom: 40 },
  seasonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seasonYear: { color: c.text, fontSize: 20, fontWeight: '900' },
  seasonLabel: { color: c.textMuted, fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  liveBadge: { backgroundColor: c.badgeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: c.primary },
  liveBadgeText: { color: c.primary, fontSize: 9, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { backgroundColor: c.surface, flex: 1, marginHorizontal: 4, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border },
  statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statIcon: { fontSize: 12, marginRight: 6 },
  statTitle: { color: c.textSec, fontSize: 8, fontWeight: 'bold' },
  statValue: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
  percentSymbol: { fontSize: 14 },
  barBg: { height: 4, backgroundColor: c.border, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  matchesText: { color: c.textSec, fontSize: 10, textAlign: 'right', marginTop: 8, fontStyle: 'italic' },
  methodologyBox: { backgroundColor: c.surfaceHighlight, flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: c.border },
  methodologyTitle: { color: c.text, fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  methodologyDesc: { color: c.textSec, fontSize: 10, lineHeight: 16 },
  methodologyButton: { backgroundColor: c.primary, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  methodologyBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }, // Teks tombol tetap putih agar kontras
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: c.border },
  modalTitle: { color: c.text, fontSize: 16, fontWeight: 'bold' },
  modalClose: { color: c.textSec, fontSize: 18 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: c.border },
  modalItemText: { color: c.textSec, fontSize: 14 },
  modalItemTextActive: { color: c.primary, fontWeight: 'bold' },
  checkIcon: { color: c.primary, fontWeight: 'bold' }
});