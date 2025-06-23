import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  RefreshControl,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin, Star, Shield, MessageCircle, User, Building2, Phone, Mail, Globe } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getDiscoveryCompanies, type Company } from '@/lib/database';

const { width } = Dimensions.get('window');
const GRID_SPACING = 12;
const GRID_COLUMNS = 2;
const ITEM_WIDTH = (width - (GRID_SPACING * (GRID_COLUMNS + 1))) / GRID_COLUMNS;

const CompanyGridItem = ({ company, onPress }: { company: Company; onPress: () => void }) => {
  const getRatingColor = (rating: number | null) => {
    if (!rating) return '#666666';
    if (rating >= 4.5) return '#27AE60';
    if (rating >= 4.0) return '#F39C12';
    if (rating >= 3.0) return '#E67E22';
    return '#E74C3C';
  };

  const getIndustryColor = (industry: string) => {
    const colors: { [key: string]: string } = {
      'Technology': '#3498DB',
      'Food & Beverage': '#27AE60',
      'Fashion & Retail': '#E91E63',
      'Healthcare': '#E74C3C',
      'Services': '#9B59B6',
      'Automotive': '#34495E',
    };
    return colors[industry] || '#666666';
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.companyCard}>
      <View style={styles.companyImageContainer}>
        {company.logo_url ? (
          <Image source={{ uri: company.logo_url }} style={styles.companyLogo} />
        ) : (
          <View style={styles.companyLogoPlaceholder}>
            <Building2 size={32} color="#666666" />
          </View>
        )}
        
        {/* Verified badge */}
        {company.verified && (
          <View style={styles.verifiedBadge}>
            <Shield size={12} color="#FFFFFF" />
          </View>
        )}
        
      </View>
      
      <View style={styles.companyInfo}>
        <Text style={styles.companyName} numberOfLines={2}>
          {company.name}
        </Text>
        
        {/* Rating and reviews */}
        <View style={styles.ratingContainer}>
          <View style={styles.ratingRow}>
            <Star size={14} color={getRatingColor(company.rating)} fill={getRatingColor(company.rating)} />
            <Text style={[styles.ratingText, { color: getRatingColor(company.rating) }]}>
              {company.rating ? company.rating.toFixed(1) : 'N/A'}
            </Text>
            <Text style={styles.reviewsText}>
              ({company.total_reviews || 0} reviews)
            </Text>
          </View>
        </View>
        
        {/* Claims count */}
        <View style={styles.claimsContainer}>
          <MessageCircle size={12} color="#E67E22" />
          <Text style={styles.claimsText}>
            {company.total_claims || 0} claims
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DiscoverScreen() {
  const { user: currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // TODO: Get user's current location for distance calculation
      const userLocation = undefined;

      const discoveryCompanies = await getDiscoveryCompanies(userLocation);
      setCompanies(discoveryCompanies);
    } catch (error: any) {
      console.error('Error loading discovery companies:', error);
      setError(error.message || 'Failed to load companies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const onRefresh = React.useCallback(() => {
    loadCompanies(true);
  }, []);

  const handleCompanyPress = (company: Company) => {
    router.push(`/company/${company.id}`);
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <SafeAreaView style={styles.safeAreaHeader}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>quejapp</Text>
              </View>
              
              <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                {currentUser?.avatar_url ? (
                  <Image source={{ uri: currentUser.avatar_url }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <User size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5ce1e6" />
          <Text style={styles.loadingText}>Loading companies...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <SafeAreaView style={styles.safeAreaHeader}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>quejapp</Text>
              </View>
              
              <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                {currentUser?.avatar_url ? (
                  <Image source={{ uri: currentUser.avatar_url }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <User size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadCompanies()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <SafeAreaView style={styles.safeAreaHeader}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>quejapp</Text>
            </View>
            
            <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
              {currentUser?.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <User size={20} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Companies Grid */}
      {companies.length > 0 ? (
        <ScrollView
          style={styles.gridContainer}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5ce1e6" />
          }
        >
          <View style={styles.grid}>
            {companies.map((company) => (
              <CompanyGridItem
                key={company.id}
                company={company}
                onPress={() => handleCompanyPress(company)}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Building2 size={64} color="#3A3A3A" />
          <Text style={styles.emptyTitle}>No Companies Found</Text>
          <Text style={styles.emptyMessage}>
            We're adding new companies every day. Check back soon to discover businesses you can interact with!
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => loadCompanies()}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  headerContainer: {
    backgroundColor: '#1A1A1A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  safeAreaHeader: {
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#5ce1e6',
    fontWeight: '500',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#5ce1e6',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  refreshButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  gridContainer: {
    flex: 1,
  },
  gridContent: {
    padding: GRID_SPACING,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  companyCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: GRID_SPACING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyImageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  companyLogoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#27AE60',
    borderRadius: 10,
    padding: 4,
  },
  companyInfo: {
    padding: 12,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 18,
  },
  ratingContainer: {
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewsText: {
    fontSize: 11,
    color: '#666666',
  },
  claimsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  claimsText: {
    fontSize: 11,
    color: '#E67E22',
    fontWeight: '500',
  },
});