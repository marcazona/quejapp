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
  coins_awarded: number | null;
  created_at: string | null;
  updated_at: string | null;
  user_profiles?: UserProfile;
}

export interface FullCompanyProfile extends Company {
  reviews?: CompanyReview[];
  claims?: CompanyClaim[];
  distance?: number;
}

// Sample companies data
const sampleCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    description: 'Leading technology solutions provider specializing in cloud computing and digital transformation.',
    logo_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    cover_image_url: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'GreenEarth Foods',
    description: 'Organic and sustainable food products for a healthier planet and lifestyle.',
    logo_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    cover_image_url: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Urban Fashion Co.',
    description: 'Trendy and affordable fashion for the modern urban lifestyle.',
    logo_url: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    cover_image_url: 'https://images.pexels.com/photos/1040946/pexels-photo-1040946.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'HealthFirst Clinic',
    description: 'Comprehensive healthcare services with a focus on preventive medicine.',
    logo_url: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    cover_image_url: 'https://images.pexels.com/photos/263401/pexels-photo-263401.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'EcoClean Services',
    description: 'Environmentally friendly cleaning services for homes and businesses.',
    logo_url: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    cover_image_url: 'https://images.pexels.com/photos/4239092/pexels-photo-4239092.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'AutoFix Garage',
    description: 'Professional automotive repair and maintenance services you can trust.',
    logo_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    cover_image_url: 'https://images.pexels.com/photos/3806289/pexels-photo-3806289.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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
    
    // For now, return sample companies
    // In a real app, this would fetch from a companies table
    const companies = sampleCompanies.map(company => ({
      ...company,
      distance: userLocation ? Math.random() * 10 : undefined, // Random distance for demo
    }));

    console.log('Database: Found', companies.length, 'companies');
    return companies;
  } catch (error) {
    console.error('Database: Error in getDiscoveryCompanies:', error);
    throw error;
  }
};

// Get company by ID with full details
export const getCompanyById = async (companyId: string): Promise<FullCompanyProfile | null> => {
  try {
    console.log('Database: Fetching company by ID:', companyId);
    
    const company = sampleCompanies.find(c => c.id === companyId);
    if (!company) {
      return null;
    }

    // Add sample reviews and claims
    const sampleReviews: CompanyReview[] = [
      {
        id: '1',
        company_id: companyId,
        user_id: 'user1',
        rating: 5,
        title: 'Excellent service!',
        content: 'Really impressed with the quality and professionalism. Highly recommend!',
        is_verified_purchase: true,
        helpful_count: 12,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        user_profiles: {
          id: 'user1',
          first_name: 'Sarah',
          last_name: 'Johnson',
          phone: null,
          birth_date: null,
          avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: true,
          reputation: 85,
          total_posts: 23,
          total_likes: 156,
          created_at: null,
          updated_at: null,
        },
      },
      {
        id: '2',
        company_id: companyId,
        user_id: 'user2',
        rating: 4,
        title: 'Good experience overall',
        content: 'Service was good, though there was a slight delay in delivery. Would use again.',
        is_verified_purchase: true,
        helpful_count: 8,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        user_profiles: {
          id: 'user2',
          first_name: 'Mike',
          last_name: 'Chen',
          phone: null,
          birth_date: null,
          avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: false,
          reputation: 67,
          total_posts: 15,
          total_likes: 89,
          created_at: null,
          updated_at: null,
        },
      },
    ];

    const sampleClaims: CompanyClaim[] = [
      {
        id: '1',
        company_id: companyId,
        user_id: 'user3',
        title: 'Product defect issue',
        description: 'Received a damaged product and need replacement or refund.',
        status: 'in_progress',
        priority: 'medium',
        category: 'Product Quality',
        resolution_notes: 'Replacement has been shipped.',
        coins_awarded: 50,
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        user_profiles: {
          id: 'user3',
          first_name: 'Emma',
          last_name: 'Davis',
          phone: null,
          birth_date: null,
          avatar_url: 'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: true,
          reputation: 92,
          total_posts: 31,
          total_likes: 203,
          created_at: null,
          updated_at: null,
        },
      },
    ];

    return {
      ...company,
      reviews: sampleReviews,
      claims: sampleClaims,
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
    
    let filteredCompanies = sampleCompanies;

    // Apply text search
    if (query.trim()) {
      filteredCompanies = filteredCompanies.filter(company =>
        company.name.toLowerCase().includes(query.toLowerCase()) ||
        company.description.toLowerCase().includes(query.toLowerCase()) ||
        company.industry.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply filters
    if (filters.industry) {
      filteredCompanies = filteredCompanies.filter(company =>
        company.industry === filters.industry
      );
    }

    if (filters.verified) {
      filteredCompanies = filteredCompanies.filter(company => company.verified);
    }

    if (filters.minRating) {
      filteredCompanies = filteredCompanies.filter(company =>
        (company.rating || 0) >= filters.minRating!
      );
    }

    // Add distance if location provided
    const companiesWithDistance = filteredCompanies.map(company => ({
      ...company,
      distance: userLocation ? Math.random() * 10 : undefined,
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
    
    // Mock conversations with different companies
    const mockConversations: ChatConversation[] = [
      {
        id: 'conv_techcorp_' + userId,
        user_id: userId,
        company_id: '1',
        status: 'active',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        company: sampleCompanies[0],
        last_message: {
          content: 'Thank you for contacting us. How can we help?',
          created_at: new Date().toISOString(),
          sender_type: 'company',
          read_at: null,
        },
      },
      {
        id: 'conv_greenearth_' + userId,
        user_id: userId,
        company_id: '2',
        status: 'active',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        company: sampleCompanies[1],
        last_message: {
          content: 'Your order has been processed successfully.',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          sender_type: 'company',
          read_at: null,
        },
      },
    ];

    return mockConversations;
  } catch (error) {
    console.error('Database: Error in getUserChatConversations:', error);
    throw error;
  }
};

export const startLiveChatWithCompany = async (userId: string, companyId: string): Promise<ChatConversation> => {
  try {
    console.log('Database: Starting live chat between user:', userId, 'and company:', companyId);
    
    // Create unique conversation ID based on user and company
    const conversationId = `conv_${companyId}_${userId}_${Date.now()}`;
    
    // Find the company
    const company = sampleCompanies.find(c => c.id === companyId);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Create new conversation object
    const newConversation: ChatConversation = {
      id: conversationId,
      user_id: userId,
      company_id: companyId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      company: company,
      last_message: {
        content: `Hello! Welcome to ${company.name}. How can we assist you today?`,
        created_at: new Date().toISOString(),
        sender_type: 'company',
        read_at: null,
      },
    };
    
    return newConversation;
  } catch (error) {
    console.error('Database: Error in startLiveChatWithCompany:', error);
    throw error;
  }
};

// Legacy functions for backward compatibility
export const getUserPhotos = async (userId: string) => {
  return [];
};

export const updateUserPhotos = async (userId: string, photos: any[]) => {
  // No-op for now
};

export const getUserPosts = async (currentUserId?: string) => {
  return [];
};