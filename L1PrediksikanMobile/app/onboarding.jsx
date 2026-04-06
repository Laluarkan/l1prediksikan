// File: app/onboarding.jsx
/* eslint-disable no-unused-vars */
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; // DITAMBAHKAN: Untuk menyimpan status onboarding

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Welcome to L1Prediksi-Kan',
    description: 'The next generation of AI-powered football predictions is here.',
    icon: '⚽',
  },
  {
    id: '2',
    title: 'AI Outcomes',
    description: 'Predict outcomes using advanced AI models for HDA, Over/Under, and BTTS.',
    icon: '📊',
  },
  {
    id: '3',
    title: 'Earn Rewards',
    description: 'Track your performance metrics and earn virtual coins for accurate predictions.',
    icon: '🪙',
  }
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // DITAMBAHKAN: async pada fungsi ini
  const handleContinue = async () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // DITAMBAHKAN: Simpan jejak bahwa user sudah melihat onboarding
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
      
      // Arahkan ke halaman login
      router.replace('/login');
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.imageContainer}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>L1<Text style={styles.logoTextLight}>Prediksi-Kan</Text></Text>
      </View>

      <FlatList
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        ref={flatListRef}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                currentIndex === index ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  logoText: { fontSize: 20, fontWeight: '900', color: '#3B82F6', fontStyle: 'italic' },
  logoTextLight: { color: '#8B5CF6' },
  slide: { width: width, alignItems: 'center', paddingHorizontal: 40, justifyContent: 'center' },
  imageContainer: { width: width * 0.7, height: width * 0.7, backgroundColor: '#111827', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: '#1F2937', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  iconText: { fontSize: 100 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 15 },
  description: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  bottomContainer: { paddingHorizontal: 30, paddingBottom: 40, paddingTop: 20 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  dot: { height: 6, borderRadius: 3, marginHorizontal: 4 },
  activeDot: { width: 24, backgroundColor: '#3B82F6' },
  inactiveDot: { width: 6, backgroundColor: '#374151' },
  button: { backgroundColor: '#3B82F6', paddingVertical: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});