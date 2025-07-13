import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Heart, MessageCircle, ArrowLeft, Star } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Company {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  industry: string;
  rating: number;
  total_reviews: number;
  verified: boolean;
}

interface CompanyPost {
  id: string;
  content: string;
  photo_url: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  user_profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

const PostCard = ({ 
  post, 
  onLike, 
  onComment 
}: { 
  post: CompanyPost; 
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}) => {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image 
          source={{ uri: post.user_profiles?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' }} 
          style={styles.userAvatar} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {post.user_profiles?.first_name} {post.user_profiles?.last_name}
          </Text>
          <Text style={styles.postDate}>
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.postContent}>{post.content}</Text>
      
      {post.photo_url && (
        <Image source={{ uri: post.photo_url }} style={styles.postImage} />
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.likeButton} onPress={() => onLike(post.id)}>
          <Heart size={18} color="#666666" />
          <Text style={styles.likeCount}>{post.likes_count || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.commentButton} onPress={() => onComment(post.id)}>
          <MessageCircle size={18} color="#666666" />
          <Text style={styles.commentCount}>{post.comments_count || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CompanyScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [posts, setPosts] = useState<CompanyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (id) {
      fetchCompanyData();
      fetchPosts();
    }
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company:', error);
      Alert.alert('Error', 'Failed to load company information');
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('company_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
      }

      // Refresh posts to update like count
      fetchPosts();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleViewComments = async (postId: string) => {
    try {
      setLoadingComments(true);
      setShowComments(postId);

      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !showComments) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: showComments,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      handleViewComments(showComments);
      fetchPosts(); // Refresh to update comment count
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Company not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{company.name}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.companyInfo}>
          <Image 
            source={{ uri: company.logo_url || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg' }} 
            style={styles.companyLogo} 
          />
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyIndustry}>{company.industry}</Text>
          
          {company.description && (
            <Text style={styles.companyDescription}>{company.description}</Text>
          )}
          
          <View style={styles.ratingContainer}>
            <Star size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.rating}>{company.rating?.toFixed(1) || 'N/A'}</Text>
            <Text style={styles.reviewCount}>({company.total_reviews} reviews)</Text>
          </View>
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {posts.length === 0 ? (
            <Text style={styles.noPostsText}>No posts yet</Text>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={handleViewComments}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showComments !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setShowComments(null)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          {loadingComments ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.modalLoading} />
          ) : (
            <ScrollView style={styles.commentsContainer}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <Image 
                    source={{ uri: comment.user_profiles?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' }} 
                    style={styles.commentAvatar} 
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentAuthor}>
                      {comment.user_profiles?.first_name} {comment.user_profiles?.last_name}
                    </Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                    <Text style={styles.commentDate}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {user && (
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Text style={styles.submitButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  backIcon: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  companyInfo: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyIndustry: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  companyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  postsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noPostsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  likeCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalLoading: {
    marginTop: 50,
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  commentCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  addCommentContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});