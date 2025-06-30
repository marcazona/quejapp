import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export default function RootLayout() {
  console.log('RootLayout: Component rendering');
  
  // Only call useFrameworkReady on web platform
  if (Platform.OS === 'web') {
    console.log('RootLayout: Calling useFrameworkReady for web platform');
    useFrameworkReady();
  }

  console.log('RootLayout: Rendering AuthProvider and Stack');

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}