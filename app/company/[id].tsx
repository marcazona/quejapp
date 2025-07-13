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
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Star, MessageCircle, Shield, MapPin, Globe, Phone, Mail, Heart, ThumbsUp, ThumbsDown, Plus, Send, Clock, User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyById, type FullCompanyProfile, getUserPostsForCompany, createPost, likePost, type Post, getPostComments, addComment, likeComment, checkCommentLiked, type PostComment } from '@/lib/database';

interface CompanyPost {
  id: string;
  user_id: string;
  company_id: string;
  content: string;
  photo_url: string | null;
  post_type: 'qudo' | 'claim';
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    verified: boolean | null;
  };
}

const PostCard = ({ post, onLike }: { 
  post: CompanyPost; 
  onLike: (postId: string) => void;
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike(post.id);
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
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {post.user_profiles?.avatar_url ? (
              <Image source={{ uri: post.user_profiles.avatar_url }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder} />
            )}
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {post.user_profiles?.first_name} {post.user_profiles?.last_name}
            </Text>
            <Text style={styles.postTime}>{getTimeAgo(post.created_at)}</Text>
          </View>
        </View>
        
        <View style={[
          styles.postTypeBadge, 
          post.post_type === 'qudo' ? styles.qudoBadge : styles.claimBadge
        ]}>
          <Text style={styles.postTypeBadgeText}>
            {post.post_type === 'qudo' ? 'Qudo' : 'Claim'}
          </Text>
        </View>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{post.content}</Text>
      
      {/* Post Image (if any) */}
      {post.photo_url && (
        <Image source={{ uri: post.photo_url }} style={styles.postImage} />
      )}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={handleLike}
        >
          <ThumbsUp 
            size={18} 
            color={isLiked ? "#5ce1e6" : "#666666"} 
            fill={isLiked ? "#5ce1e6" : "transparent"}
          />
          <Text style={[styles.likeCount, isLiked && styles.likedText]}>
            {likesCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CommentCard = ({ comment, onLike }: { 
  comment: PostComment; 
  onLike: (commentId: string) => void;
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user has liked this comment
    const checkLiked = async () => {
      if (user) {
        try {
          const liked = await checkCommentLiked(comment.id, user.id);
          setIsLiked(liked);
        } catch (error) {
          console.error('Error checking comment like:', error);
        }
      }
    };
    
    checkLiked();
  }, [comment.id, user]);

  const handleLike = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like comments');
      return;
    }
    
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike(comment.id);
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
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          <View style={styles.commentAvatarContainer}>
            {comment.user_profiles?.avatar_url ? (
              <Image source={{ uri: comment.user_profiles.avatar_url }} style={styles.commentAvatar} />
            ) : (
              <View style={styles.commentAvatarPlaceholder}>
                <User size={14} color="#666666" />
              </View>
            )}
          </View>
          
          <View style={styles.commentUserDetails}>
            <Text style={styles.commentUserName}>
              {comment.user_profiles?.first_name} {comment.user_profiles?.last_name}
            </Text>
            <Text style={styles.commentTime}>{getTimeAgo(comment.created_at)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity 
          style={styles.commentLikeButton}
          onPress={handleLike}
        >
          <ThumbsUp 
            size={14} 
            color={isLiked ? "#5ce1e6" : "#666666"} 
            fill={isLiked ? "#5ce1e6" : "transparent"}
          />
          <Text style={[styles.commentLikeCount, isLiked && styles.commentLikedText]}>
            {likesCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CreatePostModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  companyId, 
  companyName 
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, postType: 'qudo' | 'claim') => void;
  companyId: string;
  companyName: string;
}) => {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'qudo' | 'claim'>('qudo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something to post');
      return;
    }

    setIsSubmitting(true);
    onSubmit(content, postType);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {postType === 'qudo' ? 'Share a Qudo' : 'File a Claim'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.postTypeSelector}>
            <TouchableOpacity 
              style={[styles.postTypeButton, postType === 'qudo' && styles.activePostTypeButton]}
              onPress={() => setPostType('qudo')}
            >
              <Star size={18} color={postType === 'qudo' ? "#FFFFFF" : "#FFD700"} />
              <Text style={[styles.postTypeButtonText, postType === 'qudo' && styles.activePostTypeButtonText]}>
                Qudo
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.postTypeButton, postType === 'claim' && styles.activePostTypeButton]}
              onPress={() => setPostType('claim')}
            >
              <MessageCircle size={18} color={postType === 'claim' ? "#FFFFFF" : "#FF6B6B"} />
              <Text style={[styles.postTypeButtonText, postType === 'claim' && styles.activePostTypeButtonText]}>
                Claim
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.companyLabel}>
            About: <Text style={styles.companyName}>{companyName}</Text>
          </Text>
          
          <TextInput
            style={styles.contentInput}
            placeholder={postType === 'qudo' ? "What do you like about this company?" : "What issue would you like to report?"}
            placeholderTextColor="#666666"
            multiline
            value={content}
            onChangeText={setContent}
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, !content.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function CompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [company, setCompany] = useState<FullCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<CompanyPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    loadCompany();
  }, [id]);

  useEffect(() => {
    if (company) {
      loadCompanyPosts();
    }
  }, [company]);

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

  const loadCompanyPosts = async () => {
    if (!company) return;
    
    try {
      setLoadingPosts(true);
      
      // Mock data for now - in a real app, this would fetch from the database
      const mockPosts: CompanyPost[] = [
        {
          id: '1',
          user_id: 'user1',
          company_id: company.id,
          content: 'Great customer service! They resolved my issue quickly and professionally.',
          photo_url: null,
          post_type: 'qudo',
          likes_count: 12,
          comments_count: 3,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          user_profiles: {
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
            verified: true,
          },
        },
        {
          id: '2',
          user_id: 'user2',
          company_id: company.id,
          content: 'I had an issue with my recent purchase. The product arrived damaged and customer support has been unresponsive for days.',
          photo_url: 'https://images.pexels.com/photos/4068314/pexels-photo-4068314.jpeg?auto=compress&cs=tinysrgb&w=600',
          post_type: 'claim',
          likes_count: 8,
          comments_count: 5,
          created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
          user_profiles: {
            first_name: 'Jane',
            last_name: 'Smith',
            avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
            verified: false,
          },
        },
        {
          id: '3',
          user_id: 'user3',
          company_id: company.id,
          content: 'Absolutely love their products! The quality is outstanding and worth every penny.',
          photo_url: null,
          post_type: 'qudo',
          likes_count: 24,
          comments_count: 2,
          created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
          user_profiles: {
            first_name: 'Michael',
            last_name: 'Johnson',
            avatar_url: null,
            verified: true,
          },
        },
      ];
      
      setPosts(mockPosts);
    } catch (error: any) {
      console.error('Error loading company posts:', error);
    } finally {
      setLoadingPosts(false);
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

  const handleViewComments = async (postId: string) => {
    try {
      setLoadingComments(true);
      setShowComments(postId);
      
      const postComments = await getPostComments(postId);
      setComments(postComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !showComments || !newComment.trim()) return;
    
    try {
      const comment = await addComment(showComments, user.id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like comments');
      return;
    }
    
    try {
      await likeComment(commentId, user.id);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleLikePost = (postId: string) => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to like posts',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/signin') }
        ]
      );
      return;
    }

    // TODO: Implement actual like functionality with the database
    console.log('Liked post:', postId);
  };
  
  const handleCreatePost = (content: string, postType: 'qudo' | 'claim') => {
    if (!user || !company) return;
    
    // Create a new post
    const newPost: CompanyPost = {
      id: Date.now().toString(),
      user_id: user.id,
      company_id: company.id,
      content,
      photo_url: null,
      post_type: postType,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      user_profiles: user,
    };

    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
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

          {/* Posts Feed */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Feed</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {loadingPosts ? (
              <ActivityIndicator size="large" color="#5ce1e6" style={styles.loadingIndicator} />
            ) : posts.length > 0 ? (
              posts.map(post => (
                <View key={post.id}>
                  <PostCard 
                    post={post} 
                    onLike={handleLikePost} 
                  />
                  <View style={styles.postActions}>
                    <TouchableOpacity 
                      style={styles.likeButton}
                      onPress={() => handleLikePost(post.id)}
                    >
                      <ThumbsUp 
                        size={18} 
                        color="#666666" 
                        fill="transparent"
                      />
                      <Text style={styles.likeCount}>
                        {post.likes_count}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.commentButton}
                      onPress={() => handleViewComments(post.id)}
                    >
                      <MessageCircle size={18} color="#666666" />
                      <Text style={styles.commentCount}>{post.comments_count || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyFeed}>
                <Text style={styles.emptyFeedText}>No posts yet</Text>
                <Text style={styles.emptyFeedSubtext}>Be the first to share your experience</Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => setShowCreatePost(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Create Post Modal */}
        <CreatePostModal
          visible={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
          companyId={company.id}
          companyName={company.name}
        />
        
        {/* Comments Modal */}
        <Modal
          visible={!!showComments}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowComments(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.commentsModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comments</Text>
                <TouchableOpacity onPress={() => setShowComments(null)}>
                  <Text style={styles.closeButton}>Close</Text>
                </TouchableOpacity>
              </View>
              
              {loadingComments ? (
                <ActivityIndicator size="large" color="#5ce1e6" style={styles.loadingIndicator} />
              ) : (
                <ScrollView style={styles.commentsList}>
                  {comments.length > 0 ? (
                    comments.map(comment => (
                      <CommentCard 
                        key={comment.id} 
                        comment={comment} 
                        onLike={handleLikeComment} 
                      />
                    ))
                  ) : (
                    <View style={styles.emptyComments}>
                      <Text style={styles.emptyCommentsText}>No comments yet</Text>
                      <Text style={styles.emptyCommentsSubtext}>Be the first to comment</Text>
                    </View>
                  )}
                </ScrollView>
              )}
              
              {/* Comment Input */}
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#666666"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Send size={20} color={newComment.trim() ? "#5ce1e6" : "#666666"} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        />
        
        {/* Comments Modal */}
        <Modal
          visible={!!showComments}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowComments(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.commentsModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comments</Text>
                <TouchableOpacity onPress={() => setShowComments(null)}>
                  <Text style={styles.closeButton}>Close</Text>
                </TouchableOpacity>
              </View>
              
              {loadingComments ? (
                <ActivityIndicator size="large" color="#5ce1e6" style={styles.loadingIndicator} />
              ) : (
                <ScrollView style={styles.commentsList}>
                  {comments.length > 0 ? (
                    comments.map(comment => (
                      <CommentCard 
                        key={comment.id} 
                        comment={comment} 
                        onLike={handleLikeComment} 
                      />
                    ))
                  ) : (
                    <View style={styles.emptyComments}>
                      <Text style={styles.emptyCommentsText}>No comments yet</Text>
                      <Text style={styles.emptyCommentsSubtext}>Be the first to comment</Text>
                    </View>
                  )}
                </ScrollView>
              )}
              
              {/* Comment Input */}
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#666666"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Send size={20} color={newComment.trim() ? "#5ce1e6" : "#666666"} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
    marginTop: -20,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
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
  postCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  userDetails: {
    flex: 1,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
  },
  postTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    minWidth: 60,
    alignItems: 'center',
  },
  qudoBadge: {
    backgroundColor: '#27AE60',
  },
  claimBadge: {
    backgroundColor: '#E74C3C',
  },
  postTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  postContent: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#2A2A2A',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  likeCount: {
    fontSize: 14,
    color: '#666666',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    marginLeft: 16,
  },
  commentCount: {
    fontSize: 14,
    color: '#666666',
  },
  likedText: {
    color: '#5ce1e6',
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5ce1e6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  emptyFeed: {
    alignItems: 'center',
    padding: 40,
  },
  emptyFeedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyFeedSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    textAlign: 'center',
  },
  loadingIndicator: {
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 16,
    color: '#5ce1e6',
    fontWeight: '600',
  },
  postTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#2A2A2A',
  },
  activePostTypeButton: {
    backgroundColor: '#5ce1e6',
    borderColor: '#5ce1e6',
  },
  postTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activePostTypeButtonText: {
    color: '#FFFFFF',
  },
  companyLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 12,
  },
  contentInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#5ce1e6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Comments styles
  commentsModalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    display: 'flex',
    flexDirection: 'column',
  },
  commentsList: {
    flex: 1,
    marginBottom: 16,
  },
  commentCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatarContainer: {
    marginRight: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
  },
  commentContent: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  commentLikeCount: {
    fontSize: 12,
    color: '#666666',
  },
  commentLikedText: {
    color: '#5ce1e6',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 8,
  },
  commentInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#666666',
    color: '#FFFFFF',
  },
  // Comments styles
  commentsModalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    display: 'flex',
    flexDirection: 'column',
  },
  commentsList: {
    flex: 1,
    marginBottom: 16,
  },
  commentCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatarContainer: {
    marginRight: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
  },
  commentContent: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  commentLikeCount: {
    fontSize: 12,
    color: '#666666',
  },
  commentLikedText: {
    color: '#5ce1e6',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 8,
  },
  commentInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#666666',
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