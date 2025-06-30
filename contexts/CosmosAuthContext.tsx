import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'superadmin';
  permissions: string[];
  created_at: string;
}

interface CosmosAuthContextType {
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const CosmosAuthContext = createContext<CosmosAuthContextType | undefined>(undefined);

export const useCosmosAuth = () => {
  const context = useContext(CosmosAuthContext);
  if (!context) {
    throw new Error('useCosmosAuth must be used within a CosmosAuthProvider');
  }
  return context;
};

interface CosmosAuthProviderProps {
  children: React.ReactNode;
}

// Mock admin data for demo purposes
const mockAdmin: AdminProfile = {
  id: 'admin-1',
  name: 'System Administrator',
  email: 'admin@quejapp.com',
  role: 'superadmin',
  permissions: [
    'manage_companies',
    'manage_users',
    'manage_posts',
    'manage_billing',
    'manage_marketing',
    'manage_warnings',
    'view_analytics',
    'system_settings',
  ],
  created_at: new Date().toISOString(),
};

export const CosmosAuthProvider: React.FC<CosmosAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const clearError = useCallback(() => {
    console.log('CosmosAuthContext: Clearing error');
    setError(null);
  }, []);

  useEffect(() => {
    console.log('CosmosAuthContext: Initializing auth state');
    mounted.current = true;
    
    // Check for existing session
    const checkExistingSession = async () => {
      console.log('CosmosAuthContext: Checking for existing session on platform:', Platform.OS);
      try {
        let savedAdmin = null;

        if (Platform.OS === 'web') {
          console.log('CosmosAuthContext: Using web localStorage');
          savedAdmin = localStorage.getItem('cosmos_admin_session');
          console.log('CosmosAuthContext: Web localStorage check completed', !!savedAdmin);
        } else {
          console.log('CosmosAuthContext: Using React Native AsyncStorage');
          try {
            savedAdmin = await AsyncStorage.getItem('cosmos_admin_session');
            console.log('CosmosAuthContext: AsyncStorage check completed', !!savedAdmin);
          } catch (asyncError) {
            console.error('CosmosAuthContext: AsyncStorage error:', asyncError);
          }
        }
        
        if (savedAdmin && mounted.current) {
          try {
            const adminData = JSON.parse(savedAdmin);
            console.log('CosmosAuthContext: Found saved session for admin:', adminData.name);
            setAdmin(adminData);
            setError(null);
          } catch (parseError) {
            console.error('CosmosAuthContext: Error parsing saved session:', parseError);
            // Clear invalid session data
            if (Platform.OS === 'web') {
              localStorage.removeItem('cosmos_admin_session');
            } else {
              try {
                await AsyncStorage.removeItem('cosmos_admin_session');
              } catch (clearError) {
                console.error('CosmosAuthContext: Error clearing invalid session:', clearError);
              }
            }
          }
        }
      } catch (error) {
        console.error('CosmosAuthContext: Error checking existing session:', error);
      } finally {
        if (mounted.current) {
          console.log('CosmosAuthContext: Finished checking session, setting loading to false');
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
    
    console.log('CosmosAuthContext: Starting sign in for', email);
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate input
      if (!email || !password) {
        console.log('CosmosAuthContext: Missing email or password');
        throw new Error('Email and password are required');
      }

      const trimmedEmail = email.trim().toLowerCase();
      
      // For demo purposes, we'll use simple validation
      // In production, this would authenticate against a real backend
      if (trimmedEmail !== 'admin@quejapp.com' || password !== 'cosmos2024') {
        console.log('CosmosAuthContext: Invalid credentials');
        throw new Error('Invalid credentials. Use admin@quejapp.com / cosmos2024');
      }

      if (mounted.current) {
        console.log('CosmosAuthContext: Sign in successful for', mockAdmin.name);
        setAdmin(mockAdmin);
        
        // Save session to storage
        const sessionData = JSON.stringify(mockAdmin);
        if (Platform.OS === 'web') {
          console.log('CosmosAuthContext: Saving session to web localStorage');
          localStorage.setItem('cosmos_admin_session', sessionData);
          console.log('CosmosAuthContext: Saved session to web localStorage successfully');
        } else {
          try {
            console.log('CosmosAuthContext: Saving session to AsyncStorage');
            await AsyncStorage.setItem('cosmos_admin_session', sessionData);
            console.log('CosmosAuthContext: Saved session to AsyncStorage successfully');
          } catch (asyncError) {
            console.error('CosmosAuthContext: AsyncStorage save error:', asyncError);
          }
        }
      }
      
    } catch (error: any) {
      if (mounted.current) {
        console.log('CosmosAuthContext: Sign in error:', error.message);
        setError(error.message || 'Failed to sign in');
      }
      throw error;
    } finally {
      if (mounted.current) {
        console.log('CosmosAuthContext: Sign in process completed');
        setIsLoading(false);
      }
    }
  };

  const signOut = async () => {
    if (!mounted.current) return;
    
    console.log('CosmosAuthContext: Starting sign out');
    setIsLoading(true);
    
    try {
      // Clear session
      console.log('CosmosAuthContext: Removing session from storage');
      if (Platform.OS === 'web') {
        localStorage.removeItem('cosmos_admin_session');
        console.log('CosmosAuthContext: Removed session from web localStorage successfully');
      } else {
        try {
          await AsyncStorage.removeItem('cosmos_admin_session');
          console.log('CosmosAuthContext: Removed session from AsyncStorage successfully');
        } catch (asyncError) {
          console.error('CosmosAuthContext: AsyncStorage remove error:', asyncError);
        }
      }
      
      if (mounted.current) {
        console.log('CosmosAuthContext: Clearing admin state');
        setAdmin(null);
        setError(null);
      }
      
    } catch (error: any) {
      console.error('CosmosAuthContext: Sign out error:', error);
      if (mounted.current) {
        setError(error.message || 'Failed to sign out');
      }
      throw error;
    } finally {
      if (mounted.current) {
        console.log('CosmosAuthContext: Sign out completed');
        setIsLoading(false);
      }
    }
  };

  const value: CosmosAuthContextType = {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    error,
    signIn,
    signOut,
    clearError,
  };

  return (
    <CosmosAuthContext.Provider value={value}>
      {children}
    </CosmosAuthContext.Provider>
  );
};