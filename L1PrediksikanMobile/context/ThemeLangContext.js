// File: context/ThemeLangContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeLangContext = createContext();

// PALET WARNA GLOBAL
const colorPalettes = {
  DARK: {
    bg: '#0B0F19',
    surface: '#111827',
    surfaceHighlight: '#1F2937',
    border: '#1F2937',
    text: '#FFFFFF',
    textSec: '#9CA3AF',
    textMuted: '#6B7280',
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    danger: '#FCA5A5',
    gold: '#FCD34D',
    badgeBg: '#1E3A8A'
  },
  LIGHT: {
    bg: '#F3F4F6', 
    surface: '#FFFFFF', 
    surfaceHighlight: '#F9FAFB',
    border: '#E5E7EB',
    text: '#111827', 
    textSec: '#4B5563',
    textMuted: '#9CA3AF',
    primary: '#2563EB', 
    secondary: '#7C3AED', 
    danger: '#DC2626',
    gold: '#D97706',
    badgeBg: '#DBEAFE'
  }
};

export const ThemeLangProvider = ({ children }) => {
  const [theme, setTheme] = useState('DARK');
  const [language, setLanguage] = useState('EN');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme) setTheme(storedTheme);

        const storedLanguage = await AsyncStorage.getItem('language');
        if (storedLanguage) setLanguage(storedLanguage);
      } catch (error) {
        console.error('Gagal memuat pengaturan', error);
      } finally {
        setIsReady(true);
      }
    };
    loadSettings();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'DARK' ? 'LIGHT' : 'DARK';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const toggleLanguage = async () => {
    const newLang = language === 'EN' ? 'ID' : 'EN';
    setLanguage(newLang);
    await AsyncStorage.setItem('language', newLang);
  };

  const translations = {
    EN: {
      role: 'PRO ANALYST', status: 'AI ACTIVE', insights: 'MATCH INSIGHTS', predict: 'ORACLE PREDICTIONS', live: 'LIVE DATA', telemetry: 'TELEMETRY', portfolio: 'PORTFOLIO', config: 'SYSTEM CONFIGURATION', theme: 'THEME', lang: 'LANGUAGE', logout: 'TERMINATE SESSION', logoutConfirmTitle: 'TERMINATE SESSION', logoutConfirmMsg: 'Are you sure you want to disconnect from the Oracle?', cancel: 'CANCEL', disconnect: 'DISCONNECT',
      welcomeBack: 'WELCOME BACK', startPredicting: 'START PREDICTING NOW 🚀', latestInsights: 'LATEST INSIGHTS', noInsights: 'No recent insights.', upcomingMatches: 'BIG 5 LEAGUES UPCOMING', viewAll: 'VIEW ALL', noUpcoming: 'No upcoming top league matches.', topAnalysts: 'TOP ANALYSTS', viewRanking: 'VIEW RANKING', noRanking: 'No ranking data available.',
      syntheticOracle: 'THE SYNTHETIC ORACLE',
      modelAccuracy: 'MODEL ACCURACY',
      modelDesc: 'Historical verification of our AI predictive capabilities across major European football leagues.',
      currentLeague: 'CURRENT LEAGUE',
      selectLeague: 'Select a League...',
      calcTelemetry: 'CALCULATING TELEMETRY...',
      currentActiveCycle: 'CURRENT ACTIVE CYCLE',
      legacyModel: 'LEGACY MODEL',
      liveUpdates: 'LIVE UPDATES',
      hdaAccuracy: 'HDA ACCURACY',
      ouAccuracy: 'O/U 2.5 ACCURACY',
      bttsAccuracy: 'BTTS ACCURACY',
      verifiedOver: 'Verified over',
      matches: 'matches.',
      noPerfData: 'No performance data for this league.',
      methodologyTitle: 'Detailed Methodology',
      methodologyDesc: 'Our Synthetic Oracle model is retrained every Monday using advanced neural networks and deep-match telemetry.',
      readWhitepaper: 'Read Whitepaper',
      selectLeagueTitle: 'Select League', 
      totalBalance: 'TOTAL BALANCE',
      coins: 'COINS',
      winRate: 'WIN RATE',
      rank: 'RANK',
      historyOfPredictions: 'History of Predictions',
      filter: 'Filter',
      fetchingHistory: 'Fetching Oracle History...',
      noHistory: 'No prediction history yet.',
      startPredictingHint: 'Use the Prediction menu to start analyzing.',
      predicted: 'PREDICTED',
      profit: 'PROFIT',
      stake: 'STAKE',
      won: 'WON',
      lost: 'LOST',
      pending: 'PENDING', 
      predictiveAnalytics: 'PREDICTIVE ANALYTICS',
      matchSetup: 'MATCH SETUP',
      leagueLabel: 'League',
      selectLeaguePlaceholder: '-- Select League --',
      homeTeamLabel: 'Home Team',
      awayTeamLabel: 'Away Team',
      selectPlaceholder: '-- Select --',
      parameterTitle: 'PARAMETER',
      eloRating: 'Elo Rating',
      form5Matches: 'Form (Last 5)',
      avgGoalsScored: 'Avg Goals Scored',
      avgGoalsConceded: 'Avg Goals Conceded',
      shotsOnTarget: 'Shots on Target',
      historicalGoalDiff: 'Historical Goal Diff',
      goals: 'goals',
      bookmakerOdds: 'BOOKMAKER ODDS',
      homeOdds: '1 (Home)',
      drawOdds: 'X (Draw)',
      awayOdds: '2 (Away)',
      over25: 'Over 2.5',
      under25: 'Under 2.5',
      generatePrediction: 'GENERATE PREDICTION 🚀',
      aiConfidence: 'AI CONFIDENCE',
      matchOutcomeDnb: 'Match Outcome (DNB)',
      bttsTitle: 'Both Teams to Score (BTTS)',
      yes: 'Yes',
      no: 'No',
      over: 'Over',
      under: 'Under',
      placeVirtualCoin: 'PLACE VIRTUAL COIN',
      followAiFor: 'Follow AI For',
      stakeCoins: 'Stake (Coins)',
      placeBetBtn: 'PLACE BET',
      selectOptionTitle: 'Select Option', 
      currentSeason: 'CURRENT SEASON',
      globalRankingsTitle: 'Global Rankings',
      globalRankingsDesc: 'Predict matches, climb the leaderboard, and claim your place among the elite tactical analysts.',
      syncRanking: 'SYNCING RANKINGS...',
      currentKing: 'CURRENT KING',
      masterProphet: 'Master Prophet',
      silverOracle: 'Silver Oracle',
      bronzeAnalyst: 'Bronze Analyst',
      elitePredictor: 'ELITE PREDICTOR',
      noUsersLeaderboard: 'No users on the leaderboard yet.', 
      matchSchedule: 'MATCH SCHEDULE',
      wibLive: 'WIB (LIVE)',
      searchPlaceholder: 'Search team or league...',
      loadingSchedule: 'Loading Schedule...',
      noScheduleFound: 'No schedule found.'
    },
    ID: {
      role: 'ANALIS PRO', status: 'AI AKTIF', insights: 'WAWASAN LAGA', predict: 'PREDIKSI ORACLE', live: 'DATA LANGSUNG', telemetry: 'TELEMETRI', portfolio: 'PORTOFOLIO', config: 'KONFIGURASI SISTEM', theme: 'TEMA', lang: 'BAHASA', logout: 'AKHIRI SESI', logoutConfirmTitle: 'AKHIRI SESI', logoutConfirmMsg: 'Yakin ingin memutus koneksi dari sistem Oracle?', cancel: 'BATAL', disconnect: 'PUTUSKAN',
      welcomeBack: 'SELAMAT KEMBALI', startPredicting: 'MULAI PREDIKSI SEKARANG 🚀', latestInsights: 'WAWASAN TERBARU', noInsights: 'Belum ada wawasan terbaru.', upcomingMatches: '5 LIGA TOP MENDATANG', viewAll: 'LIHAT SEMUA', noUpcoming: 'Tidak ada jadwal liga top mendatang.', topAnalysts: 'ANALIS TERBAIK', viewRanking: 'LIHAT PERINGKAT', noRanking: 'Belum ada data peringkat.', 
      syntheticOracle: 'ORACLE SINTETIS',
      modelAccuracy: 'AKURASI MODEL',
      modelDesc: 'Verifikasi historis dari kemampuan prediktif AI kami di seluruh liga sepak bola utama Eropa.',
      currentLeague: 'LIGA SAAT INI',
      selectLeague: 'Pilih Liga...',
      calcTelemetry: 'MENGHITUNG TELEMETRI...',
      currentActiveCycle: 'SIKLUS AKTIF SAAT INI',
      legacyModel: 'MODEL LAMA',
      liveUpdates: 'PEMBARUAN LANGSUNG',
      hdaAccuracy: 'AKURASI HDA',
      ouAccuracy: 'AKURASI O/U 2.5',
      bttsAccuracy: 'AKURASI BTTS',
      verifiedOver: 'Diverifikasi pada',
      matches: 'laga.',
      noPerfData: 'Tidak ada data performa untuk liga ini.',
      methodologyTitle: 'Metodologi Detail',
      methodologyDesc: 'Model Oracle Sintetis kami dilatih ulang setiap Senin menggunakan jaringan saraf canggih dan telemetri laga mendalam.',
      readWhitepaper: 'Baca Whitepaper',
      selectLeagueTitle: 'Pilih Liga', 
      totalBalance: 'TOTAL SALDO',
      coins: 'KOIN',
      winRate: 'TINGKAT KEMENANGAN',
      rank: 'PERINGKAT',
      historyOfPredictions: 'Riwayat Prediksi',
      filter: 'Saring',
      fetchingHistory: 'Menarik Riwayat Oracle...',
      noHistory: 'Belum ada riwayat prediksi.',
      startPredictingHint: 'Gunakan menu Prediksi untuk mulai menganalisis.',
      predicted: 'DIPREDIKSI',
      profit: 'KEUNTUNGAN',
      stake: 'TARUHAN',
      won: 'MENANG',
      lost: 'KALAH',
      pending: 'TUNDA', 
      predictiveAnalytics: 'ANALITIK PREDIKTIF',
      matchSetup: 'PENGATURAN LAGA',
      leagueLabel: 'Liga',
      selectLeaguePlaceholder: '-- Pilih Liga --',
      homeTeamLabel: 'Tim Kandang',
      awayTeamLabel: 'Tim Tandang',
      selectPlaceholder: '-- Pilih --',
      parameterTitle: 'PARAMETER',
      eloRating: 'Peringkat Elo',
      form5Matches: 'Performa (5 Laga)',
      avgGoalsScored: 'Rata-rata Gol Dicetak',
      avgGoalsConceded: 'Rata-rata Kebobolan',
      shotsOnTarget: 'Tembakan Tepat Sasaran',
      historicalGoalDiff: 'Selisih Gol Historis',
      goals: 'gol',
      bookmakerOdds: 'PELUANG BANDAR (ODDS)',
      homeOdds: '1 (Kandang)',
      drawOdds: 'X (Seri)',
      awayOdds: '2 (Tandang)',
      over25: 'Atas 2.5 (Over)',
      under25: 'Bawah 2.5 (Under)',
      generatePrediction: 'HASILKAN PREDIKSI 🚀',
      aiConfidence: 'KEPERCAYAAN AI',
      matchOutcomeDnb: 'Hasil Laga (DNB)',
      bttsTitle: 'Kedua Tim Mencetak Gol (BTTS)',
      yes: 'Ya',
      no: 'Tidak',
      over: 'Atas',
      under: 'Bawah',
      placeVirtualCoin: 'PASANG KOIN VIRTUAL',
      followAiFor: 'Ikuti AI Untuk',
      stakeCoins: 'Taruhan (Koin)',
      placeBetBtn: 'PASANG TARUHAN',
      selectOptionTitle: 'Pilih Opsi', 
      currentSeason: 'MUSIM INI',
      globalRankingsTitle: 'Peringkat Global',
      globalRankingsDesc: 'Prediksi laga, daki papan peringkat, dan rebut posisi Anda di antara analis taktis elit.',
      syncRanking: 'SINKRONISASI PERINGKAT...',
      currentKing: 'RAJA SAAT INI',
      masterProphet: 'Nabi Master',
      silverOracle: 'Oracle Perak',
      bronzeAnalyst: 'Analis Perunggu',
      elitePredictor: 'PREDIKTOR ELIT',
      noUsersLeaderboard: 'Belum ada pengguna di papan peringkat.', 
      matchSchedule: 'JADWAL LAGA',
      wibLive: 'WIB (LANGSUNG)',
      searchPlaceholder: 'Cari tim atau liga...',
      loadingSchedule: 'Memuat Jadwal...',
      noScheduleFound: 'Tidak ada jadwal ditemukan.'
    }
  };

  const t = translations[language];
  const colors = colorPalettes[theme]; // Tentukan warna berdasarkan tema yang aktif

  if (!isReady) return null; 

  return (
    // SEKARANG KITA MENYEBARKAN `colors` KE SELURUH APLIKASI
    <ThemeLangContext.Provider value={{ theme, language, toggleTheme, toggleLanguage, t, colors }}>
      {children}
    </ThemeLangContext.Provider>
  );
};