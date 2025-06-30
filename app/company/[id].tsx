import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MapPin, Phone, Mail, Globe, MessageCircle, Star, Shield, Clock, User, Heart, Send, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { getCompanyById, startLiveChatWithCompany, type FullCompanyProfile, type CompanyReview, type CompanyClaim } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  createdAt: string;
  isVerified: boolean;
  reactions: number;
  hasReacted: boolean;
  replies?: Comment[];
}

interface PostReactions {
  [postId: string]: {
    count: number;
    hasReacted: boolean;
  };
}

interface CommentReactions {
  [commentId: string]: {
    count: number;
    hasReacted: boolean;
  };
}

const mockUsers = [
  {
    id: 'user1',
    name: 'Sarah Johnson',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    verified: true,
  },
  {
    id: 'user2',
    name: 'Mike Chen',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    verified: false,
  },
  {
    id: 'user3',
    name: 'Emma Davis',
    avatar: 'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    verified: true,
  },
  {
    id: 'user4',
    name: 'Alex Rodriguez',
    avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    verified: false,
  },
];

const generateMockComments = (postId: string): Comment[] => {
  const comments: Comment[] = [
    {
      id: `${postId}_comment_1`,
      userId: 'user1',
      userName: 'Sarah Johnson',
      userAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
      content: 'This is really helpful, thank you for sharing!',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isVerified: true,
      reactions: 5,
      hasReacted: false,
      replies: [
        {
          id: `${postId}_reply_1`,
          userId: 'user2',
          userName: 'Mike Chen',
          userAvatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          content: '@Sarah Johnson Totally agree! Great insights.',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          isVerified: false,
          reactions: 2,
          hasReacted: true,
        },
      ],
    },
    {
      id: `${postId}_comment_2`,
      userId: 'user3',
      userName: 'Emma Davis',
      userAvatar: 'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
      content: 'I had a similar experience. Thanks for posting this!',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      isVerified: true,
      reactions: 8,
      hasReacted: false,
    },
    {
      id: `${postId}_comment_3`,
      userId: 'user4',
      userName: 'Alex Rodriguez',
      userAvatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
      content: 'Very informative post. Keep up the good work!',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      isVerified: false,
      reactions: 3,
      hasReacted: true,
    },
  ];

  return comments;
};

