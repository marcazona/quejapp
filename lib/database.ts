import { supabase } from './supabase';

export interface ChatConversation {
  id: string;
  user_id: string;
  company_id: string;
  status: 'active' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
  company?: Company;
  last_message?: {
    content: string;
    created_at: string;
    sender_type: 'user' | 'company';
    read_at: string | null;
  };
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  reputation: number | null;
  total_posts: number | null;
  total_likes: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  cover_image_url: string | null;
  industry: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  rating: number | null;
  total_reviews: number | null;
  total_claims: number | null;
  verified: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CompanyReview {
  id: string;
  company_id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  is_verified_purchase: boolean | null;
  helpful_count: number | null;
  created_at: string | null;
  user_profiles?: UserProfile;
}

export interface CompanyClaim {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  resolution_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_profiles?: UserProfile;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  photo_url: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
  updated_at: string;
  user_profiles?: UserProfile;
  user_photos?: Array<{
    photo_url: string;
    is_primary: boolean | null;
  }>;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profiles?: UserProfile;
}

export interface FullCompanyProfile extends Company {
  reviews?: CompanyReview[];
  claims?: CompanyClaim[];
  distance?: number;
}

// Calculate age from birth date
export const calculateAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

// Get all companies for discovery
export const getDiscoveryCompanies = async (userLocation?: { latitude: number; longitude: number }) => {
  try {
    console.log('Database: Fetching discovery companies...');
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database: Error fetching companies:', error);
      throw error;
    }

    // Add distance calculation if user location is provided
    const companiesWithDistance = companies.map(company => ({
      ...company,
      distance: userLocation ? Math.random() * 10 : undefined, // TODO: Calculate real distance
    }));

    console.log('Database: Found', companiesWithDistance.length, 'companies');
    return companiesWithDistance;
  } catch (error) {
    console.error('Database: Error in getDiscoveryCompanies:', error);
    throw error;
  }
};

