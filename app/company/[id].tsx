import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
  Platform,
  Dimensions,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, MessageCircle, Shield, Building2, Plus, Send, X, User, Clock, Flag, ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCompanyById, 
  createCompanyReview, 
  createCompanyClaim, 
  startLiveChatWithCompany,
  type FullCompanyProfile,
  type CompanyReview,
  type CompanyClaim 
} from '@/lib/database';

const { width } = Dimensions.get('window');

interface NewReview {
  title: string;
  content: string;
  rating: number;
}

interface NewClaim {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const StarRating = ({ rating, size = 16, onRatingChange }: { 
  rating: number; 
  size?: number; 
  onRatingChange?: (rating: number) => void;
}) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <TouchableOpacity
        key={i}
        onPress={() => onRatingChange?.(i)}
        disabled={!onRatingChange}
        style={styles.starButton}
      >
        <Star
          size={size}
          color={i <= rating ? '#FFD700' : '#666666'}
          fill={i <= rating ? '#FFD700' : 'transparent'}
        />
      </TouchableOpacity>
    );
  }
  return <View style={styles.starContainer}>{stars}</View>;
};

const ReviewCard = ({ review }: { review: CompanyReview }) => {
  const userProfile = review.user_profiles;
  
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserInfo}>
          <View style={styles.reviewAvatar}>
            {userProfile?.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.reviewAvatarImage} />
            ) : (
              <User size={20} color="#666666" />
            )}
          </View>
          <View style={styles.reviewUserDetails}>
            <View style={styles.reviewUserName}>
              <Text style={styles.reviewUserNameText}>
                {userProfile?.first_name} {userProfile?.last_name}
              </Text>
              {userProfile?.verified && (
                <Shield size={14} color="#27AE60" />
              )}
            </View>
            <View style={styles.reviewMeta}>
              <StarRating rating={review.rating} size={14} />
              <Text style={styles.reviewTime}>{getTimeAgo(review.created_at!)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.reviewActions}>
          <TouchableOpacity style={styles.reviewActionButton}>
            <ThumbsUp size={16} color="#666666" />
            <Text style={styles.reviewActionText}>{review.helpful_count || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewContent}>{review.content}</Text>
      
      {review.is_verified_purchase && (
        <View style={styles.verifiedPurchase}>
          <Shield size={12} color="#27AE60" />
          <Text style={styles.verifiedPurchaseText}>Verified Purchase</Text>
        </View>
      )}
    </View>
  );
};

