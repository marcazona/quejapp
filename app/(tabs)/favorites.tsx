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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Heart, MessageCircle, Share, MoveHorizontal as MoreHorizontal, Camera, Video, Type, Plus, Send, X, Smile, MapPin, Clock, Shield, Zap, User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { calculateAge } from '@/lib/database';

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  user_id: string;
  content: string;
  photo_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user_profiles: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    verified: boolean | null;
  };
  user_photos?: Array<{
    photo_url: string;
    is_primary: boolean | null;
  }>;
}

const PostCard = ({ post, onLike, onComment, onShare }: { 
  post: Post; 
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}) => {
  const [showOptions, setShowOptions] = useState(false);
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

  const userProfile = post.user_profiles;
  const primaryPhoto = post.user_photos?.find(p => p.is_primary);
  const avatarUrl = userProfile.avatar_url || primaryPhoto?.photo_url;

  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <User size={24} color="#666666" />
              </View>
            )}
            {userProfile.verified && (
              <View style={styles.verifiedBadge}>
                <Shield size={12} color="#FFFFFF" />
              </View>
            )}
          </View>
          
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>
                {userProfile.first_name} {userProfile.last_name}
              </Text>
            </View>
            
            <View style={styles.timestampRow}>
              <Clock size={12} color="#666666" />
              <Text style={styles.timestamp}>{getTimeAgo(post.created_at)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={() => setShowOptions(true)}
        >
          <MoreHorizontal size={20} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      {post.content && (
        <Text style={styles.postContent}>{post.content}</Text>
      )}

      {/* Post Media */}
      {post.photo_url && (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: post.photo_url }} style={styles.postImage} />
        </View>
      )}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLike}
        >
          <Heart 
            size={20} 
            color={isLiked ? "#E74C3C" : "#666666"} 
            fill={isLiked ? "#E74C3C" : "transparent"}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onComment(post.id)}
        >
          <MessageCircle size={20} color="#666666" />
          <Text style={styles.actionText}>{post.comments_count || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onShare(post.id)}
        >
          <Share size={20} color="#666666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CreatePostModal = ({ visible, onClose, onPost }: {
  visible: boolean;
  onClose: () => void;
  onPost: (content: string, mediaType?: 'image' | 'video') => void;
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | null>(null);

  const handlePost = () => {
    if (content.trim() || selectedMediaType) {
      onPost(content.trim(), selectedMediaType || undefined);
      setContent('');
      setSelectedMediaType(null);
      onClose();
    }
  };

  const handleClose = () => {
    setContent('');
    setSelectedMediaType(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose}>
            <X size={24} color="#666666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Post</Text>
          <TouchableOpacity 
            style={[styles.postButton, (!content.trim() && !selectedMediaType) && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={!content.trim() && !selectedMediaType}
          >
            <Text style={[styles.postButtonText, (!content.trim() && !selectedMediaType) && styles.postButtonTextDisabled]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.createPostHeader}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.currentUserAvatar} />
            ) : (
              <View style={styles.currentUserAvatarPlaceholder}>
                <User size={24} color="#666666" />
              </View>
            )}
            <View style={styles.createPostInfo}>
              <Text style={styles.currentUserName}>
                {user?.first_name} {user?.last_name}
              </Text>
              <Text style={styles.postVisibility}>Public post</Text>
            </View>
          </View>

          <TextInput
            style={styles.contentInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#666666"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
            textAlignVertical="top"
            autoCorrect={false}
            autoCapitalize="sentences"
            blurOnSubmit={false}
          />

          {selectedMediaType && (
            <View style={styles.selectedMediaContainer}>
              <View style={styles.selectedMediaPlaceholder}>
                {selectedMediaType === 'image' ? (
                  <Camera size={48} color="#666666" />
                ) : (
                  <Video size={48} color="#666666" />
                )}
                <Text style={styles.selectedMediaText}>
                  {selectedMediaType === 'image' ? 'Photo selected' : 'Video selected'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.removeMediaButton}
                onPress={() => setSelectedMediaType(null)}
              >
                <X size={16} color="#666666" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.mediaOptions}>
            <TouchableOpacity 
              style={[styles.mediaOption, selectedMediaType === 'image' && styles.selectedMediaOption]}
              onPress={() => setSelectedMediaType(selectedMediaType === 'image' ? null : 'image')}
            >
              <Camera size={24} color={selectedMediaType === 'image' ? "#5ce1e6" : "#666666"} />
              <Text style={[styles.mediaOptionText, selectedMediaType === 'image' && styles.selectedMediaOptionText]}>
                Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mediaOption, selectedMediaType === 'video' && styles.selectedMediaOption]}
              onPress={() => setSelectedMediaType(selectedMediaType === 'video' ? null : 'video')}
            >
              <Video size={24} color={selectedMediaType === 'video' ? "#5ce1e6" : "#666666"} />
              <Text style={[styles.mediaOptionText, selectedMediaType === 'video' && styles.selectedMediaOptionText]}>
                Video
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // For now, return empty posts since we're focusing on companies
      setPosts([]);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      setError(error.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user]);

  const handleLike = (postId: string) => {
    console.log('Like post:', postId);
    // TODO: Implement like functionality with database
  };

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId);
    // TODO: Navigate to comments or open comment modal
  };

  const handleShare = (postId: string) => {
    console.log('Share post:', postId);
    // TODO: Handle share functionality
  };

  const handleCreatePost = (content: string, mediaType?: 'image' | 'video') => {
    console.log('Create post:', { content, mediaType });
    // TODO: Implement post creation with database
    // For now, just close the modal
    setShowCreatePost(false);
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
                <Text style={styles.headerTitle}>Feed</Text>
                <Text style={styles.headerSubtitle}>See what's happening</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setShowCreatePost(true)}
              >
                <Plus size={20} color="#0A0A0A" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5ce1e6" />
          <Text style={styles.loadingText}>Loading posts...</Text>
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
                <Text style={styles.headerTitle}>Feed</Text>
                <Text style={styles.headerSubtitle}>See what's happening</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setShowCreatePost(true)}
              >
                <Plus size={20} color="#0A0A0A" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPosts()}>
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
              <Text style={styles.headerTitle}>Feed</Text>
              <Text style={styles.headerSubtitle}>See what's happening</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowCreatePost(true)}
            >
              <Plus size={20} color="#0A0A0A" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Feed */}
      {posts.length > 0 ? (
        <ScrollView 
          style={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContent}
        >
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color="#666666" />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyMessage}>
            Be the first to share something amazing with the community!
          </Text>
          <TouchableOpacity style={styles.createFirstPostButton} onPress={() => setShowCreatePost(true)}>
            <Text style={styles.createFirstPostButtonText}>Create Your First Post</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPost={handleCreatePost}
      />
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
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#5ce1e6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5ce1e6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  createFirstPostButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  createFirstPostButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  feedContainer: {
    flex: 1,
  },
  feedContent: {
    paddingVertical: 8,
  },
  postCard: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3A3A3A',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#27AE60',
    borderRadius: 10,
    padding: 4,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
  },
  optionsButton: {
    padding: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mediaContainer: {
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#2A2A2A',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  likedText: {
    color: '#E74C3C',
  },
  // Modal styles
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
  postButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  postButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postButtonTextDisabled: {
    color: '#666666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  createPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  currentUserAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createPostInfo: {
    flex: 1,
  },
  currentUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  postVisibility: {
    fontSize: 12,
    color: '#666666',
  },
  contentInput: {
    fontSize: 18,
    color: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  selectedMediaContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    position: 'relative',
  },
  selectedMediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  selectedMediaText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 4,
  },
  mediaOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMediaOption: {
    borderColor: '#5ce1e6',
    backgroundColor: '#1A2A2A',
  },
  mediaOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  selectedMediaOptionText: {
    color: '#5ce1e6',
  },
});