const CommentItem = ({ 
  comment, 
  isReply = false, 
  onReact, 
  onReply 
}: { 
  comment: Comment; 
  isReply?: boolean;
  onReact: (commentId: string) => void;
  onReply: (commentId: string, userName: string) => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleReact = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onReact(comment.id);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.commentItem, isReply && styles.replyItem]}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          {comment.userAvatar ? (
            <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatar} />
          ) : (
            <View style={styles.commentAvatarPlaceholder}>
              <User size={16} color="#666666" />
            </View>
          )}
          <View style={styles.commentUserDetails}>
            <View style={styles.commentUserNameRow}>
              <Text style={styles.commentUserName}>{comment.userName}</Text>
              {comment.isVerified && (
                <Shield size={12} color="#5ce1e6" />
              )}
              <Text style={styles.commentTime}>{getTimeAgo(comment.createdAt)}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <Text style={styles.commentContent}>{comment.content}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentReactButton} onPress={handleReact}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Heart 
              size={14} 
              color={comment.hasReacted ? "#5ce1e6" : "#666666"} 
              fill={comment.hasReacted ? "#5ce1e6" : "transparent"}
            />
          </Animated.View>
          {comment.reactions > 0 && (
            <Text style={[styles.commentReactCount, comment.hasReacted && styles.commentReactCountActive]}>
              {comment.reactions}
            </Text>
          )}
        </TouchableOpacity>
        
        {!isReply && (
          <TouchableOpacity 
            style={styles.commentReplyButton}
            onPress={() => onReply(comment.id, comment.userName)}
          >
            <Text style={styles.commentReplyText}>Reply</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply={true}
              onReact={onReact}
              onReply={onReply}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const CommentsSection = ({ 
  postId, 
  postType 
}: { 
  postId: string; 
  postType: 'review' | 'claim';
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; userName: string } | null>(null);
  const [commentReactions, setCommentReactions] = useState<CommentReactions>({});

  useEffect(() => {
    // Load mock comments
    const mockComments = generateMockComments(postId);
    setComments(mockComments);
    
    // Initialize comment reactions
    const initialReactions: CommentReactions = {};
    mockComments.forEach(comment => {
      initialReactions[comment.id] = {
        count: comment.reactions,
        hasReacted: comment.hasReacted,
      };
      if (comment.replies) {
        comment.replies.forEach(reply => {
          initialReactions[reply.id] = {
            count: reply.reactions,
            hasReacted: reply.hasReacted,
          };
        });
      }
    });
    setCommentReactions(initialReactions);
  }, [postId]);

  const handleCommentReact = (commentId: string) => {
    setCommentReactions(prev => {
      const current = prev[commentId] || { count: 0, hasReacted: false };
      return {
        ...prev,
        [commentId]: {
          count: current.hasReacted ? current.count - 1 : current.count + 1,
          hasReacted: !current.hasReacted,
        },
      };
    });

    // Update the comment in the comments array
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          reactions: commentReactions[commentId]?.hasReacted 
            ? comment.reactions - 1 
            : comment.reactions + 1,
          hasReacted: !commentReactions[commentId]?.hasReacted,
        };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(reply => {
            if (reply.id === commentId) {
              return {
                ...reply,
                reactions: commentReactions[commentId]?.hasReacted 
                  ? reply.reactions - 1 
                  : reply.reactions + 1,
                hasReacted: !commentReactions[commentId]?.hasReacted,
              };
            }
            return reply;
          }),
        };
      }
      return comment;
    }));
  };

  const handleReply = (commentId: string, userName: string) => {
    setReplyingTo({ id: commentId, userName });
    setNewComment(`@${userName} `);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user) return;

    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    
    const newCommentObj: Comment = {
      id: `comment_${Date.now()}`,
      userId: user.id,
      userName: `${user.first_name} ${user.last_name}`,
      userAvatar: user.avatar_url,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      isVerified: user.verified || false,
      reactions: 0,
      hasReacted: false,
    };

    if (replyingTo) {
      // Add as reply
      setComments(prev => prev.map(comment => {
        if (comment.id === replyingTo.id) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newCommentObj],
          };
        }
        return comment;
      }));
      setReplyingTo(null);
    } else {
      // Add as new comment
      setComments(prev => [newCommentObj, ...prev]);
    }

    setNewComment('');
  };

  const totalComments = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);

  return (
    <View style={styles.commentsSection}>
      <Text style={styles.commentsSectionTitle}>
        Comments ({totalComments})
      </Text>
      
      {user && (
        <View style={styles.commentInputContainer}>
          <View style={styles.commentInputRow}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.commentInputAvatar} />
            ) : (
              <View style={styles.commentInputAvatarPlaceholder}>
                <User size={16} color="#666666" />
              </View>
            )}
            <View style={styles.commentInputWrapper}>
              {replyingTo && (
                <View style={styles.replyingToIndicator}>
                  <Text style={styles.replyingToText}>
                    Replying to @{replyingTo.userName}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setReplyingTo(null);
                    setNewComment('');
                  }}>
                    <X size={14} color="#666666" />
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#666666"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity 
              style={[styles.commentSubmitButton, !newComment.trim() && styles.commentSubmitButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim()}
            >
              <Send size={16} color={newComment.trim() ? "#5ce1e6" : "#666666"} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <View style={styles.commentsList}>
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReact={handleCommentReact}
            onReply={handleReply}
          />
        ))}
      </View>
    </View>
  );
};

