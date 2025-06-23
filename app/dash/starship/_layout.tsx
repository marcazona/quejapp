import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform, Image } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { ChartBar as BarChart3, MessageCircle, TriangleAlert as AlertTriangle, Settings, Building2, LogOut } from 'lucide-react-native';
import { useCompanyAuth, CompanyAuthProvider } from '@/contexts/CompanyAuthContext';

function StarshipTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { company, signOut } = useCompanyAuth();

  // Don't show the tab bar on the login screen
  if (pathname === '/dash/starship' || !company) {
    return null;
  }

  const tabs = [
    { name: 'dashboard', label: 'Overview', icon: Building2 },
    { name: 'tickets', label: 'Tickets', icon: AlertTriangle },
    { name: 'chats', label: 'Chats', icon: MessageCircle },
    { name: 'marketing', label: 'Marketing', icon: BarChart3 },
    { name: 'settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (tabName: string) => {
    return pathname === `/dash/starship/${tabName}`;
  };

  const navigateTo = (tabName: string) => {
    router.push(`/dash/starship/${tabName}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/dash/starship');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.tabBarContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.companyBranding}>
              <View style={styles.quejappLogo}>
                <Text style={styles.quejappLogoNormal}>quej</Text>
                <Text style={styles.quejappLogoBold}>app</Text>
              </View>
              <Text style={styles.starshipText}>Starship</Text>
            </View>
              
              <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.name}
                    style={[styles.tab, isActive(tab.name) && styles.activeTab]}
                    onPress={() => navigateTo(tab.name)}
                  >
                    <tab.icon 
                      size={18} 
                      color={isActive(tab.name) ? '#5ce1e6' : '#666666'} 
                    />
                    <Text style={[styles.tabText, isActive(tab.name) && styles.activeTabText]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.headerRight}>
                {company?.logo_url ? (
                  <Image 
                    source={{ uri: company.logo_url }} 
                    style={styles.companyLogo} 
                  />
                ) : (
                  <View style={styles.companyLogoPlaceholder}>
                    <Building2 size={16} color="#5ce1e6" />
                  </View>
                )}
                <Text style={styles.companyName}>{company?.name || 'Company'}</Text>
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

export default function StarshipLayout() {
  return (
    <CompanyAuthProvider>
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
          <Stack.Screen name="tickets" />
          <Stack.Screen name="chats" />
          <Stack.Screen name="marketing" />
          <Stack.Screen name="settings" />
        </Stack>
        
        <StarshipTabBar />
      </View>
    </CompanyAuthProvider>
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
  companyBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quejappLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quejappLogoNormal: {
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  quejappLogoBold: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  starshipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  companyLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
    marginRight: 8,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#2A2A2A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#5ce1e6',
  },
  signOutButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#2A1A1A',
  },
});