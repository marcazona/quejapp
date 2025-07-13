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
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }

    // Add distance calculation if user location is provided
    const companiesWithDistance = (companies || []).map(company => ({
      ...company,
      distance: userLocation ? Math.random() * 10 : undefined, // TODO: Calculate real distance
    }));

    console.log('Database: Found', companiesWithDistance.length, 'companies');
    return companiesWithDistance;
  } catch (error) {
    console.error('Database: Error in getDiscoveryCompanies:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
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
      return null;
    }

    if (!company) {
      return null;
    }
    
    // Count qudos and claims instead of fetching them
    const { data: qudosCount, error: qudosError } = await supabase
      .from('posts')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('post_type', 'qudo');
      
    const { data: claimsCount, error: claimsError } = await supabase
      .from('posts')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('post_type', 'claim');
    
    if (qudosError) console.error('Database: Error counting qudos:', qudosError);
    if (claimsError) console.error('Database: Error counting claims:', claimsError);
    
    return {
      ...company,
      total_reviews: qudosCount?.length || 0,
      total_claims: claimsCount?.length || 0,
    };
  } catch (error) {
    console.error('Database: Error in getCompanyById:', error);
    return null;
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
      return [];
    }

    // Add distance if location provided
    const companiesWithDistance = (companies || []).map(company => ({
      ...company,
      distance: userLocation ? Math.random() * 10 : undefined, // TODO: Calculate real distance
    }));

    console.log('Database: Returning', companiesWithDistance.length, 'filtered companies');
    return companiesWithDistance;
  } catch (error) {
    console.error('Database: Error in searchCompanies:', error);
    return [];
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
      return [];
    }

    // Get last message for each conversation
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conv) => {
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
    return [];
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
      return [];
    }

    return posts || [];
  } catch (error) {
    console.error('Database: Error in getUserPosts:', error);
    return [];
  }
};

// Get posts for a specific company
export const getUserPostsForCompany = async (companyId: string): Promise<Post[]> => {
  try {
    console.log('Database: Fetching posts for company:', companyId);
    
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
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database: Error fetching company posts:', error);
      return [];
    }

    return posts || [];
  } catch (error) {
    console.error('Database: Error in getUserPostsForCompany:', error);
    return [];
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

// Create a post about a company
export const createCompanyPost = async (
  userId: string, 
  companyId: string, 
  content: string, 
  postType: 'qudo' | 'claim',
  photoUrl?: string
): Promise<Post> => {
  try {
    console.log('Database: Creating new post for company:', companyId);
    
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        company_id: companyId,
        content,
        photo_url: photoUrl,
        post_type: postType,
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
      console.error('Database: Error creating company post:', error);
      throw error;
    }

    // Update company stats based on post type
    if (postType === 'qudo') {
      await supabase.rpc('increment_company_reviews', { company_id: companyId });
    } else if (postType === 'claim') {
      await supabase.rpc('increment_company_claims', { company_id: companyId });
    }

    return post;
  } catch (error) {
    console.error('Database: Error in createCompanyPost:', error);
    throw error;
  }
};

export const likePost = async (postId: string, userId: string): Promise<void> => {
  try {
    console.log('Database: Liking post:', postId, 'by user:', userId);
    
    // Check if user already liked this post
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike the post
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Database: Error unliking post:', deleteError);
        throw deleteError;
      }

      // Decrement likes count
      const { error: decrementError } = await supabase.rpc('decrement_post_likes', {
        post_id: postId
      });

      if (decrementError) {
        console.error('Database: Error decrementing likes:', decrementError);
      }
    } else {
      // Like the post
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId,
        });

      if (insertError) {
        console.error('Database: Error liking post:', insertError);
        throw insertError;
      }

      // Increment likes count
      const { error: incrementError } = await supabase.rpc('increment_post_likes', {
        post_id: postId
      });

      if (incrementError) {
        console.error('Database: Error incrementing likes:', incrementError);
      }
    }
  } catch (error) {
    console.error('Database: Error in likePost:', error);
    throw error;
  }
};

export const getPostComments = async (postId: string): Promise<PostComment[]> => {
  try {
    console.log('Database: Fetching comments for post:', postId);
    
    const { data: comments, error } = await supabase
      .from('post_comments')
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
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database: Error fetching comments:', error);
      return [];
    }

    return comments || [];
  } catch (error) {
    console.error('Database: Error in getPostComments:', error);
    return [];
  }
};