const PostCard = ({ 
  post, 
  type, 
  onReact 
}: { 
  post: CompanyReview | CompanyClaim; 
  type: 'review' | 'claim';
  onReact: (postId: string) => void;
}) => {
  const [showComments, setShowComments] = useState(false);
  const [postReactions, setPostReactions] = useState<PostReactions>({});
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initialize reactions from localStorage or default values
    const savedReactions = Platform.OS === 'web' 
      ? localStorage.getItem(`post_reactions_${post.id}`)
      : null;
    
    if (savedReactions) {
      const parsed = JSON.parse(savedReactions);
      setPostReactions({ [post.id]: parsed });
    } else {
      setPostReactions({
        [post.id]: {
          count: Math.floor(Math.random() * 50) + 10, // Random initial count
          hasReacted: false,
        }
      });
    }
  }, [post.id]);

  const handleReact = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setPostReactions(prev => {
      const current = prev[post.id] || { count: 0, hasReacted: false };
      const newReaction = {
        count: current.hasReacted ? current.count - 1 : current.count + 1,
        hasReacted: !current.hasReacted,
      };

      // Save to localStorage
      if (Platform.OS === 'web') {
        localStorage.setItem(`post_reactions_${post.id}`, JSON.stringify(newReaction));
      }

      return {
        ...prev,
        [post.id]: newReaction,
      };
    });

    onReact(post.id);
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
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
      case 'resolved':
        return '#27AE60';
      case 'in_progress':
        return '#F39C12';
      case 'pending':
        return '#E67E22';
      case 'rejected':
        return '#E74C3C';
      default:
        return '#666666';
    }
  };

  const userProfile = post.user_profiles;
  const currentReaction = postReactions[post.id] || { count: 0, hasReacted: false };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          {userProfile?.avatar_url ? (
            <Image source={{ uri: userProfile.avatar_url }} style={styles.postAvatar} />
          ) : (
            <View style={styles.postAvatarPlaceholder}>
              <User size={20} color="#666666" />
            </View>
          )}
          <View style={styles.postUserDetails}>
            <View style={styles.postUserNameRow}>
              <Text style={styles.postUserName}>
                {userProfile?.first_name} {userProfile?.last_name}
              </Text>
              {userProfile?.verified && (
                <Shield size={14} color="#5ce1e6" />
              )}
            </View>
            <Text style={styles.postTime}>{getTimeAgo(post.created_at)}</Text>
          </View>
        </View>
        
        {type === 'claim' && 'status' in post && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(post.status) }]}>
            <Text style={styles.statusText}>{post.status.replace('_', ' ')}</Text>
          </View>
        )}
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent}>{post.content}</Text>

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postReactButton} onPress={handleReact}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Heart 
              size={20} 
              color={currentReaction.hasReacted ? "#5ce1e6" : "#666666"} 
              fill={currentReaction.hasReacted ? "#5ce1e6" : "transparent"}
            />
          </Animated.View>
          <Text style={[styles.postReactCount, currentReaction.hasReacted && styles.postReactCountActive]}>
            {currentReaction.count} likes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.postCommentsButton}
          onPress={() => setShowComments(!showComments)}
        >
          <MessageCircle size={20} color="#666666" />
          <Text style={styles.postCommentsText}>Comments</Text>
          {showComments ? (
            <ChevronUp size={16} color="#666666" />
          ) : (
            <ChevronDown size={16} color="#666666" />
          )}
        </TouchableOpacity>
      </View>

      {showComments && (
        <CommentsSection postId={post.id} postType={type} />
      )}
    </View>
  );
};

