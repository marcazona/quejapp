import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, error } = useAuth();

  useEffect(() => {
    console.log('IndexScreen: Component mounted');
    console.log('IndexScreen: isAuthenticated =', isAuthenticated);
    console.log('IndexScreen: isLoading =', isLoading);
    console.log('IndexScreen: error =', error);
  }, [isAuthenticated, isLoading, error]);

  // Show loading screen with detailed information
  if (isLoading) {
    console.log('IndexScreen: Showing loading screen');
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5ce1e6" />
          <Text style={styles.loadingText}>Loading quejapp...</Text>
          <Text style={styles.loadingSubtext}>Initializing authentication</Text>
        </View>
      </View>
    );
  }

  // Show error screen if there's an error
  if (error) {
    console.log('IndexScreen: Showing error screen for:', error);
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorSubtext}>
            Please check your internet connection and try again.
          </Text>
        </View>
      </View>
    );
  }

  // Redirect based on authentication status
  console.log('IndexScreen: Redirecting based on auth status');
  if (isAuthenticated) {
    console.log('IndexScreen: Redirecting to tabs (authenticated)');
    return <Redirect href="/(tabs)" />;
  } else {
    console.log('IndexScreen: Redirecting to signin (not authenticated)');
    return <Redirect href="/(auth)/signin" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
    maxWidth: 320,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E74C3C',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});