import { supabase } from './supabase';

export interface LiveMoodVote {
  id: string;
  company_id: string;
  user_id: string;
  vote_type: 'positive' | 'negative';
  experience_category: string;
  created_at: string;
  updated_at: string;
}

export interface LiveMoodStats {
  id: string;
  company_id: string;
  total_votes: number;
  positive_votes: number;
  negative_votes: number;
  trend_direction: 'up' | 'down' | 'stable';
  last_calculated: string;
  created_at: string;
  updated_at: string;
}

export interface LiveMoodData {
  totalVotes: number;
  positiveVotes: number;
  negativeVotes: number;
  userVote: 'positive' | 'negative' | null;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  positivePercentage: number;
  negativePercentage: number;
}

// Experience categories for voting
export const EXPERIENCE_CATEGORIES = [
  'general',
  'customer_service',
  'product_quality',
  'delivery',
  'pricing',
  'communication',
  'resolution_time',
  'staff_behavior',
  'website_experience',
  'overall_satisfaction'
] as const;

export type ExperienceCategory = typeof EXPERIENCE_CATEGORIES[number];

// Get LiveMood data for a specific company
export const getCompanyLiveMood = async (
  companyId: string,
  userId?: string
): Promise<LiveMoodData> => {
  try {
    console.log('LiveMood: Fetching data for company:', companyId);
    
    // Get company stats
    const { data: stats, error: statsError } = await supabase
      .from('company_livemood_stats')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    if (statsError) {
      console.error('LiveMood: Error fetching stats:', statsError);
      throw statsError;
    }

    // If no stats found, return default values
    if (!stats) {
      console.log('LiveMood: No stats found for company, returning defaults');
      return {
        totalVotes: 0,
        positiveVotes: 0,
        negativeVotes: 0,
        userVote: null,
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        positivePercentage: 0,
        negativePercentage: 0,
      };
    }

    // Get user's vote if userId provided
    let userVote: 'positive' | 'negative' | null = null;
    if (userId) {
      const { data: vote, error: voteError } = await supabase
        .from('company_livemood_votes')
        .select('vote_type')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .maybeSingle();

      if (voteError) {
        console.error('LiveMood: Error fetching user vote:', voteError);
      }
      
      if (vote) {
        userVote = vote.vote_type;
      }
    }

    // Calculate percentages
    const totalVotes = stats?.total_votes || 0;
    const positiveVotes = stats?.positive_votes || 0;
    const negativeVotes = stats?.negative_votes || 0;
    
    const positivePercentage = totalVotes > 0 ? (positiveVotes / totalVotes) * 100 : 0;
    const negativePercentage = totalVotes > 0 ? (negativeVotes / totalVotes) * 100 : 0;

    return {
      totalVotes,
      positiveVotes,
      negativeVotes,
      userVote,
      trend: stats?.trend_direction || 'stable',
      lastUpdated: stats?.last_calculated || new Date().toISOString(),
      positivePercentage,
      negativePercentage,
    };
  } catch (error) {
    console.error('LiveMood: Error in getCompanyLiveMood:', error);
    throw error;
  }
};

// Submit or update a vote for a company
export const submitCompanyVote = async (
  companyId: string,
  userId: string,
  voteType: 'positive' | 'negative',
  experienceCategory: ExperienceCategory = 'general'
): Promise<LiveMoodVote> => {
  try {
    console.log('LiveMood: Submitting vote for company:', companyId, 'vote:', voteType);
    
    // Check if user already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('company_livemood_votes')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('LiveMood: Error checking existing vote:', checkError);
      throw checkError;
    }

    let result;

    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabase
        .from('company_livemood_votes')
        .update({
          vote_type: voteType,
          experience_category: experienceCategory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (error) {
        console.error('LiveMood: Error updating vote:', error);
        throw error;
      }
      result = data;
    } else {
      // Create new vote
      const { data, error } = await supabase
        .from('company_livemood_votes')
        .insert({
          company_id: companyId,
          user_id: userId,
          vote_type: voteType,
          experience_category: experienceCategory,
        })
        .select()
        .single();

      if (error) {
        console.error('LiveMood: Error creating vote:', error);
        throw error;
      }
      result = data;
    }

    console.log('LiveMood: Vote submitted successfully');
    return result;
  } catch (error) {
    console.error('LiveMood: Error in submitCompanyVote:', error);
    throw error;
  }
};

