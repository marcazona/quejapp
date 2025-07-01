import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Smile, Frown } from 'lucide-react-native';
import {
  getCompanyExperienceVotes,
  type ExperienceVoteStats,
} from '@/lib/experience-votes';

interface CompanyHeaderEmojiProps {
  companyId: string;
  size?: 'small' | 'medium' | 'large';
}

export const CompanyHeaderEmoji: React.FC<CompanyHeaderEmojiProps> = ({
  companyId,
  size = 'medium',
}) => {
  const [stats, setStats] = useState<ExperienceVoteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVoteStats();
  }, [companyId]);

  const loadVoteStats = async () => {
    try {
      setIsLoading(true);
      const voteStats = await getCompanyExperienceVotes(companyId);
      setStats(voteStats);
    } catch (error) {
      console.error('Error loading vote stats for header:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats || stats.totalVotes === 0 || !stats.mostVoted) {
    return null;
  }

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 28;
      default: return 20;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return 10;
      case 'large': return 14;
      default: return 12;
    }
  };

  return (
    <View style={[styles.container, styles[`container${size.charAt(0).toUpperCase() + size.slice(1)}`]]}>
      {stats.mostVoted === 'happy' ? (
        <Smile size={getIconSize()} color="#27AE60" fill="#27AE60" />
      ) : (
        <Frown size={getIconSize()} color="#E74C3C" fill="#E74C3C" />
      )}
      <Text style={[styles.voteCount, { fontSize: getTextSize() }]}>
        {stats.totalVotes}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
  },
  containerSmall: {
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  containerMedium: {
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
  },
  containerLarge: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  voteCount: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
});