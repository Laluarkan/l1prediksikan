// File: app/login.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { ThemeLangContext } from '../context/ThemeLangContext'; // IMPORT CONTEXT

// PENTING: IP Address laptop Anda (IPv4)
const API_BASE_URL = 'https://l1prediksi-api.onrender.com/api'; 

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t, colors } = useContext(ThemeLangContext);
  const styles = getStyles(colors);

  const [identity, setIdentity] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // --- HOOK GOOGLE LOGIN DIPERBARUI ---
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // Mengambil Web Client ID dari .env
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID, // MENGAMBIL ANDROID CLIENT ID DARI .ENV
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLoginBackend(id_token);
    } else if (response?.type === 'error') {
      Alert.alert('Gagal', 'Proses autentikasi Google dibatalkan atau gagal.');
    }
  }, [response]);

  const handleLogin = async () => {
    if (!identity || !accessCode) {
      Alert.alert('Akses Ditolak', 'Identitas dan Access Code wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identity, 
          password: accessCode
        })
      });

      const data = await res.json();

      if (res.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('username', data.username);
        await AsyncStorage.setItem('is_admin', data.is_admin ? 'true' : 'false');
        router.replace('/(tabs)/home'); 
      } else {
        Alert.alert('Gagal', data.detail || 'Kredensial tidak valid.');
      }
    } catch (error) {
      Alert.alert('Koneksi Terputus', 'Gagal menghubungi server Oracle.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginBackend = async (idToken) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: idToken })
      });

      const data = await res.json();

      if (res.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('username', data.username);
        await AsyncStorage.setItem('is_admin', data.is_admin ? 'true' : 'false');
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Gagal Sinkronisasi', data.detail || 'Google Auth ditolak oleh Backend.');
      }
    } catch (error) {
      Alert.alert('Koneksi Terputus', 'Gagal mengirim token Google ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoBox}><Text style={styles.logoIcon}>📊</Text></View>
            <Text style={styles.title}>L1<Text style={styles.titleHighlight}>Prediksi-Kan</Text></Text>
            <Text style={styles.subtitle}>ENTER THE SYNTHETIC ORACLE</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>IDENTITY</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email or Username"
                  placeholderTextColor={colors.textMuted}
                  value={identity}
                  onChangeText={setIdentity}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>ACCESS CODE</Text>
                <TouchableOpacity onPress={() => Alert.alert('Info', 'Fitur reset password belum tersedia.')}>
                  <Text style={styles.recoveryText}>RECOVERY?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={accessCode}
                  onChangeText={setAccessCode}
                  secureTextEntry={!showCode}
                />
                <TouchableOpacity onPress={() => setShowCode(!showCode)} style={styles.eyeIcon}>
                  <Text style={{ color: colors.textMuted }}>{showCode ? '👁️' : '🕶️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/register')}>
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SYNC WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()} disabled={!request || loading}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>BY ENTERING, YOU ACCEPT OUR</Text>
            <Text style={styles.footerLinks}>NEURAL PROTOCOLS & DATA PRIVACY</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 60, height: 60, backgroundColor: c.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: c.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  logoIcon: { fontSize: 28 },
  title: { fontSize: 28, fontWeight: '900', color: c.primary, fontStyle: 'italic' },
  titleHighlight: { color: c.secondary },
  subtitle: { fontSize: 12, color: c.textSec, marginTop: 8, letterSpacing: 1.5, fontWeight: '600' },
  card: { backgroundColor: c.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: c.border },
  inputGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { color: c.text, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  recoveryText: { color: c.textMuted, fontSize: 10, fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, height: 56 },
  inputIcon: { color: c.textMuted, fontSize: 16, marginRight: 12 },
  input: { flex: 1, color: c.text, fontSize: 14, height: '100%' },
  eyeIcon: { padding: 8 },
  loginButton: { backgroundColor: c.primary, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  registerButton: { backgroundColor: c.surfaceHighlight, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: c.border },
  registerButtonText: { color: c.text, fontSize: 16, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
  dividerText: { color: c.textMuted, paddingHorizontal: 16, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  googleButton: { flexDirection: 'row', backgroundColor: c.surfaceHighlight, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: c.border },
  googleIcon: { color: c.text, fontWeight: 'bold', fontSize: 18, marginRight: 12 },
  googleButtonText: { color: c.text, fontSize: 16, fontWeight: 'bold' },
  footer: { marginTop: 30, alignItems: 'center' },
  footerText: { color: c.textMuted, fontSize: 10, fontWeight: 'bold' },
  footerLinks: { color: c.textSec, fontSize: 10, fontWeight: 'bold', textDecorationLine: 'underline', marginTop: 4 }
});