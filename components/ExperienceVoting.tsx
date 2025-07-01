import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Smile, Frown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCompanyExperienceVotes,
  submitExperienceVote,
  removeExperienceVote,
  type ExperienceVoteStats,
} from '@/lib/experience-votes';

interface ExperienceVotingProps {
  companyId: string;
  companyName: string;
  onVoteChange?: (stats: ExperienceVoteStats) => void;
}

export const ExperienceVoting: React.FC<ExperienceVotingProps> = ({
  companyId,
  companyName,
  onVoteChange,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ExperienceVoteStats>({
    totalVotes: 0,
    happyVotes: 0,
    angryVotes: 0,
    userVote: null,
    mostVoted: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadVoteStats();
  }, [companyId, user]);

  const loadVoteStats = async () => {
    try {
      setIsLoading(true);
      const voteStats = await getCompanyExperienceVotes(companyId, user?.id);
      setStats(voteStats);
      onVoteChange?.(voteStats);
    } catch (error) {
      console.error('Error loading vote stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (voteType: 'happy' | 'angry') => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to vote on your experience.');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    try {
      const previousVote = stats.userVote;
      
      if (previousVote === voteType) {
        // Remove vote if clicking the same option
        await removeExperienceVote(companyId, user.id);
      } else {
        // Submit new vote
        await submitExperienceVote(companyId, user.id, voteType);
      }

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

      // Refresh stats
      await loadVoteStats();
    } catch (error) {
      console.error('Failed to submit vote:', error);
      Alert.alert('Error', 'Failed to submit your vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.question}>How's your last experience with {companyName}?</Text>
        <View style={styles.votingButtons}>
          <View style={[styles.voteButton, styles.voteButtonDisabled]}>
            <Smile size={24} color="#666666" />
          </View>
          <View style={[styles.voteButton, styles.voteButtonDisabled]}>
            <Frown size={24} color="#666666" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={styles.question}>How's your last experience with {companyName}?</Text>
      
      <View style={styles.votingButtons}>
        <TouchableOpacity
          style={[
            styles.voteButton,
            styles.happyButton,
            stats.userVote === 'happy' && styles.voteButtonActive,
            isVoting && styles.voteButtonDisabled,
          ]}
          onPress={() => handleVote('happy')}
          disabled={isVoting}
        >
          <Smile 
            size={24} 
            color={stats.userVote === 'happy' ? '#FFFFFF' : '#27AE60'} 
            fill={stats.userVote === 'happy' ? '#FFFFFF' : 'transparent'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.voteButton,
            styles.angryButton,
            stats.userVote === 'angry' && styles.voteButtonActive,
            isVoting && styles.voteButtonDisabled,
          ]}
          onPress={() => handleVote('angry')}
          disabled={isVoting}
        >
          <Frown 
            size={24} 
            color={stats.userVote === 'angry' ? '#FFFFFF' : '#E74C3C'} 
            fill={stats.userVote === 'angry' ? '#FFFFFF' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* Show vote count only after user votes */}
      {stats.userVote && (
        <View style={styles.voteStats}>
          <Text style={styles.voteCount}>
            {stats.totalVotes} {stats.totalVotes === 1 ? 'person has' : 'people have'} shared their experience
          </Text>
          <View style={styles.voteBreakdown}>
            <View style={styles.statItem}>
              <Smile size={16} color="#27AE60" />
              <Text style={styles.statText}>{stats.happyVotes}</Text>
            </View>
            <View style={styles.statItem}>
              <Frown size={16} color="#E74C3C" />
              <Text style={styles.statText}>{stats.angryVotes}</Text>
            </View>
          </View>
        </View>
      )}

      {/* User vote status */}
      {stats.userVote && (
        <Text style={styles.voteStatus}>
          You voted: {stats.userVote === 'happy' ? '😊 Happy' : '😠 Angry'} • Tap to change or remove
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  votingButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  voteButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  happyButton: {
    borderColor: '#27AE60',
  },
  angryButton: {
    borderColor: '#E74C3C',
  },
  voteButtonActive: {
    backgroundColor: '#27AE60',
  },
  voteButtonDisabled: {
    opacity: 0.5,
  },
  voteStats: {
    alignItems: 'center',
    marginBottom: 8,
  },
  voteCount: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 8,
  },
  voteBreakdown: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  voteStatus: {
    fontSize: 11,
    color: '#5ce1e6',
    textAlign: 'center',
  },
});