import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase, type Database } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Global flag to prevent redundant auth initialization across component remounts
let _authInitialized = false;
let _authSubscription: any = null;

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (userData: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  console.log('AuthProvider: Rendering - isLoading:', isLoading, 'error:', error, 'user:', !!user);

  const clearError = useCallback(() => {
    console.log('AuthProvider: Clearing error');
    setError(null);
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateStrongPassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const isNetworkError = (error: any): boolean => {
    return error.message?.includes('Failed to fetch') || 
           error.message?.includes('Network request failed') ||
           error.message?.includes('fetch') ||
           error.name === 'TypeError';
  };

  const fetchUserProfile = useCallback(async (userId: string): Promise<void> => {
    if (!mounted.current) {
      console.log('AuthProvider: Component unmounted, aborting fetchUserProfile');
      return;
    }

    console.log('AuthProvider: Fetching user profile for userId:', userId);
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Profile fetch timeout - request took too long'));
        }, 10000); // 10 second timeout
      });

      // Create the supabase query promise
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Race the query against the timeout
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (!mounted.current) {
        console.log('AuthProvider: Component unmounted during fetch');
        return;
      }

      if (error) {
        console.error('AuthProvider: Error fetching user profile:', error);
        
        if (isNetworkError(error) || error.message?.includes('timeout')) {
          setError('Unable to connect to the server. Operating in offline mode.');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        setError(`Failed to load user profile: ${error.message}`);
        setUser(null);
        setIsLoading(false);
      } else if (data) {
        console.log('AuthProvider: User profile loaded successfully:', data.first_name, data.last_name);
        setUser(data);
        setError(null);
        setIsLoading(false);
      } else {
        console.log('AuthProvider: No user profile found for user:', userId);
        setUser(null);
        setIsLoading(false);
      }
    } catch (error: any) {
      if (!mounted.current) {
        console.log('AuthProvider: Component unmounted during error handling');
        return;
      }
      
      console.error('AuthProvider: Exception in fetchUserProfile:', error);
      
      if (isNetworkError(error) || error.message?.includes('timeout')) {
        setError('Unable to connect to the server. Operating in offline mode.');
      } else {
        setError(error.message || 'Failed to load user profile');
      }
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    if (!mounted.current) {
      console.log('AuthProvider: Component unmounted, skipping auth state change');
      return;
    }

    console.log('AuthProvider: Auth state changed - event:', event, 'userId:', session?.user?.id || 'none');
    
    setSession(session);
    
    if (session?.user) {
      console.log('AuthProvider: User authenticated, fetching profile');
      await fetchUserProfile(session.user.id);
    } else {
      console.log('AuthProvider: User not authenticated, clearing user data');
      if (mounted.current) {
        setUser(null);
        setError(null);
        setIsLoading(false);
      }
    }
  }, [fetchUserProfile]);

  const initializeAuth = useCallback(async () => {
    if (_authInitialized || !mounted.current) {
      console.log('AuthProvider: Already initialized or unmounted, skipping...');
      return;
    }
    
    _authInitialized = true;
    
    try {
      console.log('AuthProvider: Starting authentication initialization...');

      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('AuthProvider: Missing Supabase environment variables');
        if (mounted.current) {
          setError('App configuration error: Missing Supabase credentials.');
          setIsLoading(false);
        }
        return;
      }

      console.log('AuthProvider: Environment variables found, getting session...');

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('AuthProvider: Error getting session:', error);
        if (mounted.current) {
          if (isNetworkError(error)) {
            setError('Unable to connect to authentication service. Operating in offline mode.');
          } else {
            setError(`Authentication initialization failed: ${error.message}`);
          }
          setIsLoading(false);
        }
        return;
      }

      console.log('AuthProvider: Session retrieved - user:', session?.user?.id ? 'Found' : 'None');

      if (mounted.current) {
        setSession(session);
        if (session?.user) {
          console.log('AuthProvider: Session found, fetching user profile');
          await fetchUserProfile(session.user.id);
        } else {
          console.log('AuthProvider: No session found, setting loading to false');
          setIsLoading(false);
        }
      }

      console.log('AuthProvider: Authentication initialization completed');
    } catch (error: any) {
      console.error('AuthProvider: Exception during auth initialization:', error);
      if (mounted.current) {
        if (isNetworkError(error)) {
          setError('Unable to connect to the server. Operating in offline mode.');
        } else {
          setError(error.message || 'Failed to initialize authentication');
        }
        setIsLoading(false);
      }
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    console.log('AuthProvider: useEffect triggered - setting up auth');
    mounted.current = true;
    
    // Set the flag immediately to prevent re-initialization
    if (_authInitialized) {
      console.log('AuthProvider: Already initialized, skipping setup');
      return;
    }
    _authInitialized = true;

    // Only set up subscription if we don't have one
    if (!_authSubscription) {
      console.log('AuthProvider: Setting up auth state listener');
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(handleAuthStateChange);
      _authSubscription = subscription;
    }

    console.log('AuthProvider: Starting auth initialization');
    initializeAuth();

    return () => {
      console.log('AuthProvider: Cleanup - unmounting component');
      mounted.current = false;
      // Don't unsubscribe or reset the flag on component unmount
      // This allows the subscription to persist across remounts
    };
  }, [handleAuthStateChange, initializeAuth]);

  const signIn = async (email: string, password: string) => {
    if (!mounted.current) return;
    
    console.log('AuthProvider: Starting signIn for email:', email);
    setIsLoading(true);
    setError(null);
    
    try {
      if (!email || !password) {
        const error = new Error('Email and password are required');
        if (mounted.current) {
          setError(error.message);
          setIsLoading(false);
        }
        throw error;
      }

      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        const error = new Error('Email and password cannot be empty');
        if (mounted.current) {
          setError(error.message);
          setIsLoading(false);
        }
        throw error;
      }

      if (!validateEmail(trimmedEmail)) {
        const error = new Error('Please enter a valid email address');
        if (mounted.current) {
          setError(error.message);
          setIsLoading(false);
        }
        throw error;
      }

      if (!validatePassword(trimmedPassword)) {
        const error = new Error('Password must be at least 6 characters long');
        if (mounted.current) {
          setError(error.message);
          setIsLoading(false);
        }
        throw error;
      }

      const lowerEmail = trimmedEmail.toLowerCase();

      console.log('AuthProvider: Attempting Supabase authentication');

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: lowerEmail,
        password: trimmedPassword,
      });

      if (authError) {
        console.log('AuthProvider: Authentication failed:', authError.message);
        
        let userMessage: string;
        if (isNetworkError(authError)) {
          userMessage = 'Unable to connect to authentication service. Please check your internet connection.';
        } else {
          switch (authError.message) {
            case 'Invalid login credentials':
              userMessage = 'The email or password you entered is incorrect.';
              break;
            case 'Email not confirmed':
              userMessage = 'Please verify your email address before signing in.';
              break;
            case 'Too many requests':
              userMessage = 'Too many login attempts. Please wait a few minutes.';
              break;
            case 'User not found':
              userMessage = 'No account found with this email address.';
              break;
            default:
              userMessage = `Sign in failed: ${authError.message}`;
          }
        }
        
        const error = new Error(userMessage);
        if (mounted.current) {
          setError(error.message);
          setIsLoading(false);
        }
        throw error;
      }

      if (!data?.user) {
        const error = new Error('Authentication failed. Please try again.');
        if (mounted.current) {
          setError(error.message);
          setIsLoading(false);
        }
        throw error;
      }

      console.log('AuthProvider: Authentication successful for user:', data.user.id);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError && !isNetworkError(profileError)) {
          console.error('AuthProvider: User profile verification failed:', profileError);
          await supabase.auth.signOut();
          const error = new Error('Account verification failed. Please contact support.');
          if (mounted.current) {
            setError(error.message);
            setIsLoading(false);
          }
          throw error;
        }

        if (!profileData && !isNetworkError(profileError)) {
          console.error('AuthProvider: User profile not found for authenticated user');
          await supabase.auth.signOut();
          const error = new Error('Account setup incomplete. Please contact support.');
          if (mounted.current) {
            setError(error.message);
            setIsLoading(false);
          }
          throw error;
        }

        console.log('AuthProvider: User profile verification successful');
      } catch (profileError: any) {
        if (!isNetworkError(profileError)) {
          console.error('AuthProvider: Profile verification error:', profileError);
          await supabase.auth.signOut();
          const error = new Error('Account verification failed. Please try again.');
          if (mounted.current) {
            setError(error.message);
            setIsLoading(false);
          }
          throw error;
        }
        console.log('AuthProvider: Network error during profile verification, continuing...');
      }

      console.log('AuthProvider: Sign in process completed successfully');
      
    } catch (error: any) {
      if (error.message.includes('email or password') || error.message.includes('Invalid login credentials')) {
        console.log('AuthProvider: Sign in failed - invalid credentials provided');
      } else {
        console.error('AuthProvider: Sign in error:', error);
      }
      
      if (mounted.current && !error.message) {
        setError('An unexpected error occurred during sign in');
        setIsLoading(false);
      }
      throw error;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  const signUp = async (userData: SignUpData) => {
    if (!mounted.current) return;
    
    console.log('AuthProvider: Starting signUp for email:', userData.email);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('AuthProvider: Starting real user signup process...');

      if (!userData.firstName.trim() || !userData.lastName.trim()) {
        throw new Error('First name and last name are required');
      }

      if (userData.firstName.trim().length < 2 || userData.lastName.trim().length < 2) {
        throw new Error('First name and last name must be at least 2 characters long');
      }

      if (!validateEmail(userData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const lowerEmail = userData.email.trim().toLowerCase();

      if (!validateStrongPassword(userData.password)) {
        throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, and number');
      }

      if (!userData.phone.trim()) {
        throw new Error('Phone number is required');
      }

      const phoneDigits = userData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      if (!userData.birthDate.trim()) {
        throw new Error('Birth date is required');
      }

      const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
      if (!dateRegex.test(userData.birthDate)) {
        throw new Error('Please enter birth date in MM/DD/YYYY format');
      }

      const [month, day, year] = userData.birthDate.split('/').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      
      if (birthDate > today) {
        throw new Error('Birth date cannot be in the future');
      }

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 13) {
        throw new Error('You must be at least 13 years old to create an account');
      }

      if (age > 120) {
        throw new Error('Please enter a valid birth date');
      }

      console.log('AuthProvider: Creating new user account...');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: lowerEmail,
        password: userData.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            first_name: userData.firstName.trim(),
            last_name: userData.lastName.trim(),
          }
        }
      });

      if (authError) {
        console.error('AuthProvider: Auth signup error:', authError);
        
        if (authError.message === 'User already registered') {
          throw new Error('This email is already registered. Please sign in or use a different email.');
        }
        
        if (isNetworkError(authError)) {
          throw new Error('Unable to connect to authentication service. Please check your internet connection.');
        }

        if (authError.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters long');
        }
        
        throw new Error(authError.message || 'Failed to create account');
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('AuthProvider: Auth user created successfully:', authData.user.id);

      const formatDateForDB = (dateString: string) => {
        const [month, day, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      const formattedBirthDate = formatDateForDB(userData.birthDate);

      const profileData = {
        id: authData.user.id,
        first_name: userData.firstName.trim(),
        last_name: userData.lastName.trim(),
        phone: userData.phone.trim(),
        birth_date: formattedBirthDate,
        avatar_url: null,
        verified: false,
        reputation: 0,
        total_posts: 0,
        total_likes: 0,
      };

      console.log('AuthProvider: Creating user profile...');

      let profileResult;
      let profileError;
      let retries = 3;

      while (retries > 0) {
        const { data, error } = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single();

        if (!error) {
          profileResult = data;
          break;
        }

        profileError = error;
        retries--;
        
        if (retries > 0 && isNetworkError(error)) {
          console.log(`AuthProvider: Profile creation failed, retrying... (${retries} attempts left)`);
          await sleep(1000);
        } else {
          break;
        }
      }

      if (profileError) {
        console.error('AuthProvider: Error creating user profile:', profileError);

        if (profileError.code === '23505') {
          console.log('AuthProvider: User profile already exists, treating as successful signup');
          return;
        }

        if (!isNetworkError(profileError)) {
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
          } catch (cleanupError) {
            console.error('AuthProvider: Failed to clean up auth user:', cleanupError);
          }
        }
        
        if (isNetworkError(profileError)) {
          throw new Error('Unable to connect to the database. Please check your internet connection.');
        }
        
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('AuthProvider: Real user account created successfully:', profileResult);

    } catch (error: any) {
      console.error('AuthProvider: Signup error:', error);
      if (mounted.current) {
        setError(error.message || 'Failed to create account');
        setIsLoading(false);
      }
      throw error;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  const signOut = async () => {
    if (!mounted.current) return;
    
    console.log('AuthProvider: Starting sign out process...');
    setIsLoading(true);
    setError(null);
    
    try {
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthProvider: Supabase sign out error:', error);
        if (!isNetworkError(error)) {
          throw error;
        }
        console.log('AuthProvider: Network error during sign out, but local state cleared');
      }
      
      console.log('AuthProvider: Sign out successful');
      setError(null);
      
    } catch (error: any) {
      console.error('AuthProvider: Sign out error:', error);
      if (mounted.current) {
        if (isNetworkError(error)) {
          setError('Network error during sign out, but you have been signed out locally.');
        } else {
          setError(error.message || 'Failed to sign out');
        }
        setUser(null);
        setSession(null);
      }
      throw error;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  const updateProfile = async (userData: Partial<UserProfile>) => {
    if (!user || !mounted.current) return;
    
    console.log('AuthProvider: Starting updateProfile');
    setIsLoading(true);
    setError(null);
    
    try {
      if (userData.first_name && userData.first_name.trim().length < 2) {
        throw new Error('First name must be at least 2 characters long');
      }

      if (userData.last_name && userData.last_name.trim().length < 2) {
        throw new Error('Last name must be at least 2 characters long');
      }

      if (userData.phone) {
        const phoneDigits = userData.phone.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
          throw new Error('Please enter a valid 10-digit phone number');
        }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(userData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        if (isNetworkError(error)) {
          throw new Error('Unable to connect to the database. Please check your internet connection.');
        }
        throw error;
      }

      if (mounted.current) {
        setUser(data);
      }
      console.log('AuthProvider: Profile updated successfully');
    } catch (error: any) {
      console.error('AuthProvider: Update profile error:', error);
      if (mounted.current) {
        setError(error.message || 'Failed to update profile');
      }
      throw error;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  const resetPassword = async (email: string) => {
    if (!mounted.current) return;
    
    console.log('AuthProvider: Starting resetPassword for email:', email);
    setIsLoading(true);
    setError(null);
    
    try {
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const lowerEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.resetPasswordForEmail(lowerEmail, {
        redirectTo: Platform.OS === 'web' ? `${window.location.origin}/reset-password` : undefined,
      });

      if (error) {
        if (isNetworkError(error)) {
          throw new Error('Unable to connect to authentication service. Please check your internet connection.');
        }
        throw error;
      }
      console.log('AuthProvider: Password reset email sent successfully');
    } catch (error: any) {
      console.error('AuthProvider: Reset password error:', error);
      if (mounted.current) {
        setError(error.message || 'Failed to send reset email');
      }
      throw error;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!session && !!user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};