// Get company by ID with full details
export const getCompanyById = async (companyId: string): Promise<FullCompanyProfile | null> => {
  try {
    console.log('Database: Fetching company by ID:', companyId);
    
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError) {
      console.error('Database: Error fetching company:', companyError);
      throw companyError;
    }

    if (!company) {
      return null;
    }

    // Fetch reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('company_reviews')
      .select(`
        *,
        user_profiles (
          id,
          first_name,
          last_name,
          avatar_url,
          verified
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Database: Error fetching reviews:', reviewsError);
    }

    // Fetch claims
    const { data: claims, error: claimsError } = await supabase
      .from('company_claims')
      .select(`
        *,
        user_profiles (
          id,
          first_name,
          last_name,
          avatar_url,
          verified
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (claimsError) {
      console.error('Database: Error fetching claims:', claimsError);
    }

    return {
      ...company,
      reviews: reviews || [],
      claims: claims || [],
    };
  } catch (error) {
    console.error('Database: Error in getCompanyById:', error);
    throw error;
  }
};

// Search companies
export const searchCompanies = async (
  query: string,
  filters: {
    industry?: string;
    verified?: boolean;
    minRating?: number;
  } = {},
  userLocation?: { latitude: number; longitude: number }
) => {
  try {
    console.log('Database: Searching companies with query:', query);
    
    let queryBuilder = supabase
      .from('companies')
      .select('*')
      .eq('is_active', true);

    // Apply text search
    if (query.trim()) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%,industry.ilike.%${query}%`);
    }

    // Apply filters
    if (filters.industry) {
      queryBuilder = queryBuilder.eq('industry', filters.industry);
    }

    if (filters.verified) {
      queryBuilder = queryBuilder.eq('verified', true);
    }

    if (filters.minRating) {
      queryBuilder = queryBuilder.gte('rating', filters.minRating);
    }

    const { data: companies, error } = await queryBuilder.order('created_at', { ascending: false });

    if (error) {
      console.error('Database: Error searching companies:', error);
      throw error;
    }

    // Add distance if location provided
    const companiesWithDistance = companies.map(company => ({
      ...company,
      distance: userLocation ? Math.random() * 10 : undefined, // TODO: Calculate real distance
    }));

    console.log('Database: Returning', companiesWithDistance.length, 'filtered companies');
    return companiesWithDistance;
  } catch (error) {
    console.error('Database: Error in searchCompanies:', error);
    throw error;
  }
};

// Chat-related functions
export const getUserChatConversations = async (userId: string): Promise<ChatConversation[]> => {
  try {
    console.log('Database: Fetching chat conversations for user:', userId);
    
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        companies (
          id,
          name,
          logo_url,
          verified
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Database: Error fetching conversations:', error);
      throw error;
    }

    // Get last message for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const { data: lastMessage } = await supabase
          .from('chat_messages')
          .select('content, created_at, sender_type, read_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          company: conv.companies,
          last_message: lastMessage,
        };
      })
    );

    return conversationsWithMessages;
  } catch (error) {
    console.error('Database: Error in getUserChatConversations:', error);
    throw error;
  }
};

export const startLiveChatWithCompany = async (userId: string, companyId: string): Promise<ChatConversation> => {
  try {
    console.log('Database: Starting live chat between user:', userId, 'and company:', companyId);
    
    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .single();

    if (existingConv) {
      // Return existing conversation
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      return {
        ...existingConv,
        company,
      };
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        company_id: companyId,
        status: 'active',
      })
      .select()
      .single();

    if (convError) {
      console.error('Database: Error creating conversation:', convError);
      throw convError;
    }

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    // Send initial message from company
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: newConv.id,
        sender_id: 'system',
        sender_type: 'company',
        content: `Hello! Welcome to ${company?.name || 'our company'}. How can we assist you today?`,
        message_type: 'text',
      });

    return {
      ...newConv,
      company,
    };
  } catch (error) {
    console.error('Database: Error in startLiveChatWithCompany:', error);
    throw error;
  }
};

// Post-related functions
export const getUserPosts = async (currentUserId?: string): Promise<Post[]> => {
  try {
    console.log('Database: Fetching user posts...');
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        user_profiles (
          id,
          first_name,
          last_name,
          avatar_url,
          verified
        ),
        user_photos (
          photo_url,
          is_primary
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database: Error fetching posts:', error);
      throw error;
    }

    return posts || [];
  } catch (error) {
    console.error('Database: Error in getUserPosts:', error);
    throw error;
  }
};

export const createPost = async (userId: string, content: string, photoUrl?: string): Promise<Post> => {
  try {
    console.log('Database: Creating new post for user:', userId);
    
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content,
        photo_url: photoUrl,
        likes_count: 0,
        comments_count: 0,
      })
      .select(`
        *,
        user_profiles (
          id,
          first_name,
          last_name,
          avatar_url,
          verified
        )
      `)
      .single();

    if (error) {
      console.error('Database: Error creating post:', error);
      throw error;
    }

    return post;
  } catch (error) {
    console.error('Database: Error in createPost:', error);
    throw error;
  }
};

export const likePost = async (postId: string, userId: string): Promise<void> => {
  try {
    console.log('Database: Liking post:', postId, 'by user:', userId);
    
    // TODO: Implement likes table and logic
    // For now, just increment the likes count
    const { error } = await supabase.rpc('increment_post_likes', {
      post_id: postId
    });

    if (error) {
      console.error('Database: Error liking post:', error);
      throw error;
    }
  } catch (error) {
    console.error('Database: Error in likePost:', error);
    throw error;
  }
};

export const getPostComments = async (postId: string): Promise<PostComment[]> => {
  try {
    console.log('Database: Fetching comments for post:', postId);
    
    // TODO: Implement comments table
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Database: Error in getPostComments:', error);
    throw error;
  }
};

export const addComment = async (postId: string, userId: string, content: string): Promise<PostComment> => {
  try {
    console.log('Database: Adding comment to post:', postId, 'by user:', userId);
    
    // TODO: Implement comments table and logic
    throw new Error('Comments feature not yet implemented');
  } catch (error) {
    console.error('Database: Error in addComment:', error);
    throw error;
  }
};

// User photos functions
export const getUserPhotos = async (userId: string) => {
  try {
    console.log('Database: Fetching photos for user:', userId);
    
    const { data: photos, error } = await supabase
      .from('user_photos')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Database: Error fetching user photos:', error);
      throw error;
    }

    return photos || [];
  } catch (error) {
    console.error('Database: Error in getUserPhotos:', error);
    throw error;
  }
};

export const updateUserPhotos = async (userId: string, photos: any[]) => {
  try {
    console.log('Database: Updating photos for user:', userId);
    
    // Delete existing photos
    await supabase
      .from('user_photos')
      .delete()
      .eq('user_id', userId);

    // Insert new photos
    if (photos.length > 0) {
      const { error } = await supabase
        .from('user_photos')
        .insert(
          photos.map((photo, index) => ({
            user_id: userId,
            photo_url: photo.photo_url,
            is_primary: photo.is_primary,
            order_index: index,
          }))
        );

      if (error) {
        console.error('Database: Error updating user photos:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Database: Error in updateUserPhotos:', error);
    throw error;
  }
};

// Company review functions
export const createCompanyReview = async (
  companyId: string,
  userId: string,
  title: string,
  content: string,
  rating: number
): Promise<CompanyReview> => {
  try {
    console.log('Database: Creating review for company:', companyId);
    
    const { data: review, error } = await supabase
      .from('company_reviews')
      .insert({
        company_id: companyId,
        user_id: userId,
        title,
        content,
        rating,
        is_verified_purchase: false,
        helpful_count: 0,
      })
      .select(`
        *,
        user_profiles (
          id,
          first_name,
          last_name,
          avatar_url,
          verified
        )
      `)
      .single();

    if (error) {
      console.error('Database: Error creating review:', error);
      throw error;
    }

    return review;
  } catch (error) {
    console.error('Database: Error in createCompanyReview:', error);
    throw error;
  }
};

// Company claim functions
export const createCompanyClaim = async (
  companyId: string,
  userId: string,
  title: string,
  description: string,
  category: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
): Promise<CompanyClaim> => {
  try {
    console.log('Database: Creating claim for company:', companyId);
    
    const { data: claim, error } = await supabase
      .from('company_claims')
      .insert({
        company_id: companyId,
        user_id: userId,
        title,
        description,
        category,
        priority,
        status: 'pending',
      })
      .select(`
        *,
        user_profiles (
          id,
          first_name,
          last_name,
          avatar_url,
          verified
        )
      `)
      .single();

    if (error) {
      console.error('Database: Error creating claim:', error);
      throw error;
    }

    return claim;
  } catch (error) {
    console.error('Database: Error in createCompanyClaim:', error);
    throw error;
  }
};