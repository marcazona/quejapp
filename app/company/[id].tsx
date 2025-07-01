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
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, MessageCircle, Shield, Plus, X, Send, Building2, User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ExperienceVoting } from '@/components/ExperienceVoting';
import { CompanyHeaderEmoji } from '@/components/CompanyHeaderEmoji';
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

const ReviewCard = ({ review }: { review: CompanyReview }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        color={i < rating ? '#FFD700' : '#666666'}
        fill={i < rating ? '#FFD700' : 'transparent'}
      />
    ));
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          {review.user_profiles?.avatar_url ? (
            <Image source={{ uri: review.user_profiles.avatar_url }} style={styles.reviewerAvatar} />
          ) : (
            <View style={styles.reviewerAvatarPlaceholder}>
              <User size={20} color="#666666" />
            </View>
          )}
          <View style={styles.reviewerDetails}>
            <View style={styles.reviewerNameRow}>
              <Text style={styles.reviewerName}>
                {review.user_profiles?.first_name} {review.user_profiles?.last_name}
              </Text>
              {review.user_profiles?.verified && (
                <Shield size={14} color="#27AE60" />
              )}
            </View>
            <View style={styles.ratingRow}>
              {renderStars(review.rating)}
              <Text style={styles.reviewDate}>{getTimeAgo(review.created_at!)}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewContent}>{review.content}</Text>
      
      {review.is_verified_purchase && (
        <View style={styles.verifiedPurchase}>
          <Shield size={12} color="#27AE60" />
          <Text style={styles.verifiedText}>Verified Purchase</Text>
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <View style={styles.claimUserInfo}>
          {claim.user_profiles?.avatar_url ? (
            <Image source={{ uri: claim.user_profiles.avatar_url }} style={styles.claimUserAvatar} />
          ) : (
            <View style={styles.claimUserAvatarPlaceholder}>
              <User size={16} color="#666666" />
            </View>
          )}
          <View style={styles.claimUserDetails}>
            <Text style={styles.claimUserName}>
              {claim.user_profiles?.first_name} {claim.user_profiles?.last_name}
            </Text>
            <Text style={styles.claimDate}>{getTimeAgo(claim.created_at!)}</Text>
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
      <Text style={styles.claimDescription} numberOfLines={3}>{claim.description}</Text>
      <Text style={styles.claimCategory}>Category: {claim.category}</Text>
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    title: '',
    content: '',
    rating: 5,
  });

  // Claim form state
  const [claimForm, setClaimForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
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
      console.error('Error loading company:', error);
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

    if (!reviewForm.title.trim() || !reviewForm.content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCompanyReview(
        company.id,
        user.id,
        reviewForm.title.trim(),
        reviewForm.content.trim(),
        reviewForm.rating
      );

      setShowReviewModal(false);
      setReviewForm({ title: '', content: '', rating: 5 });
      await loadCompanyData();
      Alert.alert('Success', 'Your review has been submitted!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!user || !company) {
      Alert.alert('Sign In Required', 'Please sign in to submit a claim.');
      return;
    }

    if (!claimForm.title.trim() || !claimForm.description.trim() || !claimForm.category.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCompanyClaim(
        company.id,
        user.id,
        claimForm.title.trim(),
        claimForm.description.trim(),
        claimForm.category.trim(),
        claimForm.priority
      );

      setShowClaimModal(false);
      setClaimForm({ title: '', description: '', category: '', priority: 'medium' });
      await loadCompanyData();
      Alert.alert('Success', 'Your claim has been submitted!');
    } catch (error) {
      console.error('Error submitting claim:', error);
      Alert.alert('Error', 'Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number | null) => {
    const stars = [];
    const actualRating = rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          color={i <= actualRating ? '#FFD700' : '#666666'}
          fill={i <= actualRating ? '#FFD700' : 'transparent'}
        />
      );
    }
    return stars;
  };

  const renderRatingSelector = () => {
    return (
      <View style={styles.ratingSelector}>
        <Text style={styles.ratingLabel}>Rating</Text>
        <View style={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setReviewForm(prev => ({ ...prev, rating: star }))}
            >
              <Star
                size={24}
                color={star <= reviewForm.rating ? '#FFD700' : '#666666'}
                fill={star <= reviewForm.rating ? '#FFD700' : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Company Not Found</Text>
            <Text style={styles.errorMessage}>
              The company you're looking for doesn't exist or has been removed.
            </Text>
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{company.name}</Text>
            <CompanyHeaderEmoji companyId={company.id} size="small" />
          </View>
          <TouchableOpacity style={styles.chatButton} onPress={handleStartChat}>
            <MessageCircle size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5ce1e6" />
          }
        >
          {/* Company Info */}
          <View style={styles.companyInfo}>
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
              
              <View style={styles.companyDetails}>
                <View style={styles.companyNameRow}>
                  <Text style={styles.companyName}>{company.name}</Text>
                  <CompanyHeaderEmoji companyId={company.id} size="medium" />
                </View>
                <Text style={styles.companyIndustry}>{company.industry}</Text>
                
                <View style={styles.ratingContainer}>
                  <View style={styles.ratingRow}>
                    {renderStars(company.rating)}
                    <Text style={styles.ratingText}>
                      {company.rating ? company.rating.toFixed(1) : 'No rating'}
                    </Text>
                  </View>
                  <Text style={styles.reviewCount}>
                    {company.total_reviews || 0} reviews • {company.total_claims || 0} claims
                  </Text>
                </View>
              </View>
            </View>

            {company.description && (
              <Text style={styles.companyDescription}>{company.description}</Text>
            )}

            {/* Contact Info */}
            <View style={styles.contactInfo}>
              {company.website && (
                <View style={styles.contactItem}>
                  <Globe size={16} color="#5ce1e6" />
                  <Text style={styles.contactText}>{company.website}</Text>
                </View>
              )}
              {company.phone && (
                <View style={styles.contactItem}>
                  <Phone size={16} color="#5ce1e6" />
                  <Text style={styles.contactText}>{company.phone}</Text>
                </View>
              )}
              {company.email && (
                <View style={styles.contactItem}>
                  <Mail size={16} color="#5ce1e6" />
                  <Text style={styles.contactText}>{company.email}</Text>
                </View>
              )}
              {(company.city || company.country) && (
                <View style={styles.contactItem}>
                  <MapPin size={16} color="#5ce1e6" />
                  <Text style={styles.contactText}>
                    {[company.city, company.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Experience Voting */}
          <ExperienceVoting 
            companyId={company.id} 
            companyName={company.name}
          />

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
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Company Overview</Text>
              <Text style={styles.overviewText}>
                {company.description || 'No description available for this company.'}
              </Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{company.total_reviews || 0}</Text>
                  <Text style={styles.statLabel}>Reviews</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{company.total_claims || 0}</Text>
                  <Text style={styles.statLabel}>Claims</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {company.rating ? company.rating.toFixed(1) : 'N/A'}
                  </Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Customer Reviews</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowReviewModal(true)}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Review</Text>
                </TouchableOpacity>
              </View>
              
              {company.reviews && company.reviews.length > 0 ? (
                company.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No Reviews Yet</Text>
                  <Text style={styles.emptyMessage}>
                    Be the first to share your experience with this company.
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'claims' && (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Customer Claims</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowClaimModal(true)}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>File Claim</Text>
                </TouchableOpacity>
              </View>
              
              {company.claims && company.claims.length > 0 ? (
                company.claims.map((claim) => (
                  <ClaimCard key={claim.id} claim={claim} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No Claims Filed</Text>
                  <Text style={styles.emptyMessage}>
                    No customer claims have been filed for this company yet.
                  </Text>
                </View>
              )}
            </View>
          )}
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
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#5ce1e6" />
                ) : (
                  <Send size={20} color="#5ce1e6" />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {renderRatingSelector()}
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Review Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={reviewForm.title}
                  onChangeText={(text) => setReviewForm(prev => ({ ...prev, title: text }))}
                  placeholder="Summarize your experience"
                  placeholderTextColor="#666666"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Review</Text>
                <TextInput
                  style={styles.textArea}
                  value={reviewForm.content}
                  onChangeText={(text) => setReviewForm(prev => ({ ...prev, content: text }))}
                  placeholder="Share your detailed experience with this company"
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={6}
                  maxLength={1000}
                  textAlignVertical="top"
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
              <Text style={styles.modalTitle}>File a Claim</Text>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitClaim}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#5ce1e6" />
                ) : (
                  <Send size={20} color="#5ce1e6" />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Claim Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={claimForm.title}
                  onChangeText={(text) => setClaimForm(prev => ({ ...prev, title: text }))}
                  placeholder="Brief description of your issue"
                  placeholderTextColor="#666666"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.textInput}
                  value={claimForm.category}
                  onChangeText={(text) => setClaimForm(prev => ({ ...prev, category: text }))}
                  placeholder="e.g., Product Quality, Customer Service, Billing"
                  placeholderTextColor="#666666"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.prioritySelector}>
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        claimForm.priority === priority && styles.priorityOptionActive
                      ]}
                      onPress={() => setClaimForm(prev => ({ ...prev, priority: priority as any }))}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        claimForm.priority === priority && styles.priorityOptionTextActive
                      ]}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.textArea}
                  value={claimForm.description}
                  onChangeText={(text) => setClaimForm(prev => ({ ...prev, description: text }))}
                  placeholder="Provide detailed information about your claim"
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={6}
                  maxLength={1000}
                  textAlignVertical="top"
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
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
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
    textAlign: 'center',
    lineHeight: 24,
  },
  companyInfo: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  companyHeader: {
    flexDirection: 'row',
    marginBottom: 16,
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
  companyDetails: {
    flex: 1,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  companyIndustry: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  ratingContainer: {
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666666',
  },
  companyDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#5ce1e6',
  },
  tabContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  overviewText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
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
  },
  reviewCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  reviewHeader: {
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
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
  verifiedPurchase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '500',
  },
  claimCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    alignItems: 'center',
    flex: 1,
  },
  claimUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  claimUserAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  claimUserDetails: {
    flex: 1,
  },
  claimUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  claimDate: {
    fontSize: 12,
    color: '#666666',
  },
  claimBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
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
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  textArea: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minHeight: 120,
  },
  ratingSelector: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 12,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#2A2A2A',
    borderColor: '#5ce1e6',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  priorityOptionTextActive: {
    color: '#5ce1e6',
  },
});