export default function CompanyProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [company, setCompany] = useState<FullCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'qdles' | 'claims'>('about');
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
  }, [id]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const companyData = await getCompanyById(id!);
      if (companyData) {
        setCompany(companyData);
      } else {
        setError('Company not found');
      }
    } catch (error: any) {
      console.error('Error loading company:', error);
      setError(error.message || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user || !company) {
      Alert.alert('Sign In Required', 'Please sign in to start a chat with this company.');
      return;
    }

    try {
      const conversation = await startLiveChatWithCompany(user.id, company.id);
      setShowChatModal(false);
      router.push(`/(tabs)/messages/${conversation.id}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start chat');
    }
  };

  const handlePostReact = (postId: string) => {
    console.log('Post reacted:', postId);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5ce1e6" />
            <Text style={styles.loadingText}>Loading company...</Text>
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
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Company Not Found</Text>
            <Text style={styles.errorMessage}>{error || 'The company you\'re looking for doesn\'t exist.'}</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Company Header */}
          <View style={styles.companyHeader}>
            {company.cover_image_url && (
              <Image source={{ uri: company.cover_image_url }} style={styles.coverImage} />
            )}
            
            <View style={styles.companyInfo}>
              <View style={styles.companyLogoContainer}>
                {company.logo_url ? (
                  <Image source={{ uri: company.logo_url }} style={styles.companyLogo} />
                ) : (
                  <View style={styles.companyLogoPlaceholder}>
                    <Text style={styles.companyLogoText}>{company.name.charAt(0)}</Text>
                  </View>
                )}
                {company.verified && (
                  <View style={styles.verifiedBadge}>
                    <Shield size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
              
              <View style={styles.companyDetails}>
                <Text style={styles.companyName}>{company.name}</Text>
                <Text style={styles.companyIndustry}>{company.industry}</Text>
                
                <View style={styles.companyStats}>
                  <View style={styles.statItem}>
                    <Star size={16} color="#F39C12" fill="#F39C12" />
                    <Text style={styles.statText}>
                      {company.rating ? company.rating.toFixed(1) : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statText}>
                      {company.total_reviews || 0} reviews
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statText}>
                      {company.total_claims || 0} claims
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => setShowChatModal(true)}
            >
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.chatButtonText}>Live Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'about' && styles.activeTab]}
              onPress={() => setActiveTab('about')}
            >
              <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
                About
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'qdles' && styles.activeTab]}
              onPress={() => setActiveTab('qdles')}
            >
              <Text style={[styles.tabText, activeTab === 'qdles' && styles.activeTabText]}>
                Qdles ({company.reviews?.length || 0})
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
            {activeTab === 'about' && (
              <View style={styles.aboutSection}>
                <Text style={styles.aboutDescription}>{company.description}</Text>
                
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
                  {(company.address || company.city) && (
                    <View style={styles.contactItem}>
                      <MapPin size={20} color="#5ce1e6" />
                      <Text style={styles.contactText}>
                        {[company.address, company.city, company.country].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {activeTab === 'qdles' && (
              <View style={styles.postsSection}>
                {company.reviews && company.reviews.length > 0 ? (
                  company.reviews.map((review) => (
                    <PostCard
                      key={review.id}
                      post={review}
                      type="review"
                      onReact={handlePostReact}
                    />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Star size={48} color="#3A3A3A" />
                    <Text style={styles.emptyStateTitle}>No Qdles Yet</Text>
                    <Text style={styles.emptyStateText}>
                      Be the first to share your positive experience with this company!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'claims' && (
              <View style={styles.postsSection}>
                {company.claims && company.claims.length > 0 ? (
                  company.claims.map((claim) => (
                    <PostCard
                      key={claim.id}
                      post={claim}
                      type="claim"
                      onReact={handlePostReact}
                    />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <MessageCircle size={48} color="#3A3A3A" />
                    <Text style={styles.emptyStateTitle}>No Claims Yet</Text>
                    <Text style={styles.emptyStateText}>
                      No customer claims have been submitted for this company.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Chat Confirmation Modal */}
        <Modal
          visible={showChatModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowChatModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowChatModal(false)}>
                <X size={24} color="#666666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Start Live Chat</Text>
              <View style={styles.modalSpacer} />
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.chatPreview}>
                {company.logo_url ? (
                  <Image source={{ uri: company.logo_url }} style={styles.chatPreviewLogo} />
                ) : (
                  <View style={styles.chatPreviewLogoPlaceholder}>
                    <Text style={styles.chatPreviewLogoText}>{company.name.charAt(0)}</Text>
                  </View>
                )}
                <Text style={styles.chatPreviewTitle}>Chat with {company.name}</Text>
                <Text style={styles.chatPreviewDescription}>
                  Start a live conversation with {company.name}'s support team. 
                  They typically respond within a few minutes.
                </Text>
              </View>
              
              <TouchableOpacity style={styles.startChatButton} onPress={handleStartChat}>
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.startChatButtonText}>Start Chat</Text>
              </TouchableOpacity>
            </View>
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
  headerBackButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
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
  backButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  companyHeader: {
    backgroundColor: '#1A1A1A',
    marginBottom: 20,
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#2A2A2A',
  },
  companyInfo: {
    padding: 20,
  },
  companyLogoContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#2A2A2A',
  },
  companyLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3A3A3A',
  },
  companyLogoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  companyIndustry: {
    fontSize: 16,
    color: '#5ce1e6',
    marginBottom: 16,
    fontWeight: '500',
  },
  companyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chatButton: {
    backgroundColor: '#5ce1e6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#5ce1e6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2A2A2A',
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  aboutSection: {
    gap: 24,
  },
  aboutDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  contactInfo: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  postsSection: {
    gap: 16,
  },
  postCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postUserDetails: {
    flex: 1,
  },
  postUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  postReactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postReactCount: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  postReactCountActive: {
    color: '#5ce1e6',
  },
  postCommentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postCommentsText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
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
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
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
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalSpacer: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  chatPreview: {
    alignItems: 'center',
    marginBottom: 40,
  },
  chatPreviewLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 20,
  },
  chatPreviewLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  chatPreviewLogoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chatPreviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  chatPreviewDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
  startChatButton: {
    backgroundColor: '#5ce1e6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  startChatButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  // Comments Section Styles
  commentsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  commentInputContainer: {
    marginBottom: 20,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInputAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInputWrapper: {
    flex: 1,
  },
  replyingToIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#5ce1e6',
    fontWeight: '500',
  },
  commentInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 40,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  commentSubmitButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitButtonDisabled: {
    opacity: 0.5,
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
  },
  replyItem: {
    marginLeft: 20,
    marginTop: 12,
    backgroundColor: '#1A1A1A',
  },
  commentHeader: {
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  commentReactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentReactCount: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  commentReactCountActive: {
    color: '#5ce1e6',
  },
  commentReplyButton: {
    paddingVertical: 2,
  },
  commentReplyText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
  },
});