import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Minus, X, ChartBar as BarChart3 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCompanyLiveMood,
  submitCompanyVote,
  removeCompanyVote,
  type LiveMoodData,
  type ExperienceCategory,
} from '@/lib/livemood';

interface LiveMoodWidgetProps {
  companyId: string;
  companyName: string;
  showTitle?: boolean;
  compact?: boolean;
  onVoteChange?: (newData: LiveMoodData) => void;
}

export const LiveMoodWidget: React.FC<LiveMoodWidgetProps> = ({
  companyId,
  companyName,
  showTitle = true,
  compact = false,
  onVoteChange,
}) => {
  const { user } = useAuth();
  const [moodData, setMoodData] = useState<LiveMoodData>({
    totalVotes: 0,
    positiveVotes: 0,
    negativeVotes: 0,
    userVote: null,
    trend: 'stable',
    lastUpdated: new Date().toISOString(),
    positivePercentage: 0,
    negativePercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [showWidget, setShowWidget] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadMoodData();
  }, [companyId, user]);

  const loadMoodData = async () => {
    try {
      setIsLoading(true);
      
      // Try to get data from database first
      try {
        const data = await getCompanyLiveMood(companyId, user?.id);
        setMoodData(data);
        onVoteChange?.(data);
        return;
      } catch (dbError) {
        console.log('Failed to get mood data from database, falling back to local storage', dbError);
      }
      
      // Fallback to local storage if database fails
      let localData: LiveMoodData | null = null;
      
      // Check localStorage for user's vote on this company
      const storageKey = `livemood_data_${companyId}`;
      
      if (Platform.OS === 'web') {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          localData = JSON.parse(storedData);
        }
      } else {
        const storedData = await AsyncStorage.getItem(storageKey);
        if (storedData) {
          localData = JSON.parse(storedData);
        }
      }
      
      if (localData) {
        setMoodData(localData);
        onVoteChange?.(localData);
      }
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLocalMoodData = async (data: LiveMoodData) => {
    try {
      const storageKey = `livemood_data_${companyId}`;
      
      if (Platform.OS === 'web') {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } else {
        await AsyncStorage.setItem(storageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error saving mood data locally:', error);
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

  const handleVote = async (voteType: 'positive' | 'negative') => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to vote on company experiences.');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    try {
      const previousVote = moodData.userVote;
      const newVote = previousVote === voteType ? null : voteType;

      // Update local state immediately for responsive UI
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

        // Calculate percentages
        const newPositivePercentage = newTotalVotes > 0 ? (newPositiveVotes / newTotalVotes) * 100 : 0;
        const newNegativePercentage = newTotalVotes > 0 ? (newNegativeVotes / newTotalVotes) * 100 : 0;
        
        // Calculate trend
        const oldPositivePercentage = prev.totalVotes > 0 ? (prev.positiveVotes / prev.totalVotes) * 100 : 0;
        
        let newTrend: 'up' | 'down' | 'stable' = 'stable';
        if (newPositivePercentage > oldPositivePercentage + 1) {
          newTrend = 'up';
        } else if (newPositivePercentage < oldPositivePercentage - 1) {
          newTrend = 'down';
        }

        const updatedData = {
          totalVotes: newTotalVotes,
          positiveVotes: newPositiveVotes,
          negativeVotes: newNegativeVotes,
          userVote: newVote,
          trend: newTrend,
          lastUpdated: new Date().toISOString(),
          positivePercentage: newPositivePercentage,
          negativePercentage: newNegativePercentage,
        };
        
        // Save to local storage as backup
        saveLocalMoodData(updatedData);
        
        return updatedData;
      });

      // Animate the vote
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Save vote to localStorage for persistence
      await saveUserVote(newVote);
      
      // Submit to database
      try {
        if (newVote !== null) {
          await submitCompanyVote(companyId, user.id, newVote, 'general');
        } else {
          await removeCompanyVote(companyId, user.id);
        }
        
        // Refresh data from database to get updated stats
        await loadMoodData();
      } catch (dbError) {
        console.error('Failed to submit vote to database:', dbError);
        // We already updated the UI, so we don't need to show an error to the user
      }
      
      // Notify parent component
      if (onVoteChange) {
        onVoteChange(moodData);
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
      Alert.alert('Error', 'Failed to submit your vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const getTrendIcon = () => {
    switch (moodData.trend) {
      case 'up':
        return <TrendingUp size={14} color="#27AE60" />;
      case 'down':
        return <TrendingDown size={14} color="#E74C3C" />;
      default:
        return <Minus size={14} color="#666666" />;
    }
  };

  const getTrendColor = () => {
    switch (moodData.trend) {
      case 'up':
        return '#27AE60';
      case 'down':
        return '#E74C3C';
      default:
        return '#666666';
    }
  };

  const getRecommendationText = () => {
    if (moodData.totalVotes < 5) return 'New';
    if (moodData.positivePercentage >= 70) return 'Recommended';
    if (moodData.positivePercentage >= 50) return 'Mixed Reviews';
    return 'Caution';
  };

  const getRecommendationColor = () => {
    if (moodData.totalVotes < 5) return '#666666';
    if (moodData.positivePercentage >= 70) return '#27AE60';
    if (moodData.positivePercentage >= 50) return '#E67E22';
    return '#E74C3C';
  };

  if (!showWidget) return null;

  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#5ce1e6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[
      styles.container,
      compact && styles.containerCompact,
      { transform: [{ scale: pulseAnim }] }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>LiveMood</Text>
          <View style={styles.recommendationBadge}>
            <Text style={[styles.recommendationText, { color: getRecommendationColor() }]}>
              {getRecommendationText()}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.trendContainer}>
            {getTrendIcon()}
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {moodData.trend === 'up' ? 'Rising' : moodData.trend === 'down' ? 'Falling' : 'Stable'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowWidget(false)}
          >
            <X size={16} color="#666666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mood Bar */}
      <View style={styles.moodBarContainer}>
        <View style={styles.moodBar}>
          <View 
            style={[
              styles.moodBarFill, 
              styles.moodBarPositive,
              { width: `${moodData.positivePercentage}%` }
            ]} 
          />
          <View 
            style={[
              styles.moodBarFill, 
              styles.moodBarNegative,
              { width: `${moodData.negativePercentage}%`, right: 0, position: 'absolute' }
            ]} 
          />
        </View>
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThumbsUp size={12} color="#27AE60" />
            <Text style={styles.statText}>{moodData.positiveVotes} ({Math.round(moodData.positivePercentage)}%)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThumbsDown size={12} color="#E74C3C" />
            <Text style={styles.statText}>{moodData.negativeVotes} ({Math.round(moodData.negativePercentage)}%)</Text>
          </View>
        </View>
      </View>

      {/* Voting Section */}
      <View style={styles.votingSection}>
        <Text style={styles.votingQuestion}>How was your experience with {companyName}?</Text>
        
        <View style={styles.votingButtons}>
          <TouchableOpacity
            style={[
              styles.voteButton,
              styles.voteButtonPositive,
              moodData.userVote === 'positive' && styles.voteButtonActive,
              isVoting && styles.voteButtonDisabled,
            ]}
            onPress={() => handleVote('positive')}
            disabled={isVoting}
          >
            <ThumbsUp 
              size={16} 
              color={moodData.userVote === 'positive' ? '#FFFFFF' : '#27AE60'} 
              fill={moodData.userVote === 'positive' ? '#FFFFFF' : 'transparent'}
            />
            <Text style={[
              styles.voteButtonText,
              moodData.userVote === 'positive' && styles.voteButtonTextActive
            ]}>
              Good
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.voteButton,
              styles.voteButtonNegative,
              moodData.userVote === 'negative' && styles.voteButtonActive,
              isVoting && styles.voteButtonDisabled,
            ]}
            onPress={() => handleVote('negative')}
            disabled={isVoting}
          >
            <ThumbsDown 
              size={16} 
              color={moodData.userVote === 'negative' ? '#FFFFFF' : '#E74C3C'} 
              fill={moodData.userVote === 'negative' ? '#FFFFFF' : 'transparent'}
            />
            <Text style={[
              styles.voteButtonText,
              moodData.userVote === 'negative' && styles.voteButtonTextActive
            ]}>
              Bad
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {moodData.userVote && (
          <Text style={styles.userVoteStatus}>
            You voted: {moodData.userVote === 'positive' ? 'Good' : 'Bad'} • Tap to change
          </Text>
        )}
        <Text style={styles.voteCount}>
          Based on {moodData.totalVotes} {moodData.totalVotes === 1 ? 'vote' : 'votes'} • Updated just now
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  containerCompact: {
    padding: 12,
    marginVertical: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recommendationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  recommendationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  moodBarContainer: {
    marginBottom: 16,
  },
  moodBar: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  votingSection: {
    marginBottom: 16,
  },
  votingQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  voteButtonPositive: {
    borderColor: '#27AE60',
  },
  voteButtonNegative: {
    borderColor: '#E74C3C',
  },
  voteButtonActive: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  voteButtonDisabled: {
    opacity: 0.5,
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  voteButtonTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  userVoteStatus: {
    fontSize: 12,
    color: '#5ce1e6',
    fontWeight: '500',
  },
  voteCount: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
});