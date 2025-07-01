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
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, MessageCircle, Shield, Clock, Users, Building2, Send, X, Plus, User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LiveMoodWidget } from '@/components/LiveMoodWidget';
import {
  getCompanyById,
  createCompanyReview,
  createCompanyClaim,
  startLiveChatWithCompany,
  type FullCompanyProfile,
  type CompanyReview,
  type CompanyClaim,
} from '@/lib/database';

const { width } = Dimensions.get('window');

interface ReviewModalData {
  title: string;
  content: string;
  rating: number;
}

interface ClaimModalData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const ReviewCard = ({ review }: { review: CompanyReview }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={14}
        color={index < rating ? '#FFD700' : '#666666'}
        fill={index < rating ? '#FFD700' : 'transparent'}
      />
    ));
  };

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
        <View style={styles.reviewerInfo}>
          <View style={styles.reviewerAvatar}>
            {review.user_profiles?.avatar_url ? (
              <Image source={{ uri: review.user_profiles.avatar_url }} style={styles.avatarImage} />
            ) : (
              <User size={20} color="#666666" />
            )}
          </View>
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>
              {review.user_profiles?.first_name} {review.user_profiles?.last_name}
            </Text>
            <View style={styles.reviewMeta}>
              <View style={styles.starsContainer}>
                {renderStars(review.rating)}
              </View>
              <Text style={styles.reviewTime}>{getTimeAgo(review.created_at!)}</Text>
            </View>
          </View>
        </View>
        {review.user_profiles?.verified && (
          <View style={styles.verifiedBadge}>
            <Shield size={12} color="#FFFFFF" />
          </View>
        )}
      </View>
      
      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewContent}>{review.content}</Text>
      
      {review.helpful_count && review.helpful_count > 0 && (
        <View style={styles.reviewFooter}>
          <Text style={styles.helpfulText}>{review.helpful_count} people found this helpful</Text>
        </View>
      )}
    </View>
  );
};

const ClaimCard = ({ claim }: { claim: CompanyClaim }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#27AE60';
      case 'in_progress': return '#3498DB';
      case 'rejected': return '#E74C3C';
      default: return '#E67E22';
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
    <View style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <View style={styles.claimerInfo}>
          <View style={styles.claimerAvatar}>
            {claim.user_profiles?.avatar_url ? (
              <Image source={{ uri: claim.user_profiles.avatar_url }} style={styles.avatarImage} />
            ) : (
              <User size={20} color="#666666" />
            )}
          </View>
          <View style={styles.claimerDetails}>
            <Text style={styles.claimerName}>
              {claim.user_profiles?.first_name} {claim.user_profiles?.last_name}
            </Text>
            <Text style={styles.claimTime}>{getTimeAgo(claim.created_at!)}</Text>
          </View>
        </View>
        <View style={styles.claimBadges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(claim.priority) }]}>
            <Text style={styles.badgeText}>{claim.priority}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) }]}>
            <Text style={styles.badgeText}>{claim.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.claimTitle}>{claim.title}</Text>
      <Text style={styles.claimDescription}>{claim.description}</Text>
      <Text style={styles.claimCategory}>Category: {claim.category}</Text>
      
      {claim.resolution_notes && (
        <View style={styles.resolutionSection}>
          <Text style={styles.resolutionTitle}>Resolution Notes:</Text>
          <Text style={styles.resolutionNotes}>{claim.resolution_notes}</Text>
        </View>
      )}
    </View>
  );
};