const ClaimCard = ({ claim }: { claim: CompanyClaim }) => {
  const userProfile = claim.user_profiles;
  
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#27AE60';
      case 'in_progress': return '#3498DB';
      case 'rejected': return '#E74C3C';
      default: return '#F39C12';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#E74C3C';
      case 'high': return '#E67E22';
      case 'medium': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  return (
    <View style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <View style={styles.claimUserInfo}>
          <View style={styles.claimAvatar}>
            {userProfile?.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.claimAvatarImage} />
            ) : (
              <User size={20} color="#666666" />
            )}
          </View>
          <View style={styles.claimUserDetails}>
            <View style={styles.claimUserName}>
              <Text style={styles.claimUserNameText}>
                {userProfile?.first_name} {userProfile?.last_name}
              </Text>
              {userProfile?.verified && (
                <Shield size={14} color="#27AE60" />
              )}
            </View>
            <Text style={styles.claimTime}>{getTimeAgo(claim.created_at!)}</Text>
          </View>
        </View>
        <View style={styles.claimBadges}>
          <View style={[styles.claimBadge, { backgroundColor: getStatusColor(claim.status) }]}>
            <Text style={styles.claimBadgeText}>{claim.status.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.claimBadge, { backgroundColor: getPriorityColor(claim.priority) }]}>
            <Text style={styles.claimBadgeText}>{claim.priority}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.claimTitle}>{claim.title}</Text>
      <Text style={styles.claimDescription}>{claim.description}</Text>
      
      <View style={styles.claimFooter}>
        <Text style={styles.claimCategory}>Category: {claim.category}</Text>
        {claim.resolution_notes && (
          <Text style={styles.claimResolution}>Resolution: {claim.resolution_notes}</Text>
        )}
      </View>
    </View>
  );
};

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [company, setCompany] = useState<FullCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'claims'>('overview');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [newReview, setNewReview] = useState<NewReview>({ title: '', content: '', rating: 5 });
  const [newClaim, setNewClaim] = useState<NewClaim>({ 
    title: '', 
    description: '', 
    category: 'General', 
    priority: 'medium' 
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
  }, [id]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const companyData = await getCompanyById(id!);
      setCompany(companyData);
    } catch (error) {
      console.error('Error loading company:', error);
      Alert.alert('Error', 'Failed to load company information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadCompanyData();
  }, []);

  const handleStartChat = async () => {
    if (!user || !company) {
      Alert.alert('Sign In Required', 'Please sign in to start a chat with this company.');
      return;
    }

    try {
      const conversation = await startLiveChatWithCompany(user.id, company.id);
      router.push(`/(tabs)/messages/${conversation.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !company) {
      Alert.alert('Sign In Required', 'Please sign in to submit a review.');
      return;
    }

    if (!newReview.title.trim() || !newReview.content.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSubmittingReview(true);
    try {
      const review = await createCompanyReview(
        company.id,
        user.id,
        newReview.title,
        newReview.content,
        newReview.rating
      );
      
      setCompany(prev => prev ? {
        ...prev,
        reviews: [review, ...(prev.reviews || [])]
      } : null);
      
      setNewReview({ title: '', content: '', rating: 5 });
      setShowReviewModal(false);
      Alert.alert('Success', 'Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!user || !company) {
      Alert.alert('Sign In Required', 'Please sign in to submit a claim.');
      return;
    }

    if (!newClaim.title.trim() || !newClaim.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSubmittingClaim(true);
    try {
      const claim = await createCompanyClaim(
        company.id,
        user.id,
        newClaim.title,
        newClaim.description,
        newClaim.category,
        newClaim.priority
      );
      
      setCompany(prev => prev ? {
        ...prev,
        claims: [claim, ...(prev.claims || [])]
      } : null);
      
      setNewClaim({ title: '', description: '', category: 'General', priority: 'medium' });
      setShowClaimModal(false);
      Alert.alert('Success', 'Claim submitted successfully!');
    } catch (error) {
      console.error('Error submitting claim:', error);
      Alert.alert('Error', 'Failed to submit claim. Please try again.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Company</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5ce1e6" />
            <Text style={styles.loadingText}>Loading company information...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Company</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Company Not Found</Text>
            <Text style={styles.errorMessage}>
              The company you're looking for doesn't exist or has been removed.
            </Text>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => router.back()}
            >
              <Text style={styles.errorButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const TabButton = ({ tab, label, count }: { 
    tab: typeof activeTab; 
    label: string; 
    count?: number;
  }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Details</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5ce1e6" />
          }
        >
          {/* Company Header */}
          <View style={styles.companyHeader}>
            <View style={styles.companyLogoContainer}>
              {company.logo_url ? (
                <Image source={{ uri: company.logo_url }} style={styles.companyLogo} />
              ) : (
                <View style={styles.companyLogoPlaceholder}>
                  <Building2 size={48} color="#666666" />
                </View>
              )}
              {company.verified && (
                <View style={styles.verifiedBadge}>
                  <Shield size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
            
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.companyIndustry}>{company.industry}</Text>
              
              <View style={styles.companyRating}>
                <StarRating rating={company.rating || 0} />
                <Text style={styles.ratingText}>
                  {company.rating ? company.rating.toFixed(1) : 'No rating'} 
                  ({company.total_reviews || 0} reviews)
                </Text>
              </View>
            </View>
          </View>

          {/* Company Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.companyDescription}>
              {company.description || 'No description available.'}
            </Text>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.contactInfo}>
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
              {(company.address || company.city || company.country) && (
                <View style={styles.contactItem}>
                  <MapPin size={20} color="#5ce1e6" />
                  <Text style={styles.contactText}>
                    {[company.address, company.city, company.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryActionButton} onPress={handleStartChat}>
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.primaryActionButtonText}>Start Live Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => setShowReviewModal(true)}
            >
              <Star size={20} color="#5ce1e6" />
              <Text style={styles.secondaryActionButtonText}>Write Review</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => setShowClaimModal(true)}
            >
              <Flag size={20} color="#E67E22" />
              <Text style={styles.secondaryActionButtonText}>Submit Claim</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TabButton tab="overview" label="Overview" />
            <TabButton tab="reviews" label="Reviews" count={company.reviews?.length || 0} />
            <TabButton tab="claims" label="Claims" count={company.claims?.length || 0} />
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'overview' && (
              <View style={styles.overviewContent}>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{company.total_reviews || 0}</Text>
                    <Text style={styles.statLabel}>Reviews</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{company.total_claims || 0}</Text>
                    <Text style={styles.statLabel}>Claims</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {company.rating ? company.rating.toFixed(1) : 'N/A'}
                    </Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'reviews' && (
              <View style={styles.reviewsContent}>
                {company.reviews && company.reviews.length > 0 ? (
                  company.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Star size={48} color="#666666" />
                    <Text style={styles.emptyStateTitle}>No Reviews Yet</Text>
                    <Text style={styles.emptyStateMessage}>
                      Be the first to share your experience with this company.
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyStateButton}
                      onPress={() => setShowReviewModal(true)}
                    >
                      <Text style={styles.emptyStateButtonText}>Write First Review</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'claims' && (
              <View style={styles.claimsContent}>
                {company.claims && company.claims.length > 0 ? (
                  company.claims.map((claim) => (
                    <ClaimCard key={claim.id} claim={claim} />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Flag size={48} color="#666666" />
                    <Text style={styles.emptyStateTitle}>No Claims Yet</Text>
                    <Text style={styles.emptyStateMessage}>
                      No customer claims have been submitted for this company.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Review Modal */}
        <Modal
          visible={showReviewModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowReviewModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <X size={24} color="#666666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Write Review</Text>
              <TouchableOpacity 
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#5ce1e6" />
                ) : (
                  <Send size={24} color="#5ce1e6" />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Rating</Text>
                <StarRating 
                  rating={newReview.rating} 
                  size={32}
                  onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Review Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={newReview.title}
                  onChangeText={(text) => setNewReview(prev => ({ ...prev, title: text }))}
                  placeholder="Summarize your experience"
                  placeholderTextColor="#666666"
                  maxLength={100}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Review Content</Text>
                <TextInput
                  style={styles.textArea}
                  value={newReview.content}
                  onChangeText={(text) => setNewReview(prev => ({ ...prev, content: text }))}
                  placeholder="Share details about your experience with this company"
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={6}
                  maxLength={1000}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Claim Modal */}
        <Modal
          visible={showClaimModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowClaimModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowClaimModal(false)}>
                <X size={24} color="#666666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Submit Claim</Text>
              <TouchableOpacity 
                onPress={handleSubmitClaim}
                disabled={submittingClaim}
              >
                {submittingClaim ? (
                  <ActivityIndicator size="small" color="#E67E22" />
                ) : (
                  <Send size={24} color="#E67E22" />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Claim Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={newClaim.title}
                  onChangeText={(text) => setNewClaim(prev => ({ ...prev, title: text }))}
                  placeholder="Brief description of the issue"
                  placeholderTextColor="#666666"
                  maxLength={100}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryButtons}>
                  {['General', 'Product Quality', 'Customer Service', 'Billing', 'Delivery', 'Other'].map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        newClaim.category === category && styles.selectedCategoryButton
                      ]}
                      onPress={() => setNewClaim(prev => ({ ...prev, category }))}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        newClaim.category === category && styles.selectedCategoryButtonText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {[
                    { key: 'low', label: 'Low', color: '#95A5A6' },
                    { key: 'medium', label: 'Medium', color: '#F39C12' },
                    { key: 'high', label: 'High', color: '#E67E22' },
                    { key: 'urgent', label: 'Urgent', color: '#E74C3C' },
                  ].map((priority) => (
                    <TouchableOpacity
                      key={priority.key}
                      style={[
                        styles.priorityButton,
                        newClaim.priority === priority.key && { backgroundColor: priority.color }
                      ]}
                      onPress={() => setNewClaim(prev => ({ ...prev, priority: priority.key as any }))}
                    >
                      <Text style={[
                        styles.priorityButtonText,
                        newClaim.priority === priority.key && styles.selectedPriorityButtonText
                      ]}>
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={styles.textArea}
                  value={newClaim.description}
                  onChangeText={(text) => setNewClaim(prev => ({ ...prev, description: text }))}
                  placeholder="Provide detailed information about your claim"
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={6}
                  maxLength={1000}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
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
  errorButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  companyHeader: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  companyLogoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  companyLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3A3A3A',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  companyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  companyIndustry: {
    fontSize: 16,
    color: '#5ce1e6',
    marginBottom: 8,
    fontWeight: '600',
  },
  companyRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    backgroundColor: '#1A1A1A',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  companyDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#CCCCCC',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#1A1A1A',
    marginBottom: 8,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5ce1e6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  secondaryActionButtonText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  activeTabButton: {
    borderBottomColor: '#5ce1e6',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabButtonText: {
    color: '#5ce1e6',
  },
  tabBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  tabContent: {
    flex: 1,
  },
  overviewContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  reviewsContent: {
    padding: 20,
    gap: 16,
  },
  claimsContent: {
    padding: 20,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewUserDetails: {
    flex: 1,
  },
  reviewUserName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reviewUserNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewTime: {
    fontSize: 12,
    color: '#666666',
  },
  reviewActions: {
    alignItems: 'flex-end',
  },
  reviewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  reviewActionText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
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
    marginBottom: 12,
  },
  verifiedPurchase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedPurchaseText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
  },
  claimCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  claimUserInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  claimAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  claimAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  claimUserDetails: {
    flex: 1,
  },
  claimUserName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  claimUserNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  claimTime: {
    fontSize: 12,
    color: '#666666',
  },
  claimBadges: {
    gap: 4,
  },
  claimBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  claimTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  claimDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 12,
  },
  claimFooter: {
    gap: 4,
  },
  claimCategory: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  claimResolution: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '500',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  starButton: {
    padding: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  textArea: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  selectedCategoryButton: {
    backgroundColor: '#5ce1e6',
    borderColor: '#5ce1e6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  selectedPriorityButtonText: {
    color: '#FFFFFF',
  },
});