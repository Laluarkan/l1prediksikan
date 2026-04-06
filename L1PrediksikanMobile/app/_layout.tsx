// File: app/_layout.jsx
import React from 'react';
import { Stack } from 'expo-router';
import { ThemeLangProvider } from '../context/ThemeLangContext';

export default function RootLayout() {
  return (
    <ThemeLangProvider>
      <Stack 
        screenOptions={{ headerShown: false }} 
        initialRouteName="index" // Memaksa aplikasi selalu mulai dari index
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeLangProvider>
  );
}