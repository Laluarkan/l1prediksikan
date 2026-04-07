// File: app/(tabs)/predict.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, Modal, FlatList, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { ThemeLangContext } from '../../context/ThemeLangContext'; // IMPORT GUDANG UTAMA

// PENTING: IP Address laptop Anda (IPv4)
const API_BASE_URL = 'https://l1prediksi-api.onrender.com/api'; 

const leagueMap = {
  'E0': 'Premier League', 'I1': 'Serie A', 'D1': 'Bundesliga', 'SP1': 'La Liga', 'F1': 'Ligue 1',
  'N1': 'Eredivisie', 'B1': 'Pro League', 'P1': 'Liga Portugal Betclic', 'SC0': 'Scottish Premiership', 'T1': 'Trendyol Süper Lig', 'G1': 'Stoiximan Super League'
};

export default function PredictScreen() {
  const params = useLocalSearchParams(); 
  const { league_name, home_team, away_team, odds_h, odds_d, odds_a, odds_over, odds_under } = params;

  // PANGGIL THEME & BAHASA
  const { t, colors } = useContext(ThemeLangContext);
  const styles = getStyles(colors);

  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  
  const [odds, setOdds] = useState({ h: '', d: '', a: '', over: '', under: '' });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [stake, setStake] = useState('100');
  const [betCategory, setBetCategory] = useState('DNB');
  const [placingBet, setPlacingBet] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); 

  useEffect(() => {
    fetch(`${API_BASE_URL}/leagues`)
      .then(res => res.json())
      .then(data => setLeagues(data))
      .catch(() => console.error("Gagal memuat liga"));
  }, []);

  useEffect(() => {
    if (league_name) {
      setSelectedLeague(prev => prev !== league_name ? league_name : prev);
      setHomeTeam(prev => prev !== home_team ? (home_team || '') : prev);
      setAwayTeam(prev => prev !== away_team ? (away_team || '') : prev);
      
      setOdds(prev => {
        if (prev.h === String(odds_h) && prev.d === String(odds_d)) return prev; 
        return {
          h: odds_h ? String(odds_h) : '',
          d: odds_d ? String(odds_d) : '',
          a: odds_a ? String(odds_a) : '',
          over: odds_over ? String(odds_over) : '',
          under: odds_under ? String(odds_under) : ''
        };
      });
      setResult(null); 
    }
  }, [league_name, home_team, away_team, odds_h, odds_d, odds_a, odds_over, odds_under]);

  useEffect(() => {
    if (selectedLeague) {
      fetch(`${API_BASE_URL}/teams/${selectedLeague}`)
        .then(res => res.json())
        .then(data => {
          setTeams(data);
          if (!league_name || league_name !== selectedLeague) {
            setHomeTeam(''); 
            setAwayTeam('');
            setResult(null);
          }
        }).catch(() => console.error("Gagal memuat tim"));
    } else { 
      setTeams([]); 
    }
  }, [selectedLeague]);

  const handlePredict = async () => {
    if (!selectedLeague || !homeTeam || !awayTeam || !odds.h || !odds.d || !odds.a || !odds.over || !odds.under) {
      Alert.alert('Incomplete Data', 'Pilih liga, tim, dan isi semua odds.');
      return;
    }
    setLoading(true);
    setResult(null);
    
    const payload = {
      league_name: selectedLeague, home_team: homeTeam, away_team: awayTeam,
      odds_h: parseFloat(odds.h), odds_d: parseFloat(odds.d), odds_a: parseFloat(odds.a),
      odds_over: parseFloat(odds.over), odds_under: parseFloat(odds.under)
    };

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      setResult(data);
    } catch { 
      Alert.alert('Error', 'Gagal memprediksi. Pastikan server berjalan.');
    } finally { 
      setLoading(false); 
    }
  };

  const handlePlaceBet = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) { Alert.alert("Gagal", "Silakan Login kembali!"); return; }
    
    let choice = ''; let currentOdds = 0.0;
    if (betCategory === 'DNB') {
        choice = result.dnb_prediction.replace(' Win', '');
        currentOdds = choice === homeTeam ? parseFloat(odds.h) : parseFloat(odds.a);
    } else if (betCategory === 'OU') {
        choice = result.ou_prediction;
        currentOdds = choice === 'Over 2.5' ? parseFloat(odds.over) : parseFloat(odds.under);
    } else {
        choice = result.btts_prediction;
        currentOdds = 1.85;
    }

    if (!currentOdds || currentOdds <= 0) { Alert.alert('Error', "Odds tidak valid."); return; }

    setPlacingBet(true);
    try {
        const payload = {
            league: selectedLeague, match_date: new Date().toISOString().split('T')[0], 
            home_team: homeTeam, away_team: awayTeam, bet_category: betCategory, 
            bet_choice: choice, odds: currentOdds, stake: parseInt(stake)
        };
        const res = await fetch(`${API_BASE_URL}/bets/place`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok) { Alert.alert("Success!", "Koin berhasil dipasang! Cek halaman Portfolio Anda."); } 
        else { Alert.alert("Gagal", data.detail || "Gagal memasang koin."); }
    } catch (e) { Alert.alert('Error', "Server error."); } 
    finally { setPlacingBet(false); }
  };

  const ProgressBar = ({ labelLeft, labelRight, probLeft, probRight, colorLeft, colorRight }) => (
    <View style={{ marginBottom: 15 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ color: colors.textSec, fontSize: 10, fontWeight: 'bold' }}>{labelLeft} ({probLeft}%)</Text>
        <Text style={{ color: colors.textSec, fontSize: 10, fontWeight: 'bold' }}>{labelRight} ({probRight}%)</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, flexDirection: 'row', overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${probLeft}%`, backgroundColor: colorLeft }} />
        <View style={{ height: '100%', width: `${probRight}%`, backgroundColor: colorRight }} />
      </View>
    </View>
  );

  const openModal = (type) => {
    if ((type === 'home' || type === 'away') && !selectedLeague) {
      Alert.alert('Warning', 'Pilih liga terlebih dahulu.'); return;
    }
    setModalType(type);
    setModalVisible(true);
  };

  const selectOption = (value) => {
    if (modalType === 'league') {
      setSelectedLeague(value);
      setHomeTeam(''); setAwayTeam(''); 
    }
    if (modalType === 'home') setHomeTeam(value);
    if (modalType === 'away') setAwayTeam(value);
    setModalVisible(false);
  };

  const getModalData = () => {
    if (modalType === 'league') return leagues.map(l => ({ label: leagueMap[l.name] || l.name, value: l.name }));
    if (modalType === 'home') return teams.filter(team => team.name !== awayTeam).map(team => ({ label: team.name, value: team.name }));
    if (modalType === 'away') return teams.filter(team => team.name !== homeTeam).map(team => ({ label: team.name, value: team.name }));
    return [];
  };

  const homeData = teams.find(team => team.name === homeTeam);
  const awayData = teams.find(team => team.name === awayTeam);

  const renderFormBadges = (formStr) => {
    if (!formStr) return <Text style={{color: colors.textMuted}}>-</Text>;
    return (
      <View style={{flexDirection: 'row', gap: 4, justifyContent: 'center'}}>
        {formStr.split('').map((char, idx) => {
          let bgColor = colors.textMuted;
          let icon = '-';
          if (char === 'W') { bgColor = '#10B981'; icon = '✓'; } // Green
          if (char === 'L') { bgColor = '#EF4444'; icon = '×'; } // Red
          if (char === 'D') { bgColor = '#F59E0B'; icon = '-'; } // Yellow
          return (
            <View key={idx} style={{backgroundColor: bgColor, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center'}}>
              <Text style={{color: '#FFF', fontSize: 8, fontWeight: 'bold'}}>{icon}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const StatRow = ({ label, homeVal, awayVal, homeSuffix, awaySuffix, isForm = false, isDiff = false }) => (
    <View style={styles.statRow}>
      <View style={styles.statCol}>
        {isForm ? renderFormBadges(homeVal) : (
          <Text style={styles.statHomeText}>
            {isDiff && parseFloat(homeVal) > 0 ? `+${homeVal}` : homeVal}
            {homeSuffix && <Text style={styles.statSuffixText}> {homeSuffix}</Text>}
          </Text>
        )}
      </View>
      <View style={styles.statLabelCol}>
        <Text style={styles.statLabelText}>{label}</Text>
      </View>
      <View style={styles.statCol}>
        {isForm ? renderFormBadges(awayVal) : (
          <Text style={styles.statAwayText}>
            {isDiff && parseFloat(awayVal) > 0 ? `+${awayVal}` : awayVal}
            {awaySuffix && <Text style={styles.statSuffixText}> {awaySuffix}</Text>}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.predictiveAnalytics || 'PREDICTIVE ANALYTICS'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CARD INPUT MATCH */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.matchSetup || 'MATCH SETUP'}</Text>
          <TouchableOpacity style={styles.selector} onPress={() => openModal('league')}>
            <Text style={styles.selectorLabel}>{t.leagueLabel || 'League'}</Text>
            <Text style={styles.selectorValue}>{selectedLeague ? (leagueMap[selectedLeague] || selectedLeague) : (t.selectLeaguePlaceholder || '-- Select League --')}</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.selector, {flex: 1, marginRight: 10}]} onPress={() => openModal('home')}>
              <Text style={styles.selectorLabel}>{t.homeTeamLabel || 'Home Team'}</Text>
              <Text style={styles.selectorValue} numberOfLines={1}>{homeTeam || (t.selectPlaceholder || '-- Select --')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.selector, {flex: 1}]} onPress={() => openModal('away')}>
              <Text style={styles.selectorLabel}>{t.awayTeamLabel || 'Away Team'}</Text>
              <Text style={styles.selectorValue} numberOfLines={1}>{awayTeam || (t.selectPlaceholder || '-- Select --')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD PARAMETER */}
        {homeData && awayData && (
          <View style={[styles.card, { paddingHorizontal: 15 }]}>
            <View style={styles.paramHeader}>
              <Text style={[styles.paramTeamTitle, {color: colors.primary, textAlign: 'left'}]} numberOfLines={1}>{homeTeam}</Text>
              <Text style={styles.sectionTitleCenter}>{t.parameterTitle || 'PARAMETER'}</Text>
              <Text style={[styles.paramTeamTitle, {color: colors.danger, textAlign: 'right'}]} numberOfLines={1}>{awayTeam}</Text>
            </View>
            
            <StatRow label={t.eloRating || "Elo Rating"} homeVal={homeData.elo_rating.toFixed(2)} awayVal={awayData.elo_rating.toFixed(2)} />
            <StatRow label={t.form5Matches || "Performa (5 Laga)"} homeVal={homeData.form_string} awayVal={awayData.form_string} isForm={true} />
            <StatRow label={t.avgGoalsScored || "Avg Gol Dicetak"} homeVal={homeData.avg_gf.toFixed(2)} homeSuffix={`(${Math.round(homeData.avg_gf * 5)} ${t.goals || 'gol'})`} awayVal={awayData.avg_gf.toFixed(2)} awaySuffix={`(${Math.round(awayData.avg_gf * 5)} ${t.goals || 'gol'})`} />
            <StatRow label={t.avgGoalsConceded || "Avg Gol Kebobolan"} homeVal={homeData.avg_ga.toFixed(2)} homeSuffix={`(${Math.round(homeData.avg_ga * 5)} ${t.goals || 'gol'})`} awayVal={awayData.avg_ga.toFixed(2)} awaySuffix={`(${Math.round(awayData.avg_ga * 5)} ${t.goals || 'gol'})`} />
            <StatRow label={t.shotsOnTarget || "Shots on Target"} homeVal={homeData.avg_sot.toFixed(2)} awayVal={awayData.avg_sot.toFixed(2)} />
            <StatRow label={t.historicalGoalDiff || "Selisih Gol Historis"} homeVal={homeData.goal_diff.toFixed(2)} awayVal={awayData.goal_diff.toFixed(2)} isDiff={true} />
          </View>
        )}

        {/* CARD INPUT ODDS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.bookmakerOdds || 'BOOKMAKER ODDS'}</Text>
          <View style={styles.row}>
            <View style={styles.inputContainer}><Text style={styles.inputLabel}>{t.homeOdds || '1 (Home)'}</Text><TextInput style={styles.input} keyboardType="numeric" placeholder="1.50" placeholderTextColor={colors.textMuted} value={odds.h} onChangeText={v => setOdds({...odds, h: v})} /></View>
            <View style={styles.inputContainer}><Text style={styles.inputLabel}>{t.drawOdds || 'X (Draw)'}</Text><TextInput style={styles.input} keyboardType="numeric" placeholder="3.50" placeholderTextColor={colors.textMuted} value={odds.d} onChangeText={v => setOdds({...odds, d: v})} /></View>
            <View style={styles.inputContainer}><Text style={styles.inputLabel}>{t.awayOdds || '2 (Away)'}</Text><TextInput style={styles.input} keyboardType="numeric" placeholder="5.20" placeholderTextColor={colors.textMuted} value={odds.a} onChangeText={v => setOdds({...odds, a: v})} /></View>
          </View>
          <View style={[styles.row, {marginTop: 10}]}>
            <View style={styles.inputContainer}><Text style={styles.inputLabel}>{t.over25 || 'Over 2.5'}</Text><TextInput style={styles.input} keyboardType="numeric" placeholder="1.80" placeholderTextColor={colors.textMuted} value={odds.over} onChangeText={v => setOdds({...odds, over: v})} /></View>
            <View style={styles.inputContainer}><Text style={styles.inputLabel}>{t.under25 || 'Under 2.5'}</Text><TextInput style={styles.input} keyboardType="numeric" placeholder="2.00" placeholderTextColor={colors.textMuted} value={odds.under} onChangeText={v => setOdds({...odds, under: v})} /></View>
          </View>
        </View>

        <TouchableOpacity style={styles.predictButton} onPress={handlePredict} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.predictButtonText}>{t.generatePrediction || 'GENERATE PREDICTION 🚀'}</Text>}
        </TouchableOpacity>

        {/* CARD RESULT */}
        {result && (
          <View style={{ marginTop: 20 }}>
            <View style={[styles.card, { borderColor: colors.primary, borderWidth: 1 }]}>
              <Text style={styles.sectionTitle}>{t.aiConfidence || 'AI CONFIDENCE'}</Text>
              
              <Text style={styles.resultCategory}>{t.matchOutcomeDnb || 'Match Outcome (DNB)'}</Text>
              <Text style={styles.resultValue}>{result.dnb_prediction}</Text>
              <ProgressBar labelLeft={homeTeam} labelRight={awayTeam} probLeft={result.dnb_home_prob} probRight={result.dnb_away_prob} colorLeft={colors.primary} colorRight={colors.danger} />

              <Text style={styles.resultCategory}>{t.over25 || 'Over/Under 2.5'}</Text>
              <Text style={styles.resultValue}>{result.ou_prediction}</Text>
              <ProgressBar labelLeft={t.over || "Over"} labelRight={t.under || "Under"} probLeft={result.ou_over_prob} probRight={result.ou_under_prob} colorLeft="#10B981" colorRight={colors.gold} />

              <Text style={styles.resultCategory}>{t.bttsTitle || 'Both Teams to Score (BTTS)'}</Text>
              <Text style={styles.resultValue}>{result.btts_prediction}</Text>
              <ProgressBar labelLeft={t.yes || "Yes"} labelRight={t.no || "No"} probLeft={result.btts_yes_prob} probRight={result.btts_no_prob} colorLeft={colors.secondary} colorRight={colors.textMuted} />
            </View>

            <View style={[styles.card, { borderColor: colors.gold, borderWidth: 1, marginTop: 10 }]}>
              <Text style={[styles.sectionTitle, { color: colors.gold }]}>{t.placeVirtualCoin || 'PLACE VIRTUAL COIN'}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.selector, {flex: 1, marginRight: 10}]} onPress={() => openModal('betCategory')}>
                  <Text style={styles.selectorLabel}>{t.followAiFor || 'Follow AI For'}</Text>
                  <Text style={styles.selectorValue}>{betCategory}</Text>
                </TouchableOpacity>
                <View style={[styles.inputContainer, {flex: 1}]}>
                  <Text style={styles.inputLabel}>{t.stakeCoins || 'Stake (Coins)'}</Text>
                  <TextInput style={[styles.input, {color: colors.gold, fontWeight: 'bold'}]} keyboardType="numeric" value={stake} onChangeText={setStake} />
                </View>
              </View>
              <TouchableOpacity style={styles.betButton} onPress={handlePlaceBet} disabled={placingBet}>
                 {placingBet ? <ActivityIndicator color="#000" /> : <Text style={styles.betButtonText}>{t.placeBetBtn || 'PLACE BET'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectOptionTitle || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.modalClose}>✖</Text></TouchableOpacity>
            </View>
            {modalType === 'betCategory' ? (
              <View style={{ padding: 20 }}>
                 <TouchableOpacity style={styles.modalItem} onPress={() => {setBetCategory('DNB'); setModalVisible(false);}}><Text style={styles.modalItemText}>DNB</Text></TouchableOpacity>
                 <TouchableOpacity style={styles.modalItem} onPress={() => {setBetCategory('OU'); setModalVisible(false);}}><Text style={styles.modalItemText}>Over/Under</Text></TouchableOpacity>
                 <TouchableOpacity style={styles.modalItem} onPress={() => {setBetCategory('BTTS'); setModalVisible(false);}}><Text style={styles.modalItemText}>BTTS</Text></TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={getModalData()}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => selectOption(item.value)}>
                    <Text style={styles.modalItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// STRATEGI STYLING DINAMIS
const getStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: c.border },
  headerTitle: { fontSize: 18, fontWeight: '900', color: c.text, letterSpacing: 2 },
  scrollContent: { padding: 15, paddingBottom: 100 },
  card: { backgroundColor: c.surface, borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: c.border },
  sectionTitle: { color: c.textSec, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 15 },
  sectionTitleCenter: { color: c.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center', flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  selector: { backgroundColor: c.surfaceHighlight, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: c.border },
  selectorLabel: { color: c.textMuted, fontSize: 10, marginBottom: 4, textTransform: 'uppercase' },
  selectorValue: { color: c.text, fontSize: 14, fontWeight: 'bold' },
  inputContainer: { flex: 1, backgroundColor: c.surfaceHighlight, borderRadius: 10, padding: 8, marginHorizontal: 4, borderWidth: 1, borderColor: c.border },
  inputLabel: { color: c.textMuted, fontSize: 9, marginBottom: 2, textTransform: 'uppercase', textAlign: 'center' },
  input: { color: c.text, fontSize: 14, textAlign: 'center', padding: 0 },
  predictButton: { backgroundColor: c.secondary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: c.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5, marginTop: 10 },
  predictButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  resultCategory: { color: c.textSec, fontSize: 10, textTransform: 'uppercase', marginTop: 5 },
  resultValue: { color: c.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  betButton: { backgroundColor: c.gold, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  betButtonText: { color: '#000000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: c.border },
  modalTitle: { color: c.text, fontSize: 16, fontWeight: 'bold' },
  modalClose: { color: c.textMuted, fontSize: 18 },
  modalItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: c.border },
  modalItemText: { color: c.text, fontSize: 14 },
  paramHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: c.border },
  paramTeamTitle: { fontSize: 16, fontWeight: '900', flex: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  statCol: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  statLabelCol: { flex: 1.2, alignItems: 'center' },
  statHomeText: { color: c.text, fontSize: 14, fontWeight: 'bold' },
  statAwayText: { color: c.text, fontSize: 14, fontWeight: 'bold' },
  statLabelText: { color: c.textSec, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  statSuffixText: { color: c.textMuted, fontSize: 10, fontWeight: 'normal' }
});