// Remove a user's vote for a company
export const removeCompanyVote = async (
  companyId: string,
  userId: string
): Promise<void> => {
  try {
    console.log('LiveMood: Removing vote for company:', companyId);
    
    const { error } = await supabase
      .from('company_livemood_votes')
      .delete()
      .eq('company_id', companyId)
      .eq('user_id', userId);

    if (error) {
      console.error('LiveMood: Error removing vote:', error);
      throw error;
    }

    console.log('LiveMood: Vote removed successfully');
  } catch (error) {
    console.error('LiveMood: Error in removeCompanyVote:', error);
    throw error;
  }
};

// Get recent votes for a company (for activity feed)
export const getCompanyRecentVotes = async (
  companyId: string,
  limit: number = 10
): Promise<LiveMoodVote[]> => {
  try {
    console.log('LiveMood: Fetching recent votes for company:', companyId);
    
    const { data: votes, error } = await supabase
      .from('company_livemood_votes')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('LiveMood: Error fetching recent votes:', error);
      throw error;
    }

    return votes || [];
  } catch (error) {
    console.error('LiveMood: Error in getCompanyRecentVotes:', error);
    throw error;
  }
};

// Get vote breakdown by experience category
export const getCompanyVotesByCategory = async (
  companyId: string
): Promise<Record<ExperienceCategory, { positive: number; negative: number }>> => {
  try {
    console.log('LiveMood: Fetching votes by category for company:', companyId);
    
    const { data: votes, error } = await supabase
      .from('company_livemood_votes')
      .select('vote_type, experience_category')
      .eq('company_id', companyId);

    if (error) {
      console.error('LiveMood: Error fetching votes by category:', error);
      throw error;
    }

    // Initialize result with all categories
    const result = EXPERIENCE_CATEGORIES.reduce((acc, category) => {
      acc[category] = { positive: 0, negative: 0 };
      return acc;
    }, {} as Record<ExperienceCategory, { positive: number; negative: number }>);

    // Count votes by category
    votes?.forEach(vote => {
      const category = vote.experience_category as ExperienceCategory;
      if (result[category]) {
        if (vote.vote_type === 'positive') {
          result[category].positive++;
        } else {
          result[category].negative++;
        }
      }
    });

    return result;
  } catch (error) {
    console.error('LiveMood: Error in getCompanyVotesByCategory:', error);
    throw error;
  }
};

// Get trending companies based on LiveMood data
export const getTrendingCompanies = async (
  limit: number = 10,
  trendDirection: 'up' | 'down' = 'up'
): Promise<LiveMoodStats[]> => {
  try {
    console.log('LiveMood: Fetching trending companies with trend:', trendDirection);
    
    const { data: stats, error } = await supabase
      .from('company_livemood_stats')
      .select('*')
      .eq('trend_direction', trendDirection)
      .gte('total_votes', 5) // Minimum votes for trending
      .order('last_calculated', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('LiveMood: Error fetching trending companies:', error);
      throw error;
    }

    return stats || [];
  } catch (error) {
    console.error('LiveMood: Error in getTrendingCompanies:', error);
    throw error;
  }
};

// Manually refresh stats for a company (admin function)
export const refreshCompanyStats = async (companyId: string): Promise<void> => {
  try {
    console.log('LiveMood: Manually refreshing stats for company:', companyId);
    
    const { error } = await supabase.rpc('update_company_livemood_stats', {
      target_company_id: companyId
    });

    if (error) {
      console.error('LiveMood: Error refreshing stats:', error);
      throw error;
    }

    console.log('LiveMood: Stats refreshed successfully');
  } catch (error) {
    console.error('LiveMood: Error in refreshCompanyStats:', error);
    throw error;
  }
};