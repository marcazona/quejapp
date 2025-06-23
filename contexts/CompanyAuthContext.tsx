import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

interface CompanyProfile {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  industry: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  verified: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CompanyAuthContextType {
  company: CompanyProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const CompanyAuthContext = createContext<CompanyAuthContextType | undefined>(undefined);

export const useCompanyAuth = () => {
  const context = useContext(CompanyAuthContext);
  if (!context) {
    throw new Error('useCompanyAuth must be used within a CompanyAuthProvider');
  }
  return context;
};

interface CompanyAuthProviderProps {
  children: React.ReactNode;
}

// Mock company data for demo purposes
const mockCompanies: Record<string, CompanyProfile> = {
  'techcorp@company.com': {
    id: '1',
    name: 'TechCorp Solutions',
    description: 'Leading technology solutions provider specializing in cloud computing and digital transformation.',
    logo_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    industry: 'Technology',
    website: 'https://techcorp.com',
    phone: '+1-555-0123',
    email: 'contact@techcorp.com',
    verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'greenearth@company.com': {
    id: '2',
    name: 'GreenEarth Foods',
    description: 'Organic and sustainable food products for a healthier planet and lifestyle.',
    logo_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    industry: 'Food & Beverage',
    website: 'https://greenearthfoods.com',
    phone: '+1-555-0456',
    email: 'hello@greenearthfoods.com',
    verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'urbanfashion@company.com': {
    id: '3',
    name: 'Urban Fashion Co.',
    description: 'Trendy and affordable fashion for the modern urban lifestyle.',
    logo_url: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    industry: 'Fashion & Retail',
    website: 'https://urbanfashion.com',
    phone: '+1-555-0789',
    email: 'style@urbanfashion.com',
    verified: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export const CompanyAuthProvider: React.FC<CompanyAuthProviderProps> = ({ children }) => {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const clearError = useCallback(() => {
    console.log('CompanyAuthContext: Clearing error');
    setError(null);
  }, []);

  useEffect(() => {
    console.log('CompanyAuthContext: Initializing auth state');
    mounted.current = true;
    
    // Check for existing session in localStorage
    const checkExistingSession = async () => {
      console.log('CompanyAuthContext: Checking for existing session on platform:', Platform.OS);
      try {
        let savedCompany = null;

        // Platform-specific storage access
        if (Platform.OS === 'web') {
          console.log('CompanyAuthContext: Using web localStorage');
          savedCompany = localStorage.getItem('starship_company_session');
          console.log('CompanyAuthContext: Web localStorage check completed', !!savedCompany);
        } else {
          console.log('CompanyAuthContext: Using React Native AsyncStorage');
          try {
            savedCompany = await AsyncStorage.getItem('starship_company_session');
            console.log('CompanyAuthContext: AsyncStorage check completed', !!savedCompany);
          } catch (asyncError) {
            console.error('CompanyAuthContext: AsyncStorage error:', asyncError);
          }
        }
        
        if (savedCompany && mounted.current) {
          try {
            const companyData = JSON.parse(savedCompany);
            console.log('CompanyAuthContext: Found saved session for company:', companyData.name);
            setCompany(companyData);
            setError(null); // Clear any previous errors
          } catch (parseError) {
            console.error('CompanyAuthContext: Error parsing saved session:', parseError);
            // Clear invalid session data
            if (Platform.OS === 'web') {
              localStorage.removeItem('starship_company_session');
            } else {
              try {
                await AsyncStorage.removeItem('starship_company_session');
              } catch (clearError) {
                console.error('CompanyAuthContext: Error clearing invalid session:', clearError);
              }
            }
          }
        }
      } catch (error) {
        console.error('CompanyAuthContext: Error checking existing session:', error);
      } finally {
        if (mounted.current) {
          console.log('CompanyAuthContext: Finished checking session, setting loading to false');
          setIsLoading(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      mounted.current = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!mounted.current) return;
    
    console.log('CompanyAuthContext: Starting sign in for', email);
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate input
      if (!email || !password) {
        console.log('CompanyAuthContext: Missing email or password');
        throw new Error('Email and password are required');
      }

      const trimmedEmail = email.trim().toLowerCase();
      
      // For demo purposes, we'll use simple validation
      // In production, this would authenticate against a real backend
      if (password !== 'company123') {
        console.log('CompanyAuthContext: Invalid password');
        throw new Error('Invalid credentials. Use password: company123');
      }

      const companyData = mockCompanies[trimmedEmail];
      if (!companyData) {
        console.log('CompanyAuthContext: Company not found for email', trimmedEmail);
        throw new Error('Company not found. Try: techcorp@company.com, greenearth@company.com, or urbanfashion@company.com');
      }

      if (mounted.current) {
        console.log('CompanyAuthContext: Sign in successful for', companyData.name);
        setCompany(companyData);
        
        // Save session to localStorage
        const sessionData = JSON.stringify(companyData);
        if (Platform.OS === 'web') {
          console.log('CompanyAuthContext: Saving session to web localStorage');
          localStorage.setItem('starship_company_session', sessionData);
          console.log('CompanyAuthContext: Saved session to web localStorage successfully');
        } else {
          try {
            console.log('CompanyAuthContext: Saving session to AsyncStorage');
            await AsyncStorage.setItem('starship_company_session', sessionData);
            console.log('CompanyAuthContext: Saved session to AsyncStorage successfully');
          } catch (asyncError) {
            console.error('CompanyAuthContext: AsyncStorage save error:', asyncError);
          }
        }
      }
      
    } catch (error: any) {
      if (mounted.current) {
        console.log('CompanyAuthContext: Sign in error:', error.message);
        setError(error.message || 'Failed to sign in');
      }
      throw error;
    } finally {
      if (mounted.current) {
        console.log('CompanyAuthContext: Sign in process completed');
        setIsLoading(false);
      }
    }
  };

  const signOut = async () => {
    if (!mounted.current) return;
    
    console.log('CompanyAuthContext: Starting sign out');
    setIsLoading(true);
    
    try {
      // Clear session
      console.log('CompanyAuthContext: Removing session from storage');
      if (Platform.OS === 'web') {
        localStorage.removeItem('starship_company_session');
        console.log('CompanyAuthContext: Removed session from web localStorage successfully');
      } else {
        try {
          await AsyncStorage.removeItem('starship_company_session');
          console.log('CompanyAuthContext: Removed session from AsyncStorage successfully');
        } catch (asyncError) {
          console.error('CompanyAuthContext: AsyncStorage remove error:', asyncError);
        }
      }
      
      if (mounted.current) {
        console.log('CompanyAuthContext: Clearing company state');
        setCompany(null);
        setError(null);
      }
      
    } catch (error: any) {
      console.error('CompanyAuthContext: Sign out error:', error);
      if (mounted.current) {
        setError(error.message || 'Failed to sign out');
      }
      throw error;
    } finally {
      if (mounted.current) {
        console.log('CompanyAuthContext: Sign out completed');
        setIsLoading(false);
      }
    }
  };

  const value: CompanyAuthContextType = {
    company,
    isAuthenticated: !!company,
    isLoading,
    error,
    signIn,
    signOut,
    clearError,
  };

  return (
    <CompanyAuthContext.Provider value={value}>
      {children}
    </CompanyAuthContext.Provider>
  );
};