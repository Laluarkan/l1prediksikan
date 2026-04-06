// File: app/(tabs)/_layout.jsx
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Alert, Platform, StatusBar } from 'react-native';
import { Tabs, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeLangContext } from '../../context/ThemeLangContext';

export default function TabLayout() {
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [username, setUsername] = useState('User');
  
  // Tangkap `colors` dari Context
  const { theme, language, toggleTheme, toggleLanguage, t, colors } = useContext(ThemeLangContext);
  const styles = getStyles(colors); // Render style dinamis

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) setUsername(storedUsername);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {}
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    Alert.alert(t.logoutConfirmTitle, t.logoutConfirmMsg, [
      { text: t.cancel, style: 'cancel' },
      { text: t.disconnect, style: 'destructive', onPress: async () => { await AsyncStorage.clear(); setMenuVisible(false); router.replace('/login'); } }
    ]);
  };

  const CustomHeader = () => (
    <SafeAreaView style={styles.headerSafe}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconButton}>
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>L1<Text style={styles.logoTextLight}>Prediksi-Kan</Text></Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <View style={styles.avatarMini}><Text style={styles.avatarTextMini}>{username.charAt(0).toUpperCase()}</Text></View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        screenOptions={{
          header: () => <CustomHeader />,
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: Platform.OS === 'ios' ? 95 : 75,
            paddingBottom: Platform.OS === 'ios' ? 30 : 15,
            paddingTop: 10,
            position: 'absolute', 
          },
          tabBarActiveTintColor: colors.primary, 
          tabBarInactiveTintColor: colors.textMuted, 
          tabBarLabelStyle: { fontSize: 9, fontWeight: 'bold', marginTop: Platform.OS === 'ios' ? 5 : 0 }
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'HOME', tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: 20, color: focused ? colors.text : color }}>🏠</Text> }} />
        <Tabs.Screen name="schedule" options={{ title: 'SCHEDULE', tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: 20, color: focused ? colors.text : color }}>📅</Text> }} />
        <Tabs.Screen
          name="predict"
          options={{
            title: 'PREDICTIONS',
            tabBarIcon: ({ focused }) => (
              <View style={[styles.predictCenterContainer, focused && styles.predictCenterContainerActive]}>
                <Text style={styles.predictCenterIcon}>⚽</Text>
              </View>
            ),
            tabBarLabel: ({ focused }) => (<Text style={{ fontSize: focused ? 10 : 9, fontWeight: 'bold', color: focused ? colors.secondary : colors.textMuted, textAlign: 'center', marginTop: Platform.OS === 'ios' ? -20 : -10 }}>{focused ? 'ANALYZE' : 'PREDICT'}</Text>),
          }}
        />
        <Tabs.Screen name="performance" options={{ title: t.telemetry, tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: 20, color: focused ? colors.text : color }}>📈</Text> }} />
        <Tabs.Screen name="portfolio" options={{ title: t.portfolio, tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: 20, color: focused ? colors.text : color }}>💼</Text> }} />
        <Tabs.Screen name="ranking" options={{ href: null }} />
      </Tabs>

      <Modal visible={isMenuVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.drawerContent}>
            <View style={styles.profileSection}>
              <View style={styles.avatarLg}><Text style={styles.avatarTextLg}>{username.charAt(0).toUpperCase()}</Text><View style={styles.onlineDot} /></View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileUsername}>@{username}</Text>
                <View style={styles.roleRow}><Text style={styles.roleText}>{t.role}</Text><Text style={styles.dotSeparator}> • </Text><Text style={styles.statusText}>{t.status}</Text></View>
              </View>
            </View>

            <View style={styles.menuGroup}>
              <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]} onPress={() => {router.push('/(tabs)/home'); setMenuVisible(false);}}>
                <Text style={styles.menuIconActive}>📊</Text><Text style={styles.menuLabelActive}>{t.insights}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => {router.push('/(tabs)/predict'); setMenuVisible(false);}}>
                <Text style={styles.menuIcon}>🤖</Text><Text style={styles.menuLabel}>{t.predict}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => {router.push('/(tabs)/schedule'); setMenuVisible(false);}}>
                <Text style={styles.menuIcon}>📡</Text><Text style={styles.menuLabel}>{t.live}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.configGroup}>
              <Text style={styles.configTitle}>{t.config}</Text>
              <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
                <Text style={styles.menuIcon}>{theme === 'DARK' ? '🌙' : '☀️'}</Text>
                <Text style={styles.menuLabel}>{t.theme}: {theme}</Text>
                <Text style={styles.toggleStatusIcon}>{theme === 'DARK' ? '›' : '✓'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage}>
                <Text style={styles.menuIcon}>🌐</Text>
                <Text style={styles.menuLabel}>{t.lang}: {language}</Text>
                <Text style={styles.toggleStatusIcon}>↻</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerGroup}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutIcon}>🚪</Text><Text style={styles.logoutLabel}>{t.logout}</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>V4.0.2-SYNTHETIC</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeArea} activeOpacity={1} onPress={() => setMenuVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}