export const addComment = async (postId: string, userId: string, content: string): Promise<PostComment> => {
  try {
    console.log('Database: Adding comment to post:', postId, 'by user:', userId);
    
    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
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
      console.error('Database: Error adding comment:', error);
      throw error;
    }

    return comment;
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
      return [];
    }

    return photos || [];
  } catch (error) {
    console.error('Database: Error in getUserPhotos:', error);
    return [];
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

// Create sample companies for testing
export const createSampleCompanies = async (): Promise<void> => {
  try {
    console.log('Database: Creating sample companies...');
    
    const sampleCompanies = [
      {
        name: 'TechCorp Solutions',
        description: 'Leading technology solutions provider specializing in cloud computing and digital transformation.',
        logo_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
        industry: 'Technology',
        website: 'https://techcorp.com',
        phone: '+1-555-0123',
        email: 'contact@techcorp.com',
        address: '123 Tech Street',
        city: 'San Francisco',
        country: 'USA',
        rating: 4.2,
        total_reviews: 156,
        total_claims: 23,
        verified: true,
        is_active: true,
      },
      {
        name: 'GreenEarth Foods',
        description: 'Organic and sustainable food products for a healthier planet and lifestyle.',
        logo_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
        industry: 'Food & Beverage',
        website: 'https://greenearthfoods.com',
        phone: '+1-555-0456',
        email: 'hello@greenearthfoods.com',
        address: '456 Green Avenue',
        city: 'Portland',
        country: 'USA',
        rating: 4.7,
        total_reviews: 89,
        total_claims: 12,
        verified: true,
        is_active: true,
      },
      {
        name: 'Urban Fashion Co.',
        description: 'Trendy and affordable fashion for the modern urban lifestyle.',
        logo_url: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
        industry: 'Fashion & Retail',
        website: 'https://urbanfashion.com',
        phone: '+1-555-0789',
        email: 'style@urbanfashion.com',
        address: '789 Fashion Boulevard',
        city: 'New York',
        country: 'USA',
        rating: 3.9,
        total_reviews: 234,
        total_claims: 45,
        verified: false,
        is_active: true,
      },
      {
        name: 'HealthFirst Clinic',
        description: 'Comprehensive healthcare services with a focus on preventive medicine.',
        logo_url: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
        industry: 'Healthcare',
        website: 'https://healthfirst.com',
        phone: '+1-555-0321',
        email: 'care@healthfirst.com',
        address: '321 Health Plaza',
        city: 'Chicago',
        country: 'USA',
        rating: 4.5,
        total_reviews: 67,
        total_claims: 8,
        verified: true,
        is_active: true,
      },
      {
        name: 'EcoClean Services',
        description: 'Environmentally friendly cleaning services for homes and businesses.',
        logo_url: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
        industry: 'Services',
        website: 'https://ecoclean.com',
        phone: '+1-555-0654',
        email: 'info@ecoclean.com',
        address: '654 Clean Street',
        city: 'Seattle',
        country: 'USA',
        rating: 4.3,
        total_reviews: 123,
        total_claims: 19,
        verified: true,
        is_active: true,
      },
      {
        name: 'AutoFix Garage',
        description: 'Professional automotive repair and maintenance services you can trust.',
        logo_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
        industry: 'Automotive',
        website: 'https://autofix.com',
        phone: '+1-555-0987',
        email: 'service@autofix.com',
        address: '987 Motor Way',
        city: 'Detroit',
        country: 'USA',
        rating: 4.1,
        total_reviews: 178,
        total_claims: 34,
        verified: false,
        is_active: true,
      },
    ];

    // Insert companies one by one to avoid conflicts
    for (const company of sampleCompanies) {
      // Check if company with same name already exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('name', company.name)
        .maybeSingle();
      
      if (!existing) {
        const { error } = await supabase
          .from('companies')
          .insert([company]);
        
        if (error) {
          console.error('Database: Error inserting company:', company.name, error);
        } else {
          console.log('Database: Created company:', company.name);
        }
      } else {
        console.log('Database: Company already exists:', company.name);
      }
    }

    console.log('Database: Sample companies creation completed');
  } catch (error) {
    console.error('Database: Error in createSampleCompanies:', error);
    throw error;
  }
};