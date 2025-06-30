import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform, Image } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { BarChart3, Building2, Users, AlertTriangle, DollarSign, Settings, LogOut, Shield, TrendingUp, MessageCircle, Megaphone } from 'lucide-react-native';
import { useCosmosAuth, CosmosAuthProvider } from '@/contexts/CosmosAuthContext';

function CosmosTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, signOut } = useCosmosAuth();

  // Don't show the tab bar on the login screen
  if (pathname === '/dash/cosmos' || !admin) {
    return null;
  }

  const tabs = [
    { name: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { name: 'companies', label: 'Companies', icon: Building2 },
    { name: 'users', label: 'Users', icon: Users },
    { name: 'posts', label: 'Posts', icon: MessageCircle },
    { name: 'billing', label: 'Billing', icon: DollarSign },
    { name: 'marketing', label: 'Marketing', icon: Megaphone },
    { name: 'warnings', label: 'Warnings', icon: AlertTriangle },
    { name: 'analytics', label: 'Analytics', icon: TrendingUp },
    { name: 'settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (tabName: string) => {
    if (pathname === '/dash/cosmos' && tabName === 'dashboard') {
      return true;
    }
    return pathname === `/dash/cosmos/${tabName}`;
  };

  const navigateTo = (tabName: string) => {
    router.push(`/dash/cosmos/${tabName}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/dash/cosmos');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.tabBarContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.cosmosLogo}>
              <View style={styles.logoIcon}>
                <Shield size={24} color="#FF6B6B" />
              </View>
              <View style={styles.logoText}>
                <Text style={styles.logoTextMain}>Cosmos</Text>
                <Text style={styles.logoTextSub}>SuperAdmin</Text>
              </View>
            </View>
              
            <View style={styles.tabsContainer}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.name}
                  style={[styles.tab, isActive(tab.name) && styles.activeTab]}
                  onPress={() => navigateTo(tab.name)}
                >
                  <tab.icon 
                    size={16} 
                    color={isActive(tab.name) ? '#FF6B6B' : '#666666'} 
                  />
                  <Text style={[styles.tabText, isActive(tab.name) && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
              
            <View style={styles.headerRight}>
              <View style={styles.adminInfo}>
                <Text style={styles.adminName}>{admin?.name || 'Admin'}</Text>
                <Text style={styles.adminRole}>SuperAdmin</Text>
              </View>
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <LogOut size={18} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function CosmosLayout() {
  return (
    <CosmosAuthProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#0A0A0A' }
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="companies" />
          <Stack.Screen name="users" />
          <Stack.Screen name="posts" />
          <Stack.Screen name="billing" />
          <Stack.Screen name="marketing" />
          <Stack.Screen name="warnings" />
          <Stack.Screen name="analytics" />
          <Stack.Screen name="settings" />
        </Stack>
        
        <CosmosTabBar />
      </View>
    </CosmosAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  tabBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    zIndex: 100,
  },
  headerContainer: {
    width: '100%',
  },
  safeArea: {
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cosmosLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  logoText: {
    alignItems: 'flex-start',
  },
  logoTextMain: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoTextSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FF6B6B',
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminInfo: {
    alignItems: 'flex-end',
  },
  adminName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  adminRole: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FF6B6B',
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#2A2A2A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FF6B6B',
  },
  signOutButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#2A1A1A',
  },
});