// STRATEGI BARU: StyleSheet dibungkus fungsi agar bisa menerima parameter warna (c)
const getStyles = (c) => StyleSheet.create({
  headerSafe: { backgroundColor: c.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, borderBottomWidth: 1, borderBottomColor: c.border },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 60, paddingHorizontal: 15 },
  iconButton: { padding: 5 },
  hamburgerIcon: { color: c.primary, fontSize: 24, fontWeight: 'bold' },
  logoContainer: { flex: 1, alignItems: 'center' },
  logoText: { fontSize: 18, fontWeight: '900', color: c.primary, fontStyle: 'italic', letterSpacing: 0.5 },
  logoTextLight: { color: c.secondary },
  avatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.badgeBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: c.primary },
  avatarTextMini: { color: c.text, fontSize: 14, fontWeight: 'bold' },
  predictCenterContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Platform.OS === 'ios' ? 20 : 10, shadowColor: c.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 15, borderWidth: 5, borderColor: c.bg },
  predictCenterContainerActive: { backgroundColor: c.secondary, shadowColor: c.secondary },
  predictCenterIcon: { fontSize: 28 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row' },
  drawerContent: { width: '75%', backgroundColor: c.bg, height: '100%', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 30 : 60, paddingHorizontal: 20, borderRightWidth: 1, borderRightColor: c.border },
  closeArea: { width: '25%', height: '100%' },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  avatarLg: { width: 54, height: 54, borderRadius: 27, backgroundColor: c.badgeBg, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: c.primary },
  avatarTextLg: { color: c.text, fontSize: 24, fontWeight: 'bold' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: c.success || '#10B981', borderWidth: 2, borderColor: c.bg },
  profileInfo: { marginLeft: 15 },
  profileUsername: { color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 4 },
  roleRow: { flexDirection: 'row', alignItems: 'center' },
  roleText: { color: c.primary, fontSize: 10, fontWeight: 'bold' },
  dotSeparator: { color: c.textMuted, fontSize: 10 },
  statusText: { color: c.textSec, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  menuGroup: { marginBottom: 40 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 12, marginBottom: 5 },
  menuItemActive: { backgroundColor: c.surfaceHighlight, borderWidth: 1, borderColor: c.border },
  menuIcon: { fontSize: 18, color: c.textSec, marginRight: 15 },
  menuIconActive: { fontSize: 18, color: c.primary, marginRight: 15 },
  menuLabel: { color: c.textSec, fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5, flex: 1 },
  menuLabelActive: { color: c.primary, fontSize: 13, fontWeight: '900', letterSpacing: 0.5, flex: 1 },
  configGroup: { flex: 1 },
  configTitle: { color: c.textSec, fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
  toggleStatusIcon: { color: c.textMuted, fontSize: 16, fontWeight: 'bold' },
  footerGroup: { marginTop: 'auto', marginBottom: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: c.border },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  logoutIcon: { fontSize: 18, marginRight: 15 },
  logoutLabel: { color: c.danger, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  versionText: { color: c.textSec, fontSize: 10, fontWeight: 'bold', marginTop: 20, marginLeft: 5, letterSpacing: 0.5 }
});