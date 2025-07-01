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
  Modal,
  Alert,
  Animated,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Star, Shield, MessageCircle, Phone, Mail, Globe, MapPin, Building2, User, Plus, X, TriangleAlert as AlertTriangle, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Heart, Send, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyById, startLiveChatWithCompany, type FullCompanyProfile, type CompanyReview, type CompanyClaim } from '@/lib/database';

const { width } = Dimensions.get('window');

interface LiveMoodData {
  totalVotes: number;
  positiveVotes: number;
  negativeVotes: number;
  userVote: 'positive' | 'negative' | null;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface ReactionData {
  count: number;
  userReacted: boolean;
}

interface Comment {
  id: string;
  postId: string;
  postType: 'review' | 'claim';
  userId: string;
  content: string;
  parentId?: string;
  reactions: ReactionData;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    verified: boolean;
  };
  replies?: Comment[];
}

const LiveMoodSection = ({ companyId, companyName }: { companyId: string; companyName: string }) => {
  const { user } = useAuth();
  const [moodData, setMoodData] = useState<LiveMoodData>({
    totalVotes: 247,
    positiveVotes: 156,
    negativeVotes: 91,
    userVote: null,
    trend: 'up',
    lastUpdated: new Date().toISOString(),
  });
  const [isVoting, setIsVoting] = useState(false);

  // Load user's existing vote when component mounts
  useEffect(() => {
    loadUserVote();
  }, [companyId, user]);

  const loadUserVote = async () => {
    if (!user) return;
    
    try {
      // Check localStorage for user's vote on this company
      const storageKey = `livemood_vote_${companyId}_${user.id}`;
      let existingVote: string | null = null;
      
      if (Platform.OS === 'web') {
        existingVote = localStorage.getItem(storageKey);
      } else {
        existingVote = await AsyncStorage.getItem(storageKey);
      }
      
      if (existingVote) {
        const voteData = JSON.parse(existingVote);
        setMoodData(prev => ({
          ...prev,
          userVote: voteData.vote,
        }));
      }
    } catch (error) {
      console.error('Error loading user vote:', error);
    }
  };

  const saveUserVote = async (vote: 'positive' | 'negative' | null) => {
    if (!user) return;
    
    try {
      const storageKey = `livemood_vote_${companyId}_${user.id}`;
      
      if (vote === null) {
        if (Platform.OS === 'web') {
          localStorage.removeItem(storageKey);
        } else {
          await AsyncStorage.removeItem(storageKey);
        }
      } else {
        const voteData = {
          vote,
          timestamp: new Date().toISOString(),
          companyId,
          userId: user.id,
        };
        if (Platform.OS === 'web') {
          localStorage.setItem(storageKey, JSON.stringify(voteData));
        } else {
          await AsyncStorage.setItem(storageKey, JSON.stringify(voteData));
        }
      }
    } catch (error) {
      console.error('Error saving user vote:', error);
    }
  };
  const positivePercentage = moodData.totalVotes > 0 ? (moodData.positiveVotes / moodData.totalVotes) * 100 : 0;
  const negativePercentage = moodData.totalVotes > 0 ? (moodData.negativeVotes / moodData.totalVotes) * 100 : 0;

  const handleVote = async (voteType: 'positive' | 'negative') => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to vote on company mood.');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    try {
      const previousVote = moodData.userVote;
      const newVote = previousVote === voteType ? null : voteType;

      setMoodData(prev => {
        let newPositiveVotes = prev.positiveVotes;
        let newNegativeVotes = prev.negativeVotes;
        let newTotalVotes = prev.totalVotes;

        // Remove previous vote if exists
        if (prev.userVote === 'positive') {
          newPositiveVotes--;
          newTotalVotes--;
        } else if (prev.userVote === 'negative') {
          newNegativeVotes--;
          newTotalVotes--;
        }

        // Add new vote if it's different from previous
        if (newVote !== null) {
          if (newVote === 'positive') {
            newPositiveVotes++;
          } else {
            newNegativeVotes++;
          }
          newTotalVotes++;
        }

        // Calculate trend
        const newPositivePercentage = newTotalVotes > 0 ? (newPositiveVotes / newTotalVotes) * 100 : 0;
        const oldPositivePercentage = prev.totalVotes > 0 ? (prev.positiveVotes / prev.totalVotes) * 100 : 0;
        
        let newTrend: 'up' | 'down' | 'stable' = 'stable';
        if (newPositivePercentage > oldPositivePercentage + 2) {
          newTrend = 'up';
        } else if (newPositivePercentage < oldPositivePercentage - 2) {
          newTrend = 'down';
        }

        return {
          totalVotes: newTotalVotes,
          positiveVotes: newPositiveVotes,
          negativeVotes: newNegativeVotes,
          userVote: newVote,
          trend: newTrend,
          lastUpdated: new Date().toISOString(),
        };
      });

      // Save vote to localStorage for persistence
      await saveUserVote(newVote);
      
      // Simulate API call to backend
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error('Failed to submit vote:', error);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
      
      // Revert the vote on error
      setMoodData(prev => ({
        ...prev,
        userVote: previousVote,
      }));
      await saveUserVote(previousVote);
    } finally {
      setIsVoting(false);
    }
  };

  const getTrendIcon = () => {
    switch (moodData.trend) {
      case 'up':
        return <TrendingUp size={16} color="#27AE60" />;
      case 'down':
        return <TrendingDown size={16} color="#E74C3C" />;
      default:
        return null;
    }
  };

  const getTrendText = () => {
    switch (moodData.trend) {
      case 'up':
        return 'Recommended';
      case 'down':
        return 'Not Recommended';
      default:
        return 'Regular';
    }
  };

  const getTrendColor = () => {
    switch (moodData.trend) {
      case 'up':
        return '#27AE60';
      case 'down':
        return '#E74C3C';
      default:
        return '#E67E22';
    }
  };

  return (
    <View style={styles.liveMoodSection}>
      <View style={styles.liveMoodHeader}>
        <Text style={styles.liveMoodTitle}>LiveMood</Text>
        <View style={styles.liveMoodTrend}>
          {getTrendIcon()}
          <Text style={[styles.liveMoodTrendText, { color: getTrendColor() }]}>
            {getTrendText()}
          </Text>
        </View>
      </View>

      {/* Mood Visualization */}
      <View style={styles.moodVisualization}>
        <View style={styles.moodBar}>
          <View 
            style={[
              styles.moodBarFill, 
              styles.moodBarPositive,
              { width: `${positivePercentage}%` }
            ]} 
          />
          <View 
            style={[
              styles.moodBarFill, 
              styles.moodBarNegative,
              { width: `${negativePercentage}%`, right: 0, position: 'absolute' }
            ]} 
          />
        </View>

        <View style={styles.moodStats}>
          <View style={styles.moodStat}>
            <ThumbsUp size={16} color="#27AE60" />
            <Text style={styles.moodStatText}>
              {moodData.positiveVotes} ({positivePercentage.toFixed(0)}%)
            </Text>
          </View>
          <View style={styles.moodStat}>
            <ThumbsDown size={16} color="#E74C3C" />
            <Text style={styles.moodStatText}>
              {moodData.negativeVotes} ({negativePercentage.toFixed(0)}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Voting Buttons */}
      <View style={styles.moodVoting}>
        <Text style={styles.moodVotingTitle}>How's your last experience with {companyName}?</Text>
        <View style={styles.moodVotingButtons}>
          <TouchableOpacity
            style={[
              styles.moodVoteButton,
              styles.moodVoteButtonPositive,
              moodData.userVote === 'positive' && styles.moodVoteButtonActivePositive,
              isVoting && styles.moodVoteButtonDisabled,
            ]}
            onPress={() => handleVote('positive')}
            disabled={isVoting}
          >
            <ThumbsUp 
              size={20} 
              color={moodData.userVote === 'positive' ? '#FFFFFF' : '#27AE60'} 
              fill={moodData.userVote === 'positive' ? '#FFFFFF' : 'transparent'}
            />
            <Text style={[
              styles.moodVoteButtonText,
              moodData.userVote === 'positive' && styles.moodVoteButtonTextActivePositive
            ]}>
              Good
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.moodVoteButton,
              styles.moodVoteButtonNegative,
              moodData.userVote === 'negative' && styles.moodVoteButtonActiveNegative,
              isVoting && styles.moodVoteButtonDisabled,
            ]}
            onPress={() => handleVote('negative')}
            disabled={isVoting}
          >
            <ThumbsDown 
              size={20} 
             color={moodData.userVote === 'negative' ? '#FFFFFF' : '#E74C3C'} 
              fill={moodData.userVote === 'negative' ? '#FFFFFF' : 'transparent'}
            />
            <Text style={[
              styles.moodVoteButtonText,
              styles.moodVoteButtonNegativeText,
              moodData.userVote === 'negative' && styles.moodVoteButtonTextActiveNegative
            ]}>
              Bad
            </Text>
          </TouchableOpacity>
        </View>

        {moodData.userVote && (
          <Text style={styles.moodVoteStatus}>
            You voted: {moodData.userVote === 'positive' ? 'Good' : 'Bad'} • Tap again to remove vote
          </Text>
        )}
      </View>

      <Text style={styles.moodLastUpdated}>
        Based on {moodData.totalVotes} votes • Updated just now
      </Text>
    </View>
  );
};

