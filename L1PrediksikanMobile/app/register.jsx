// File: app/register.jsx
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// PENTING: Ganti dengan IP Address laptop Anda (IPv4)
const API_BASE_URL = 'http://172.17.72.241:8000/api'; 

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Data Tidak Lengkap', 'Semua kolom wajib diisi untuk menginisiasi neural link.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Otomatis login setelah register sukses
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('username', data.username);
        await AsyncStorage.setItem('is_admin', data.is_admin ? 'true' : 'false');
        
        Alert.alert('Sukses', 'Registrasi berhasil! Anda mendapatkan 1000 Koin awal.', [
          { text: 'ENTER ORACLE', onPress: () => router.replace('/(tabs)/home') }
        ]);
      } else {
        Alert.alert('Gagal', data.detail || 'Username atau Email mungkin sudah digunakan.');
      }
    } catch (error) {
      Alert.alert('Koneksi Terputus', 'Gagal menghubungi server. Pastikan IP dan Server menyala.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header & Logo */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>🧬</Text> 
            </View>
            <Text style={styles.title}>New <Text style={styles.titleHighlight}>Analyst</Text></Text>
            <Text style={styles.subtitle}>INITIALIZE YOUR ACCOUNT</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>USERNAME</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Choose a unique alias"
                  placeholderTextColor="#6B7280"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL PROTOCOL</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter active email"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SECURITY KEY</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create strong password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showCode}
                />
                <TouchableOpacity onPress={() => setShowCode(!showCode)} style={styles.eyeIcon}>
                  <Text style={{ color: '#6B7280' }}>{showCode ? '👁️' : '🕶️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons */}
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>CREATE ACCOUNT</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  titleHighlight: {
    color: '#8B5CF6',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    color: '#6B7280',
    fontSize: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  registerButton: {
    backgroundColor: '#8B5CF6', // Purple untuk register
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});