import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Star, MessageCircle, Shield, MapPin, Globe, Phone, Mail, Heart, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyById, type FullCompanyProfile } from '@/lib/database';
import { LiveMoodWidget } from '@/components/LiveMoodWidget';

export default function CompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [company, setCompany] = useState<FullCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadCompany();
  }, [id]);

  const loadCompany = async () => {
    if (!id) {
      setError('Company ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const companyData = await getCompanyById(id as string);
      
      if (!companyData) {
        setError('Company not found');
      } else {
        setCompany(companyData);
        setError(null);
      }
    } catch (error: any) {
      console.error('Error loading company:', error);
      setError(error.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to follow companies',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/signin') }
        ]
      );
      return;
    }

    // Toggle following state
    setIsFollowing(!isFollowing);
    
    // Show feedback to user
    Alert.alert(
      isFollowing ? 'Unfollowed' : 'Following',
      isFollowing 
        ? `You are no longer following ${company?.name}`
        : `You are now following ${company?.name}. You'll see updates in your feed.`,
      [{ text: 'OK' }]
    );
    
    // TODO: Implement actual database call to add/remove follower
  };

  const handleStartChat = () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to chat with companies',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/signin') }
        ]
      );
      return;
    }

    if (!company) return;

    // Navigate to chat screen
    router.push(`/messages/conv_${company.id}_${user.id}_${Date.now()}`);
  };

  const handleFileClaim = () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to file a claim',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/signin') }
        ]
      );
      return;
    }

    if (!company) return;

    // Navigate to file claim screen
    router.push(`/claim/new?companyId=${company.id}&companyName=${company.name}`);
  };

  const handleWriteReview = () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to write a review',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/signin') }
        ]
      );
      return;
    }

    if (!company) return;

    // Navigate to write review screen
    router.push(`/review/new?companyId=${company.id}&companyName=${company.name}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading...</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5ce1e6" />
            <Text style={styles.loadingText}>Loading company details...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error || !company) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Error</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>{error || 'Failed to load company'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadCompany}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{company.name}</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Company Info */}
          <View style={styles.companyInfo}>
            <View style={styles.companyLogoContainer}>
              {company.logo_url ? (
                <Image source={{ uri: company.logo_url }} style={styles.companyLogo} />
              ) : (
                <View style={styles.companyLogoPlaceholder} />
              )}
              {company.verified && (
                <View style={styles.verifiedBadge}>
                  <Shield size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            
            <View style={styles.companyDetails}>
              <View style={styles.companyNameRow}>
                <Text style={styles.companyName}>{company.name}</Text>
                {company.verified && (
                  <View style={styles.verifiedBadgeInline}>
                    <Shield size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={styles.companyIndustry}>{company.industry}</Text>
              
              <View style={styles.companyInfoRow}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Star size={16} color="#FFD700" />
                    <Text style={styles.statText}>{company.reviews?.length || 0} Qudos</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <MessageCircle size={16} color="#FF6B6B" />
                    <Text style={styles.statText}>{company.claims?.length || 0} Claims</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.followButton}
                  onPress={handleToggleFollow}
                  accessibilityLabel={isFollowing ? "Unfollow company" : "Follow company"}
                >
                  <Heart 
                    size={22} 
                    color={isFollowing ? "#E74C3C" : "#FFFFFF"} 
                    fill={isFollowing ? "#E74C3C" : "transparent"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* LiveMood Widget */}
          <View style={styles.widgetContainer}>
            <LiveMoodWidget 
              companyId={company.id} 
              companyName={company.name}
              showTitle={true}
              compact={false}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{company.description}</Text>
          </View>

          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            {company.website && (
              <View style={styles.contactItem}>
                <Globe size={20} color="#5ce1e6" />
                <Text style={styles.contactText}>{company.website}</Text>
              </View>
            )}
            
            {company.phone && (
              <View style={styles.contactItem}>
                <Phone size={20} color="#5ce1e6" />
                <Text style={styles.contactText}>{company.phone}</Text>
              </View>
            )}
            
            {company.email && (
              <View style={styles.contactItem}>
                <Mail size={20} color="#5ce1e6" />
                <Text style={styles.contactText}>{company.email}</Text>
              </View>
            )}
            
            {company.address && (
              <View style={styles.contactItem}>
                <MapPin size={20} color="#5ce1e6" />
                <Text style={styles.contactText}>
                  {company.address}
                  {company.city && `, ${company.city}`}
                  {company.country && `, ${company.country}`}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleStartChat}
            >
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Live Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.claimButton]}
              onPress={handleFileClaim}
            >
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>File Claim</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.reviewButton]}
              onPress={handleWriteReview}
            >
              <Star size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {company.reviews && company.reviews.length > 0 ? (
              company.reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>
                        {review.user_profiles?.first_name} {review.user_profiles?.last_name}
                      </Text>
                      <View style={styles.ratingContainer}>
                        <Star size={14} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.ratingText}>{review.rating || 5}</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at || '').toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.reviewTitle}>{review.title}</Text>
                  <Text style={styles.reviewContent}>{review.content}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No reviews yet. Be the first to review!</Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={handleWriteReview}
                >
                  <Text style={styles.emptyStateButtonText}>Write a Review</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Claims Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Claims</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {company.claims && company.claims.length > 0 ? (
              company.claims.slice(0, 3).map((claim) => (
                <View key={claim.id} style={styles.claimCard}>
                  <View style={styles.claimHeader}>
                    <View style={styles.claimerInfo}>
                      <Text style={styles.claimerName}>
                        {claim.user_profiles?.first_name} {claim.user_profiles?.last_name}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        claim.status === 'resolved' && styles.resolvedBadge,
                        claim.status === 'in_progress' && styles.inProgressBadge,
                        claim.status === 'pending' && styles.pendingBadge,
                        claim.status === 'rejected' && styles.rejectedBadge,
                      ]}>
                        <Text style={styles.statusText}>
                          {claim.status === 'in_progress' ? 'In Progress' : 
                           claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.claimDate}>
                      {new Date(claim.created_at || '').toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.claimTitle}>{claim.title}</Text>
                  <Text style={styles.claimContent}>{claim.description}</Text>
                  <View style={styles.claimCategory}>
                    <Text style={styles.claimCategoryText}>{claim.category}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No claims filed yet.</Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={handleFileClaim}
                >
                  <Text style={styles.emptyStateButtonText}>File a Claim</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  companyInfo: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  companyLogoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
  },
  companyLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#27AE60',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  verifiedBadgeInline: {
    backgroundColor: '#27AE60',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  companyDetails: {
    flex: 1,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  companyIndustry: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  companyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5ce1e6',
    paddingVertical: 16,
    borderRadius: 16,
  },
  claimButton: {
    backgroundColor: '#FF6B6B',
  },
  reviewButton: {
    backgroundColor: '#FFD700',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666666',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  reviewContent: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  claimCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  claimerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  claimerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#F39C12',
  },
  inProgressBadge: {
    backgroundColor: '#3498DB',
  },
  resolvedBadge: {
    backgroundColor: '#27AE60',
  },
  rejectedBadge: {
    backgroundColor: '#E74C3C',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  claimDate: {
    fontSize: 12,
    color: '#666666',
  },
  claimTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  claimContent: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 12,
  },
  claimCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  claimCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});