export default function CompanyProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [company, setCompany] = useState<FullCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'claims'>('overview');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewModalData>({
    title: '',
    content: '',
    rating: 5,
  });
  const [claimData, setClaimData] = useState<ClaimModalData>({
    title: '',
    description: '',
    category: 'General',
    priority: 'medium',
  });

  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
  }, [id]);

  const loadCompanyData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const companyData = await getCompanyById(id!);
      setCompany(companyData);
    } catch (error) {
      console.error('Error loading company data:', error);
      Alert.alert('Error', 'Failed to load company information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    loadCompanyData(true);
  }, [id]);

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

    if (!reviewData.title.trim() || !reviewData.content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      await createCompanyReview(
        company.id,
        user.id,
        reviewData.title,
        reviewData.content,
        reviewData.rating
      );
      
      setShowReviewModal(false);
      setReviewData({ title: '', content: '', rating: 5 });
      Alert.alert('Success', 'Your review has been submitted successfully!');
      loadCompanyData();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  const handleSubmitClaim = async () => {
    if (!user || !company) {
      Alert.alert('Sign In Required', 'Please sign in to submit a claim.');
      return;
    }

    if (!claimData.title.trim() || !claimData.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      await createCompanyClaim(
        company.id,
        user.id,
        claimData.title,
        claimData.description,
        claimData.category,
        claimData.priority
      );
      
      setShowClaimModal(false);
      setClaimData({ title: '', description: '', category: 'General', priority: 'medium' });
      Alert.alert('Success', 'Your claim has been submitted successfully!');
      loadCompanyData();
    } catch (error) {
      console.error('Error submitting claim:', error);
      Alert.alert('Error', 'Failed to submit claim. Please try again.');
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
            <Text style={styles.headerTitle}>Company Profile</Text>
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
            <Text style={styles.headerTitle}>Company Profile</Text>
          </View>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Company Not Found</Text>
            <Text style={styles.errorMessage}>
              The company you're looking for could not be found.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Company Profile</Text>
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={handleStartChat}
          >
            <MessageCircle size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
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
              
              {/* Removed rating stars section */}
              <Text style={styles.ratingText}>
                {company.total_reviews || 0} reviews
              </Text>
            </View>
          </View>

          {/* Company Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>{company.description}</Text>
          </View>

          {/* Contact Information */}
          <View style={styles.contactSection}>
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
            
            {(company.address || company.city || company.country) && (
              <View style={styles.contactItem}>
                <MapPin size={20} color="#5ce1e6" />
                <Text style={styles.contactText}>
                  {[company.address, company.city, company.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </View>

          {/* LiveMood Widget - HIDDEN */}
          {/* 
          <LiveMoodWidget 
            companyId={company.id}
            companyName={company.name}
            showTitle={true}
            compact={false}
          />
          */}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowReviewModal(true)}
            >
              <Star size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Write Review</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => setShowClaimModal(true)}
            >
              <MessageCircle size={20} color="#5ce1e6" />
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>File Claim</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                Overview
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                Reviews ({company.reviews?.length || 0})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'claims' && styles.activeTab]}
              onPress={() => setActiveTab('claims')}
            >
              <Text style={[styles.tabText, activeTab === 'claims' && styles.activeTabText]}>
                Claims ({company.claims?.length || 0})
              </Text>
            </TouchableOpacity>
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
                    <Text style={styles.statValue}>{company.rating ? company.rating.toFixed(1) : 'N/A'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </View>
                
                <Text style={styles.overviewText}>
                  {company.name} is a {company.industry.toLowerCase()} company 
                  {company.verified ? ' with verified status' : ''}. 
                  {company.description}
                </Text>
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
                    <Text style={styles.emptyTitle}>No Reviews Yet</Text>
                    <Text style={styles.emptyMessage}>
                      Be the first to share your experience with {company.name}
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyActionButton}
                      onPress={() => setShowReviewModal(true)}
                    >
                      <Text style={styles.emptyActionText}>Write First Review</Text>
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
                    <MessageCircle size={48} color="#666666" />
                    <Text style={styles.emptyTitle}>No Claims Filed</Text>
                    <Text style={styles.emptyMessage}>
                      No customer claims have been filed against {company.name}
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyActionButton}
                      onPress={() => setShowClaimModal(true)}
                    >
                      <Text style={styles.emptyActionText}>File a Claim</Text>
                    </TouchableOpacity>
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
              <TouchableOpacity onPress={handleSubmitReview}>
                <Send size={24} color="#5ce1e6" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Rating</Text>
                <View style={styles.ratingSelector}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewData(prev => ({ ...prev, rating: star }))}
                    >
                      <Star
                        size={32}
                        color={star <= reviewData.rating ? '#FFD700' : '#666666'}
                        fill={star <= reviewData.rating ? '#FFD700' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Review Title</Text>
                <TextInput
                  style={styles.input}
                  value={reviewData.title}
                  onChangeText={(text) => setReviewData(prev => ({ ...prev, title: text }))}
                  placeholder="Summarize your experience"
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Review Content</Text>
                <TextInput
                  style={styles.textArea}
                  value={reviewData.content}
                  onChangeText={(text) => setReviewData(prev => ({ ...prev, content: text }))}
                  placeholder="Share details about your experience"
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={6}
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
              <Text style={styles.modalTitle}>File Claim</Text>
              <TouchableOpacity onPress={handleSubmitClaim}>
                <Send size={24} color="#5ce1e6" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Claim Title</Text>
                <TextInput
                  style={styles.input}
                  value={claimData.title}
                  onChangeText={(text) => setClaimData(prev => ({ ...prev, title: text }))}
                  placeholder="Brief description of the issue"
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categorySelector}>
                  {['General', 'Product Quality', 'Customer Service', 'Billing', 'Delivery', 'Other'].map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        claimData.category === category && styles.selectedCategory
                      ]}
                      onPress={() => setClaimData(prev => ({ ...prev, category }))}
                    >
                      <Text style={[
                        styles.categoryText,
                        claimData.category === category && styles.selectedCategoryText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.prioritySelector}>
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
                        claimData.priority === priority.key && { backgroundColor: priority.color }
                      ]}
                      onPress={() => setClaimData(prev => ({ ...prev, priority: priority.key as any }))}
                    >
                      <Text style={[
                        styles.priorityText,
                        claimData.priority === priority.key && styles.selectedPriorityText
                      ]}>
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.textArea}
                  value={claimData.description}
                  onChangeText={(text) => setClaimData(prev => ({ ...prev, description: text }))}
                  placeholder="Provide detailed information about your claim"
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={6}
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
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#5ce1e6',
  },
  content: {
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
  },
  companyLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 4,
  },
  companyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  companyIndustry: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  descriptionSection: {
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  contactSection: {
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#CCCCCC',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5ce1e6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#5ce1e6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#5ce1e6',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#5ce1e6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#5ce1e6',
  },
  tabContent: {
    flex: 1,
  },
  overviewContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  overviewText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  reviewsContent: {
    padding: 20,
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
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
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
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
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  reviewContent: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooter: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 12,
  },
  helpfulText: {
    fontSize: 12,
    color: '#666666',
  },
  claimsContent: {
    padding: 20,
    gap: 16,
  },
  claimCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
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
  claimerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  claimerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  claimerDetails: {
    flex: 1,
  },
  claimerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  claimTime: {
    fontSize: 12,
    color: '#666666',
  },
  claimBadges: {
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  claimDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 8,
  },
  claimCategory: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
  },
  resolutionSection: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 12,
  },
  resolutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
    marginBottom: 4,
  },
  resolutionNotes: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  textArea: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  ratingSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  selectedCategory: {
    backgroundColor: '#5ce1e6',
    borderColor: '#5ce1e6',
  },
  categoryText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  priorityText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  selectedPriorityText: {
    color: '#FFFFFF',
  },
});