import { supabase } from './supabase';

export interface ExperienceVote {
  id: string;
  company_id: string;
  user_id: string;
  vote_type: 'happy' | 'angry';
  created_at: string;
  updated_at: string;
}

export interface ExperienceVoteStats {
  totalVotes: number;
  happyVotes: number;
  angryVotes: number;
  userVote: 'happy' | 'angry' | null;
  mostVoted: 'happy' | 'angry' | null;
}

// Get experience vote stats for a company
export const getCompanyExperienceVotes = async (
  companyId: string,
  userId?: string
): Promise<ExperienceVoteStats> => {
  try {
    console.log('ExperienceVotes: Fetching votes for company:', companyId);
    
    // Get all votes for the company
    const { data: votes, error } = await supabase
      .from('company_experience_votes')
      .select('vote_type, user_id')
      .eq('company_id', companyId);

    if (error) {
      console.error('ExperienceVotes: Error fetching votes:', error);
      throw error;
    }

    // Calculate stats
    const totalVotes = votes?.length || 0;
    const happyVotes = votes?.filter(v => v.vote_type === 'happy').length || 0;
    const angryVotes = votes?.filter(v => v.vote_type === 'angry').length || 0;
    
    // Find user's vote if userId provided
    const userVote = userId && votes ? 
      votes.find(v => v.user_id === userId)?.vote_type || null : null;
    
    // Determine most voted
    let mostVoted: 'happy' | 'angry' | null = null;
    if (happyVotes > angryVotes) {
      mostVoted = 'happy';
    } else if (angryVotes > happyVotes) {
      mostVoted = 'angry';
    }

    return {
      totalVotes,
      happyVotes,
      angryVotes,
      userVote,
      mostVoted,
    };
  } catch (error) {
    console.error('ExperienceVotes: Error in getCompanyExperienceVotes:', error);
    throw error;
  }
};

// Submit or update a vote for a company
export const submitExperienceVote = async (
  companyId: string,
  userId: string,
  voteType: 'happy' | 'angry'
): Promise<ExperienceVote> => {
  try {
    console.log('ExperienceVotes: Submitting vote for company:', companyId, 'vote:', voteType);
    
    // Check if user already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('company_experience_votes')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('ExperienceVotes: Error checking existing vote:', checkError);
      throw checkError;
    }

    let result;

    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabase
        .from('company_experience_votes')
        .update({
          vote_type: voteType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (error) {
        console.error('ExperienceVotes: Error updating vote:', error);
        throw error;
      }
      result = data;
    } else {
      // Create new vote
      const { data, error } = await supabase
        .from('company_experience_votes')
        .insert({
          company_id: companyId,
          user_id: userId,
          vote_type: voteType,
        })
        .select()
        .single();

      if (error) {
        console.error('ExperienceVotes: Error creating vote:', error);
        throw error;
      }
      result = data;
    }

    console.log('ExperienceVotes: Vote submitted successfully');
    return result;
  } catch (error) {
    console.error('ExperienceVotes: Error in submitExperienceVote:', error);
    throw error;
  }
};

// Remove a user's vote for a company
export const removeExperienceVote = async (
  companyId: string,
  userId: string
): Promise<void> => {
  try {
    console.log('ExperienceVotes: Removing vote for company:', companyId);
    
    const { error } = await supabase
      .from('company_experience_votes')
      .delete()
      .eq('company_id', companyId)
      .eq('user_id', userId);

    if (error) {
      console.error('ExperienceVotes: Error removing vote:', error);
      throw error;
    }

    console.log('ExperienceVotes: Vote removed successfully');
  } catch (error) {
    console.error('ExperienceVotes: Error in removeExperienceVote:', error);
    throw error;
  }
};