const ToxicBlueHeartReaction = ({ 
  postId, 
  postType 
}: { 
  postId: string; 
  postType: 'review' | 'claim';
}) => {
  const { user } = useAuth();
  const [reactionData, setReactionData] = useState<ReactionData>({
    count: Math.floor(Math.random() * 50) + 5, // Random initial count between 5-55
    userReacted: false,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const scaleAnim = new Animated.Value(1);
  const heartAnim = new Animated.Value(1);

  // Load user's existing reaction when component mounts
  useEffect(() => {
    loadUserReaction();
  }, [postId, user]);

  const loadUserReaction = async () => {
    if (!user) return;
    
    try {
      const storageKey = `toxic_heart_${postType}_${postId}_${user.id}`;
      let existingReaction: string | null = null;
      
      if (Platform.OS === 'web') {
        existingReaction = localStorage.getItem(storageKey);
      } else {
        existingReaction = await AsyncStorage.getItem(storageKey);
      }
      
      if (existingReaction) {
        const reactionInfo = JSON.parse(existingReaction);
        setReactionData(prev => ({
          ...prev,
          userReacted: reactionInfo.reacted,
        }));
      }
    } catch (error) {
      console.error('Error loading user reaction:', error);
    }
  };

  const saveUserReaction = async (reacted: boolean) => {
    if (!user) return;
    
    try {
      const storageKey = `toxic_heart_${postType}_${postId}_${user.id}`;
      
      if (!reacted) {
        if (Platform.OS === 'web') {
          localStorage.removeItem(storageKey);
        } else {
          await AsyncStorage.removeItem(storageKey);
        }
      } else {
        const reactionInfo = {
          reacted,
          timestamp: new Date().toISOString(),
          postId,
          postType,
          userId: user.id,
        };
        if (Platform.OS === 'web') {
          localStorage.setItem(storageKey, JSON.stringify(reactionInfo));
        } else {
          await AsyncStorage.setItem(storageKey, JSON.stringify(reactionInfo));
        }
      }
    } catch (error) {
      console.error('Error saving user reaction:', error);
    }
  };

  const animateHeart = (liked: boolean) => {
    if (liked) {
      // Instagram-like heart animation when liking
      Animated.sequence([
        Animated.parallel([
          Animated.timing(heartAnim, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heartAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Subtle animation when unliking
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleReaction = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to react to posts.');
      return;
    }

    if (isAnimating) return;

    setIsAnimating(true);

    try {
      const newReacted = !reactionData.userReacted;
      const newCount = newReacted ? reactionData.count + 1 : reactionData.count - 1;

      // Animate immediately for better UX
      animateHeart(newReacted);

      setReactionData({
        count: newCount,
        userReacted: newReacted,
      });

      await saveUserReaction(newReacted);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error('Failed to submit reaction:', error);
      // Revert on error
      setReactionData(prev => ({
        count: prev.userReacted ? prev.count - 1 : prev.count + 1,
        userReacted: !prev.userReacted,
      }));
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <View style={styles.instagramReactionContainer}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity 
          style={styles.instagramHeartButton}
          onPress={handleReaction}
          disabled={isAnimating}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
            <Heart 
              size={24} 
              color={reactionData.userReacted ? '#00BFFF' : '#666666'} 
              fill={reactionData.userReacted ? '#00BFFF' : 'transparent'}
              strokeWidth={reactionData.userReacted ? 0 : 2}
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
      
      <TouchableOpacity onPress={handleReaction} disabled={isAnimating}>
        <Text style={[
          styles.instagramHeartCount,
          reactionData.userReacted && styles.instagramHeartCountActive
        ]}>
          {reactionData.count.toLocaleString()} likes
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const CommentReaction = ({ commentId }: { commentId: string }) => {
  const { user } = useAuth();
  const [reactionData, setReactionData] = useState<ReactionData>({
    count: Math.floor(Math.random() * 20) + 1,
    userReacted: false,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const scaleAnim = new Animated.Value(1);
  const heartAnim = new Animated.Value(1);

  useEffect(() => {
    loadUserReaction();
  }, [commentId, user]);

  const loadUserReaction = async () => {
    if (!user) return;
    
    try {
      const storageKey = `comment_heart_${commentId}_${user.id}`;
      let existingReaction: string | null = null;
      
      if (Platform.OS === 'web') {
        existingReaction = localStorage.getItem(storageKey);
      } else {
        existingReaction = await AsyncStorage.getItem(storageKey);
      }
      
      if (existingReaction) {
        const reactionInfo = JSON.parse(existingReaction);
        setReactionData(prev => ({
          ...prev,
          userReacted: reactionInfo.reacted,
        }));
      }
    } catch (error) {
      console.error('Error loading comment reaction:', error);
    }
  };

  const saveUserReaction = async (reacted: boolean) => {
    if (!user) return;
    
    try {
      const storageKey = `comment_heart_${commentId}_${user.id}`;
      
      if (!reacted) {
        if (Platform.OS === 'web') {
          localStorage.removeItem(storageKey);
        } else {
          await AsyncStorage.removeItem(storageKey);
        }
      } else {
        const reactionInfo = {
          reacted,
          timestamp: new Date().toISOString(),
          commentId,
          userId: user.id,
        };
        if (Platform.OS === 'web') {
          localStorage.setItem(storageKey, JSON.stringify(reactionInfo));
        } else {
          await AsyncStorage.setItem(storageKey, JSON.stringify(reactionInfo));
        }
      }
    } catch (error) {
      console.error('Error saving comment reaction:', error);
    }
  };

  const animateHeart = (liked: boolean) => {
    if (liked) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(heartAnim, {
            toValue: 1.2,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heartAnim, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleReaction = async () => {
    if (!user) return;
    if (isAnimating) return;

    setIsAnimating(true);

    try {
      const newReacted = !reactionData.userReacted;
      const newCount = newReacted ? reactionData.count + 1 : reactionData.count - 1;

      animateHeart(newReacted);

      setReactionData({
        count: newCount,
        userReacted: newReacted,
      });

      await saveUserReaction(newReacted);
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.error('Failed to submit comment reaction:', error);
      setReactionData(prev => ({
        count: prev.userReacted ? prev.count - 1 : prev.count + 1,
        userReacted: !prev.userReacted,
      }));
    } finally {
      setTimeout(() => setIsAnimating(false), 200);
    }
  };

  return (
    <Animated.View style={[styles.commentReactionContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        style={styles.commentHeartButton}
        onPress={handleReaction}
        disabled={isAnimating}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
          <Heart 
            size={16} 
            color={reactionData.userReacted ? '#00BFFF' : '#666666'} 
            fill={reactionData.userReacted ? '#00BFFF' : 'transparent'}
            strokeWidth={reactionData.userReacted ? 0 : 1.5}
          />
        </Animated.View>
      </TouchableOpacity>
      
      {reactionData.count > 0 && (
        <Text style={[
          styles.commentHeartCount,
          reactionData.userReacted && styles.commentHeartCountActive
        ]}>
          {reactionData.count}
        </Text>
      )}
    </Animated.View>
  );
};

const CommentItem = ({ 
  comment, 
  onReply, 
  isReply = false 
}: { 
  comment: Comment; 
  onReply: (commentId: string, userName: string) => void;
  isReply?: boolean;
}) => {
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
          {comment.user.avatarUrl ? (
            <Image source={{ uri: comment.user.avatarUrl }} style={styles.commentAvatar} />
          ) : (
            <View style={styles.commentAvatarPlaceholder}>
              <User size={16} color="#666666" />
            </View>
          )}
          
          <View style={styles.commentUserDetails}>
            <View style={styles.commentUserName}>
              <Text style={styles.commentUserNameText}>
                {comment.user.firstName} {comment.user.lastName}
              </Text>
              {comment.user.verified && (
                <Shield size={10} color="#27AE60" />
              )}
              <Text style={styles.commentTime}>{getTimeAgo(comment.createdAt)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.commentOptionsButton}>
          <MoreHorizontal size={16} color="#666666" />
        </TouchableOpacity>
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      <View style={styles.commentActions}>
        <CommentReaction commentId={comment.id} />
        
        <TouchableOpacity 
          style={styles.commentReplyButton}
          onPress={() => onReply(comment.id, comment.user.firstName)}
        >
          <Text style={styles.commentReplyText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              isReply={true}
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
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; userName: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate mock comments
  useEffect(() => {
    const mockComments: Comment[] = [
      {
        id: `comment_${postId}_1`,
        postId,
        postType,
        userId: 'user1',
        content: 'This is really helpful! Thanks for sharing your experience.',
        reactions: { count: 5, userReacted: false },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        user: {
          id: 'user1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          avatarUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: true,
        },
        replies: [
          {
            id: `reply_${postId}_1_1`,
            postId,
            postType,
            userId: 'user2',
            content: 'I agree! Had a similar experience.',
            parentId: `comment_${postId}_1`,
            reactions: { count: 2, userReacted: false },
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            user: {
              id: 'user2',
              firstName: 'Mike',
              lastName: 'Chen',
              avatarUrl: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
              verified: false,
            },
          },
        ],
      },
      {
        id: `comment_${postId}_2`,
        postId,
        postType,
        userId: 'user3',
        content: 'Thanks for the detailed review. This helps a lot in making my decision.',
        reactions: { count: 3, userReacted: false },
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        user: {
          id: 'user3',
          firstName: 'Emma',
          lastName: 'Davis',
          avatarUrl: 'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: true,
        },
      },
    ];
    setComments(mockComments);
  }, [postId, postType]);

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const comment: Comment = {
        id: `comment_${Date.now()}`,
        postId,
        postType,
        userId: user.id,
        content: newComment.trim(),
        parentId: replyingTo?.commentId,
        reactions: { count: 0, userReacted: false },
        createdAt: new Date().toISOString(),
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUrl: user.avatar_url || undefined,
          verified: user.verified || false,
        },
      };

      if (replyingTo) {
        // Add as reply
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo.commentId) {
            return {
              ...c,
              replies: [...(c.replies || []), comment],
            };
          }
          return c;
        }));
      } else {
        // Add as new comment
        setComments(prev => [comment, ...prev]);
      }

      setNewComment('');
      setReplyingTo(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Failed to submit comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string, userName: string) => {
    setReplyingTo({ commentId, userName });
    setNewComment(`@${userName} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  const commentsCount = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);

  return (
    <View style={styles.commentsSection}>
      <TouchableOpacity 
        style={styles.commentsToggle}
        onPress={() => setShowComments(!showComments)}
      >
        <MessageCircle size={20} color="#666666" />
        <Text style={styles.commentsToggleText}>
          {commentsCount > 0 ? `View ${commentsCount} comments` : 'Add a comment'}
        </Text>
      </TouchableOpacity>

      {showComments && (
        <View style={styles.commentsContainer}>
          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            {replyingTo && (
              <View style={styles.replyingToContainer}>
                <Text style={styles.replyingToText}>
                  Replying to @{replyingTo.userName}
                </Text>
                <TouchableOpacity onPress={cancelReply}>
                  <X size={16} color="#666666" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.commentInputRow}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.commentInputAvatar} />
              ) : (
                <View style={styles.commentInputAvatarPlaceholder}>
                  <User size={16} color="#666666" />
                </View>
              )}
              
              <TextInput
                style={styles.commentInput}
                placeholder={replyingTo ? `Reply to ${replyingTo.userName}...` : 'Add a comment...'}
                placeholderTextColor="#666666"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
                editable={!isSubmitting}
              />
              
              <TouchableOpacity 
                style={[
                  styles.commentSubmitButton,
                  (!newComment.trim() || isSubmitting) && styles.commentSubmitButtonDisabled
                ]}
                onPress={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#666666" />
                ) : (
                  <Send size={16} color={newComment.trim() ? '#00BFFF' : '#666666'} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments List */}
          <View style={styles.commentsList}>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
              />
            ))}
            
            {comments.length === 0 && (
              <View style={styles.noCommentsContainer}>
                <MessageCircle size={32} color="#3A3A3A" />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to share your thoughts!</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  companyName: string;
  onStartChat: () => void;
  onWriteReview: () => void;
  onWriteClaim: () => void;
}

const ActionModal = ({ visible, onClose, companyName, onStartChat, onWriteReview, onWriteClaim }: ActionModalProps) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Interact with {companyName}</Text>
          
          <View style={styles.modalPlaceholder} />
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.modalSubtitle}>Choose how you'd like to interact:</Text>
          
          <View style={styles.actionOptions}>
            <TouchableOpacity style={styles.actionOption} onPress={onStartChat}>
              <View style={[styles.actionIcon, { backgroundColor: '#27AE60' }]}>
                <MessageCircle size={24} color="#FFFFFF" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Start Live Chat</Text>
                <Text style={styles.actionDescription}>
                  Connect directly with customer service for immediate assistance
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOption} onPress={onWriteReview}>
              <View style={[styles.actionIcon, { backgroundColor: '#3498DB' }]}>
                <Star size={24} color="#FFFFFF" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Write a Qdle</Text>
                <Text style={styles.actionDescription}>
                  Share your positive experience and help others make informed decisions
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOption} onPress={onWriteClaim}>
              <View style={[styles.actionIcon, { backgroundColor: '#E74C3C' }]}>
                <AlertTriangle size={24} color="#FFFFFF" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Write a Public Claim</Text>
                <Text style={styles.actionDescription}>
                  Report an issue or concern that needs to be addressed publicly
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const ReviewCard = ({ review }: { review: CompanyReview }) => {
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

  const userProfile = review.user_profiles;

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
                <Shield size={12} color="#27AE60" />
              )}
            </View>
            <Text style={styles.reviewTime}>{getTimeAgo(review.created_at!)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewContent}>{review.content}</Text>

      {/* Instagram-style Toxic Blue Heart Reaction */}
      <View style={styles.postReactions}>
        <ToxicBlueHeartReaction postId={review.id} postType="review" />
      </View>

      {/* Comments Section */}
      <CommentsSection postId={review.id} postType="review" />
    </View>
  );
};

const ClaimCard = ({ claim }: { claim: CompanyClaim }) => {
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
      case 'pending': return '#F39C12';
      case 'rejected': return '#E74C3C';
      default: return '#666666';
    }
  };

  const userProfile = claim.user_profiles;

  return (
    <View style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <View style={styles.claimUserInfo}>
          {userProfile?.avatar_url ? (
            <Image source={{ uri: userProfile.avatar_url }} style={styles.claimAvatar} />
          ) : (
            <View style={styles.claimAvatarPlaceholder}>
              <User size={20} color="#666666" />
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
            <Text style={styles.claimTime}>{getTimeAgo(claim.created_at!)}</Text>
          </View>
        </View>

        <View style={styles.claimBadges}>
          <View style={[styles.claimBadge, { backgroundColor: getStatusColor(claim.status) }]}>
            <Text style={styles.claimBadgeText}>{claim.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.claimTitle}>{claim.title}</Text>
      <Text style={styles.claimDescription}>{claim.description}</Text>
      
      <View style={styles.claimFooter}>
        <Text style={styles.claimCategory}>{claim.category}</Text>
        {claim.coins_awarded && (
          <Text style={styles.claimCoins}>+{claim.coins_awarded} coins</Text>
        )}
      </View>

      {claim.resolution_notes && (
        <View style={styles.claimResolution}>
          <Text style={styles.claimResolutionTitle}>Resolution:</Text>
          <Text style={styles.claimResolutionText}>{claim.resolution_notes}</Text>
        </View>
      )}

      {/* Instagram-style Toxic Blue Heart Reaction */}
      <View style={styles.postReactions}>
        <ToxicBlueHeartReaction postId={claim.id} postType="claim" />
      </View>

      {/* Comments Section */}
      <CommentsSection postId={claim.id} postType="claim" />
    </View>
  );
};

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [company, setCompany] = useState<FullCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reviews' | 'claims'>('reviews');
  const [showActionModal, setShowActionModal] = useState(false);

  useEffect(() => {
    loadCompany();
  }, [id]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const companyData = await getCompanyById(id as string);
      if (companyData) {
        setCompany(companyData);
      } else {
        setError('Company not found');
      }
    } catch (error: any) {
      console.error('Error loading company:', error);
      setError(error.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    setShowActionModal(false);
    startLiveChat();
  };

  const startLiveChat = async () => {
    if (!user || !company) {
      Alert.alert('Error', 'Please sign in to start a live chat.');
      return;
    }

    try {
      console.log('Starting live chat with company:', company.name);
      
      // Start the conversation
      const conversation = await startLiveChatWithCompany(user.id, company.id);
      
      // Navigate to the chat screen
      router.push(`/(tabs)/messages/${conversation.id}`);
      
      Alert.alert(
        'Live Chat Started',
        `You are now connected with ${company.name}. A customer service representative will assist you shortly.`,
        [
          {
            text: 'OK',
            onPress: () => {},
          },
        ]
      );
    } catch (error: any) {
      console.error('Error starting live chat:', error);
      Alert.alert('Error', 'Failed to start live chat. Please try again.');
    }
  };

  const handleWriteReview = () => {
    setShowActionModal(false);
    Alert.alert('Write Qdle', 'Opening qdle form...');
    // TODO: Navigate to qdle form
  };

  const handleWriteClaim = () => {
    setShowActionModal(false);
    Alert.alert('Write Claim', 'Opening claim form...');
    // TODO: Navigate to claim form
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
            <Text style={styles.headerTitle}>Company</Text>
          </View>
        </SafeAreaView>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5ce1e6" />
          <Text style={styles.loadingText}>Loading company details...</Text>
        </View>
      </View>
    );
  }

  if (error || !company) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Company</Text>
          </View>
        </SafeAreaView>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Company Not Found</Text>
          <Text style={styles.errorMessage}>{error || 'The company you\'re looking for doesn\'t exist.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Details</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            <View style={styles.companyMainInfo}>
              <View style={styles.logoContainer}>
                {company.logo_url ? (
                  <Image source={{ uri: company.logo_url }} style={styles.companyLogo} />
                ) : (
                  <View style={styles.companyLogoPlaceholder}>
                    <Building2 size={32} color="#666666" />
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
              </View>
            </View>
          </View>
        </View>

        {/* Live Mood Section */}
        <LiveMoodSection companyId={company.id} companyName={company.name} />

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
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
          {activeTab === 'reviews' && (
            <View>
              {company.reviews && company.reviews.length > 0 ? (
                company.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Star size={48} color="#3A3A3A" />
                  <Text style={styles.emptyTitle}>No Qdles Yet</Text>
                  <Text style={styles.emptyMessage}>
                    Be the first to share your positive experience with this company.
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'claims' && (
            <View>
              {company.claims && company.claims.length > 0 ? (
                company.claims.map((claim) => (
                  <ClaimCard key={claim.id} claim={claim} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MessageCircle size={48} color="#3A3A3A" />
                  <Text style={styles.emptyTitle}>No Claims Yet</Text>
                  <Text style={styles.emptyMessage}>
                    No public claims have been made against this company.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowActionModal(true)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Action Modal */}
      <ActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        companyName={company.name}
        onStartChat={handleStartChat}
        onWriteReview={handleWriteReview}
        onWriteClaim={handleWriteClaim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  safeArea: {
    backgroundColor: '#1A1A1A',
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
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
  companyHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  companyInfo: {
    gap: 16,
  },
  companyMainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  logoContainer: {
    position: 'relative',
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
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
    gap: 4,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  companyIndustry: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  liveMoodSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    gap: 16,
  },
  liveMoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveMoodTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  liveMoodTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveMoodTrendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  moodVisualization: {
    gap: 12,
  },
  moodBar: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  moodBarFill: {
    height: '100%',
    position: 'absolute',
    top: 0,
  },
  moodBarPositive: {
    backgroundColor: '#27AE60',
    left: 0,
  },
  moodBarNegative: {
    backgroundColor: '#E74C3C',
  },
  moodStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodStatText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  moodVoting: {
    gap: 12,
  },
  moodVotingTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  moodVotingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  moodVoteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  moodVoteButtonPositive: {
    borderColor: '#27AE60',
    backgroundColor: 'transparent',
  },
  moodVoteButtonNegative: {
    borderColor: '#E74C3C',
    backgroundColor: 'transparent',
  },
  moodVoteButtonActivePositive: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  moodVoteButtonActiveNegative: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  moodVoteButtonDisabled: {
    opacity: 0.5,
  },
  moodVoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27AE60',
  },
  moodVoteButtonNegativeText: {
    color: '#E74C3C',
  },
  moodVoteButtonTextActivePositive: {
    color: '#FFFFFF',
  },
  moodVoteButtonTextActiveNegative: {
    color: '#FFFFFF',
  },
  moodVoteStatus: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  moodLastUpdated: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#5ce1e6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activeTabText: {
    color: '#1A1A1A',
  },
  tabContent: {
    flex: 1,
  },
  reviewCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    gap: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewUserDetails: {
    flex: 1,
    gap: 2,
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
    fontSize: 14,
    color: '#666666',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewContent: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  claimCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    gap: 12,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  claimUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  claimAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  claimAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimUserDetails: {
    flex: 1,
    gap: 2,
  },
  claimUserName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  claimUserNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  claimTime: {
    fontSize: 14,
    color: '#666666',
  },
  claimBadges: {
    gap: 4,
  },
  claimBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  claimBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  claimTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  claimDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimCategory: {
    fontSize: 14,
    color: '#5ce1e6',
    fontWeight: '500',
  },
  claimCoins: {
    fontSize: 14,
    color: '#F39C12',
    fontWeight: '600',
  },
  claimResolution: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  claimResolutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
  },
  claimResolutionText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5ce1e6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: '#E74C3C',
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 24,
    textAlign: 'center',
  },
  actionOptions: {
    gap: 16,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    gap: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  // Instagram-style Toxic Blue Heart Reaction Styles
  postReactions: {
    marginTop: 16,
  },
  instagramReactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instagramHeartButton: {
    padding: 4,
  },
  instagramHeartCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instagramHeartCountActive: {
    color: '#00BFFF',
  },
  // Comments System Styles
  commentsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 12,
  },
  commentsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  commentsToggleText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  commentsContainer: {
    marginTop: 12,
    gap: 16,
  },
  commentInputContainer: {
    gap: 8,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#00BFFF',
    fontWeight: '500',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    maxHeight: 80,
    paddingVertical: 0,
  },
  commentSubmitButton: {
    padding: 8,
  },
  commentSubmitButtonDisabled: {
    opacity: 0.5,
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  replyItem: {
    marginLeft: 20,
    backgroundColor: '#3A3A3A',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
    backgroundColor: '#4A4A4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentUserNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
  },
  commentOptionsButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  commentReactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentHeartButton: {
    padding: 2,
  },
  commentHeartCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  commentHeartCountActive: {
    color: '#00BFFF',
  },
  commentReplyButton: {
    padding: 4,
  },
  commentReplyText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
    gap: 8,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});