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
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, MessageCircle, Shield, Clock, User, Send, X, Plus, Flag, Heart, Share, Building2, Users, TrendingUp, Award, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Calendar, FileText, Camera, CreditCard as Edit3 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
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
  const isInteractive = !!onRatingChange;
  
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= rating;
    const StarComponent = isInteractive ? TouchableOpacity : View;
    
    stars.push(
      <StarComponent
        key={i}
        onPress={isInteractive ? () => onRatingChange(i) : undefined}
        style={isInteractive ? styles.interactiveStar : undefined}
      >
        <Star 
          size={size} 
          color={isFilled ? "#F39C12" : "#666666"} 
          fill={isFilled ? "#F39C12" : "transparent"}
        />
      </StarComponent>
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
          {userProfile?.avatar_url ? (
            <Image source={{ uri: userProfile.avatar_url }} style={styles.reviewAvatar} />
          ) : (
            <View style={styles.reviewAvatarPlaceholder}>
              <User size={20} color="#666666" />
            </View>
          )}
          <View style={styles.reviewUserDetails}>
            <View style={styles.reviewUserName}>
              <Text style={styles.reviewUserNameText}>
                {userProfile?.first_name} {userProfile?.last_name}
              </Text>
              {userProfile?.verified && (
                <Shield size={14} color="#27AE60" />
              )}
            </View>
            <Text style={styles.reviewTime}>{getTimeAgo(review.created_at || '')}</Text>
          </View>
        </View>
        <StarRating rating={review.rating} size={14} />
      </View>
      
      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewContent}>{review.content}</Text>
      
      {review.is_verified_purchase && (
        <View style={styles.verifiedPurchase}>
          <CheckCircle size={12} color="#27AE60" />
          <Text style={styles.verifiedPurchaseText}>Verified Purchase</Text>
        </View>
      )}
      
      <View style={styles.reviewActions}>
        <TouchableOpacity style={styles.reviewAction}>
          <Heart size={16} color="#666666" />
          <Text style={styles.reviewActionText}>Helpful ({review.helpful_count || 0})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reviewAction}>
          <Flag size={16} color="#666666" />
          <Text style={styles.reviewActionText}>Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ClaimCard = ({ claim }: { claim: CompanyClaim }) => {
  const userProfile = claim.user_profiles;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#27AE60';
      case 'in_progress': return '#F39C12';
      case 'rejected': return '#E74C3C';
      default: return '#666666';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#E74C3C';
      case 'high': return '#E67E22';
      case 'medium': return '#F39C12';
      default: return '#27AE60';
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
        <View style={styles.claimUserInfo}>
          {userProfile?.avatar_url ? (
            <Image source={{ uri: userProfile.avatar_url }} style={styles.claimAvatar} />
          ) : (
            <View style={styles.claimAvatarPlaceholder}>
              <User size={16} color="#666666" />
            </View>
          )}
          <View style={styles.claimUserDetails}>
            <View style={styles.claimUserName}>
              <Text style={styles.claimUserNameText}>
                {userProfile?.first_name} {userProfile?.last_name}
              </Text>
              {userProfile?.verified && (
                <Shield size={12} color="#27AE60" />
              )}
            </View>
            <Text style={styles.claimTime}>{getTimeAgo(claim.created_at || '')}</Text>
          </View>
        </View>
        
        <View style={styles.claimBadges}>
          <View style={[styles.claimBadge, { backgroundColor: getPriorityColor(claim.priority) }]}>
            <Text style={styles.claimBadgeText}>{claim.priority}</Text>
          </View>
          <View style={[styles.claimBadge, { backgroundColor: getStatusColor(claim.status) }]}>
            <Text style={styles.claimBadgeText}>{claim.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.claimTitle}>{claim.title}</Text>
      <Text style={styles.claimDescription}>{claim.description}</Text>
      <Text style={styles.claimCategory}>Category: {claim.category}</Text>
      
      {claim.resolution_notes && (
        <View style={styles.resolutionNotes}>
          <Text style={styles.resolutionNotesTitle}>Resolution Notes:</Text>
          <Text style={styles.resolutionNotesText}>{claim.resolution_notes}</Text>
        </View>
      )}
    </View>
  );
};

const CreateReviewModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  isLoading 
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (review: NewReview) => void;
  isLoading: boolean;
}) => {
  const [review, setReview] = useState<NewReview>({
    title: '',
    content: '',
    rating: 5,
  });

  const handleSubmit = () => {
    if (!review.title.trim() || !review.content.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    onSubmit(review);
  };

  const handleClose = () => {
    setReview({ title: '', content: '', rating: 5 });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose} disabled={isLoading}>
            <X size={24} color="#666666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Write a Review</Text>
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#5ce1e6" />
            ) : (
              <Text style={styles.submitButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.ratingSection}>
            <Text style={styles.sectionLabel}>Rating</Text>
            <StarRating 
              rating={review.rating} 
              size={32} 
              onRatingChange={(rating) => setReview(prev => ({ ...prev, rating }))}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Review Title</Text>
            <TextInput
              style={styles.titleInput}
              value={review.title}
              onChangeText={(text) => setReview(prev => ({ ...prev, title: text }))}
              placeholder="Summarize your experience"
              placeholderTextColor="#666666"
              maxLength={100}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Your Review</Text>
            <TextInput
              style={styles.contentInput}
              value={review.content}
              onChangeText={(text) => setReview(prev => ({ ...prev, content: text }))}
              placeholder="Share details about your experience..."
              placeholderTextColor="#666666"
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const CreateClaimModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  isLoading 
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (claim: NewClaim) => void;
  isLoading: boolean;
}) => {
  const [claim, setClaim] = useState<NewClaim>({
    title: '',
    description: '',
    category: 'Customer Service',
    priority: 'medium',
  });

  const categories = [
    'Customer Service',
    'Product Quality',
    'Billing',
    'Delivery',
    'Technical Support',
    'Refund Request',
    'Other',
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#27AE60' },
    { value: 'medium', label: 'Medium', color: '#F39C12' },
    { value: 'high', label: 'High', color: '#E67E22' },
    { value: 'urgent', label: 'Urgent', color: '#E74C3C' },
  ];

  const handleSubmit = () => {
    if (!claim.title.trim() || !claim.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    onSubmit(claim);
  };

  const handleClose = () => {
    setClaim({ title: '', description: '', category: 'Customer Service', priority: 'medium' });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose} disabled={isLoading}>
            <X size={24} color="#666666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Submit a Claim</Text>
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#5ce1e6" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Issue Title</Text>
            <TextInput
              style={styles.titleInput}
              value={claim.title}
              onChangeText={(text) => setClaim(prev => ({ ...prev, title: text }))}
              placeholder="Brief description of the issue"
              placeholderTextColor="#666666"
              maxLength={100}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    claim.category === category && styles.selectedCategoryChip
                  ]}
                  onPress={() => setClaim(prev => ({ ...prev, category }))}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.categoryChipText,
                    claim.category === category && styles.selectedCategoryChipText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  style={[
                    styles.priorityChip,
                    claim.priority === priority.value && styles.selectedPriorityChip,
                    { borderColor: priority.color }
                  ]}
                  onPress={() => setClaim(prev => ({ ...prev, priority: priority.value as any }))}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.priorityChipText,
                    claim.priority === priority.value && { color: priority.color }
                  ]}>
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={styles.contentInput}
              value={claim.description}
              onChangeText={(text) => setClaim(prev => ({ ...prev, description: text }))}
              placeholder="Provide detailed information about your issue..."
              placeholderTextColor="#666666"
              multiline
              numberOfLines={8}
              maxLength={2000}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

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

    setIsStartingChat(true);
    try {
      const conversation = await startLiveChatWithCompany(user.id, company.id);
      router.push(`/(tabs)/messages/${conversation.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleSubmitReview = async (reviewData: NewReview) => {
    if (!user || !company) {
      Alert.alert('Sign In Required', 'Please sign in to submit a review.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const newReview = await createCompanyReview(
        company.id,
        user.id,
        reviewData.title,
        reviewData.content,
        reviewData.rating
      );
      
      setCompany(prev => prev ? {
        ...prev,
        reviews: [newReview, ...(prev.reviews || [])]
      } : null);
      
      setShowReviewModal(false);
      Alert.alert('Success', 'Your review has been submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitClaim = async (claimData: NewClaim) => {
    if (!user || !company) {
      Alert.alert('Sign In Required', 'Please sign in to submit a claim.');
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const newClaim = await createCompanyClaim(
        company.id,
        user.id,
        claimData.title,
        claimData.description,
        claimData.category,
        claimData.priority
      );
      
      setCompany(prev => prev ? {
        ...prev,
        claims: [newClaim, ...(prev.claims || [])]
      } : null);
      
      setShowClaimModal(false);
      Alert.alert('Success', 'Your claim has been submitted successfully!');
    } catch (error) {
      console.error('Error submitting claim:', error);
      Alert.alert('Error', 'Failed to submit claim. Please try again.');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const TabButton = ({ 
    tab, 
    label, 
    count 
  }: { 
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
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
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
            <Building2 size={64} color="#666666" />
            <Text style={styles.errorTitle}>Company Not Found</Text>
            <Text style={styles.errorMessage}>
              The company you're looking for doesn't exist or has been removed.
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

  const averageRating = company.rating || 0;
  const totalReviews = company.total_reviews || 0;
  const totalClaims = company.total_claims || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
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
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction}>
              <Share size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction}>
              <Heart size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5ce1e6" />
          }
          showsVerticalScrollIndicator={false}
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
              
              <View style={styles.ratingContainer}>
                <StarRating rating={Math.round(averageRating)} size={16} />
                <Text style={styles.ratingText}>
                  {averageRating.toFixed(1)} ({totalReviews} reviews)
                </Text>
              </View>
              
              {company.address && (
                <View style={styles.locationContainer}>
                  <MapPin size={14} color="#666666" />
                  <Text style={styles.locationText}>
                    {company.address}, {company.city}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Company Description */}
          {company.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.description}>{company.description}</Text>
            </View>
          )}

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.contactGrid}>
              {company.phone && (
                <TouchableOpacity style={styles.contactItem}>
                  <Phone size={20} color="#5ce1e6" />
                  <Text style={styles.contactText}>{company.phone}</Text>
                </TouchableOpacity>
              )}
              {company.email && (
                <TouchableOpacity style={styles.contactItem}>
                  <Mail size={20} color="#5ce1e6" />
                  <Text style={styles.contactText}>{company.email}</Text>
                </TouchableOpacity>
              )}
              {company.website && (
                <TouchableOpacity style={styles.contactItem}>
                  <Globe size={20} color="#5ce1e6" />
                  <Text style={styles.contactText}>{company.website}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.primaryAction}
              onPress={handleStartChat}
              disabled={isStartingChat}
            >
              {isStartingChat ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MessageCircle size={20} color="#FFFFFF" />
              )}
              <Text style={styles.primaryActionText}>
                {isStartingChat ? 'Starting...' : 'Start Live Chat'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.secondaryActions}>
              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => setShowReviewModal(true)}
              >
                <Star size={18} color="#5ce1e6" />
                <Text style={styles.secondaryActionText}>Review</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => setShowClaimModal(true)}
              >
                <AlertTriangle size={18} color="#E67E22" />
                <Text style={styles.secondaryActionText}>Claim</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalReviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalClaims}</Text>
              <Text style={styles.statLabel}>Claims</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{company.verified ? 'Yes' : 'No'}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
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
                <View style={styles.overviewSection}>
                  <Text style={styles.overviewSectionTitle}>About {company.name}</Text>
                  <Text style={styles.overviewText}>
                    {company.description || 'No description available for this company.'}
                  </Text>
                </View>
                
                <View style={styles.overviewSection}>
                  <Text style={styles.overviewSectionTitle}>Company Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Industry</Text>
                      <Text style={styles.infoValue}>{company.industry}</Text>
                    </View>
                    {company.website && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Website</Text>
                        <Text style={styles.infoValue}>{company.website}</Text>
                      </View>
                    )}
                    {company.city && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Location</Text>
                        <Text style={styles.infoValue}>{company.city}, {company.country}</Text>
                      </View>
                    )}
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
                      <Text style={styles.emptyStateButtonText}>Write a Review</Text>
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
                    <AlertTriangle size={48} color="#666666" />
                    <Text style={styles.emptyStateTitle}>No Claims Yet</Text>
                    <Text style={styles.emptyStateMessage}>
                      No customer claims have been submitted for this company.
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyStateButton}
                      onPress={() => setShowClaimModal(true)}
                    >
                      <Text style={styles.emptyStateButtonText}>Submit a Claim</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Create Review Modal */}
        <CreateReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
          isLoading={isSubmittingReview}
        />

        {/* Create Claim Modal */}
        <CreateClaimModal
          visible={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          onSubmit={handleSubmitClaim}
          isLoading={isSubmittingClaim}
        />
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
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
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
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
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 8,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
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
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  contactGrid: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
    fontWeight: '500',
  },
  actionSection: {
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5ce1e6',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRightWidth: 1,
    borderRightColor: '#2A2A2A',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  activeTabButton: {
    borderBottomWidth: 2,
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
    backgroundColor: '#5ce1e6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  overviewContent: {
    padding: 20,
  },
  overviewSection: {
    marginBottom: 24,
  },
  overviewSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
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
    lineHeight: 24,
    marginBottom: 24,
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
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  interactiveStar: {
    padding: 2,
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
    alignItems: 'center',
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewUserDetails: {
    flex: 1,
  },
  reviewUserName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewUserNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 12,
  },
  verifiedPurchaseText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 16,
  },
  reviewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewActionText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
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
    alignItems: 'center',
    flex: 1,
  },
  claimAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  claimAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  claimUserDetails: {
    flex: 1,
  },
  claimUserName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  claimUserNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  claimTime: {
    fontSize: 11,
    color: '#666666',
    marginTop: 1,
  },
  claimBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  claimBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 8,
  },
  resolutionNotes: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resolutionNotesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5ce1e6',
    marginBottom: 4,
  },
  resolutionNotesText: {
    fontSize: 12,
    color: '#CCCCCC',
    lineHeight: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  inputSection: {
    marginBottom: 24,
  },
  titleInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  contentInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  selectedCategoryChip: {
    backgroundColor: '#5ce1e6',
    borderColor: '#5ce1e6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3A3A3A',
  },
  selectedPriorityChip: {
    backgroundColor: '#2A2A2A',
  },
  priorityChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
});