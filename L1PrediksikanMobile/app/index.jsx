// File: app/index.jsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Tahan eksekusi sampai sistem navigasi Expo benar-benar siap
    if (!navigationState?.key) return; 

    const checkAuth = async () => {
      try {
        // Mengambil memori sesungguhnya (tanpa ada kode reset/hapus memori lagi)
        const hasSeenOnboarding = await AsyncStorage.getItem('has_seen_onboarding');
        const token = await AsyncStorage.getItem('token');

        // Jeda 1.5 detik murni untuk estetika Splash Screen
        setTimeout(() => {
          if (!hasSeenOnboarding) {
            router.replace('/onboarding'); 
          } else if (token) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/login');
          }
        }, 1500); 

      } catch (error) {
        console.error('Error checking auth:', error);
        router.replace('/login');
      }
    };

    checkAuth();
  }, [navigationState?.key]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>L1<Text style={styles.logoLight}>Prediksi-Kan</Text></Text>
      <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      {/* Teks dikembalikan menjadi rapi dan elegan */}
      <Text style={styles.text}>INITIALIZING ORACLE...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: '900', color: '#3B82F6', fontStyle: 'italic' },
  logoLight: { color: '#8B5CF6' },
  loader: { marginTop: 30, marginBottom: 15 },
  text: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', lineHeight: 18 },
});