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
  token_verified: boolean;
}

interface CosmosAuthContextType {
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsToken: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  verifyToken: (token: string) => Promise<void>;
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

// Main superadmin profile
const superAdmin: AdminProfile = {
  id: 'admin-superadmin-1',
  name: 'System Administrator',
  email: 'admin@marcazona.com',
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
    'full_access',
  ],
  created_at: new Date().toISOString(),
  token_verified: false,
};

// Authentication tokens for different admin levels
const authTokens = {
  'admin@marcazona.com': 'CosmosAcess2050!', // Master superadmin token
};

export const CosmosAuthProvider: React.FC<CosmosAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsToken, setNeedsToken] = useState(false);
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
            
            // Check if token is verified in saved session
            if (adminData.token_verified) {
              setAdmin(adminData);
              setError(null);
            } else {
              // Session exists but token not verified, prompt for token
              setAdmin({ ...adminData, token_verified: false });
              setNeedsToken(true);
            }
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
      
      // Authenticate against the main superadmin credentials
      if (trimmedEmail !== 'admin@marcazona.com' || password !== 'Betelgeuse2030!') {
        console.log('CosmosAuthContext: Invalid credentials');
        throw new Error('Invalid credentials. Please check your email and password.');
      }

      if (mounted.current) {
        console.log('CosmosAuthContext: Credentials verified, now requesting token');
        
        // Set admin but mark as needing token verification
        const adminWithoutToken = { ...superAdmin, token_verified: false };
        setAdmin(adminWithoutToken);
        setNeedsToken(true);
        
        // Save partial session (without token verification)
        const sessionData = JSON.stringify(adminWithoutToken);
        if (Platform.OS === 'web') {
          localStorage.setItem('cosmos_admin_session', sessionData);
        } else {
          try {
            await AsyncStorage.setItem('cosmos_admin_session', sessionData);
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

  const verifyToken = async (token: string) => {
    if (!mounted.current || !admin) return;
    
    console.log('CosmosAuthContext: Verifying authentication token');
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate token
      if (!token.trim()) {
        throw new Error('Authentication token is required');
      }

      const expectedToken = authTokens[admin.email as keyof typeof authTokens];
      
      if (token.trim() !== expectedToken) {
        console.log('CosmosAuthContext: Invalid authentication token');
        throw new Error('Invalid authentication token. Please check your token and try again.');
      }

      if (mounted.current) {
        console.log('CosmosAuthContext: Token verified successfully');
        
        // Update admin with token verification
        const verifiedAdmin = { ...admin, token_verified: true };
        setAdmin(verifiedAdmin);
        setNeedsToken(false);
        
        // Save complete session with token verification
        const sessionData = JSON.stringify(verifiedAdmin);
        if (Platform.OS === 'web') {
          localStorage.setItem('cosmos_admin_session', sessionData);
        } else {
          try {
            await AsyncStorage.setItem('cosmos_admin_session', sessionData);
          } catch (asyncError) {
            console.error('CosmosAuthContext: AsyncStorage save error:', asyncError);
          }
        }
      }
      
    } catch (error: any) {
      if (mounted.current) {
        console.log('CosmosAuthContext: Token verification error:', error.message);
        setError(error.message || 'Failed to verify token');
      }
      throw error;
    } finally {
      if (mounted.current) {
        console.log('CosmosAuthContext: Token verification process completed');
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
        setNeedsToken(false);
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
    isAuthenticated: !!admin && admin.token_verified,
    isLoading,
    error,
    needsToken,
    signIn,
    verifyToken,
    signOut,
    clearError,
  };

  return (
    <CosmosAuthContext.Provider value={value}>
      {children}
    </CosmosAuthContext.Provider>
  );
};