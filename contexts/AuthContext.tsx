import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase, type Database } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

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
  const [isLoading, setIsLoading] = useState(true); // Start with true for initial load
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const initialized = useRef(false);

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
    // Require at least 6 characters for sign in, 8 for sign up
    return password.length >= 6;
  };

  const validateStrongPassword = (password: string): boolean => {
    // Require at least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log('AuthProvider: Starting fetchUserProfile for userId:', userId);
    
    try {
      console.log('AuthProvider: Making Supabase query for user profile');
      
      // Create a timeout promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout: Unable to fetch user profile. Please check your internet connection.'));
        }, 10000);
      });

      // Race the Supabase query against the timeout
      const supabaseQuery = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([supabaseQuery, timeoutPromise]) as any;

      if (!mounted.current) {
        console.log('AuthProvider: Component unmounted, aborting fetchUserProfile');
        return;
      }

      if (error) {
        console.error('AuthProvider: Error fetching user profile:', error);
        
        if (error.message.includes('Failed to fetch')) {
          setError('Unable to connect to the server. Please check your internet connection.');
        } else {
          setError(`Failed to load user profile: ${error.message}`);
        }
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
        // Don't set error here as this might be expected during signup
      }
    } catch (error: any) {
      if (!mounted.current) {
        console.log('AuthProvider: Component unmounted during fetchUserProfile error handling');
        return;
      }
      
      console.error('AuthProvider: Exception in fetchUserProfile:', error);
      
      if (error.message.includes('Request timeout')) {
        setError(error.message);
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please check your internet connection.');
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
    
    // Always update session state
    setSession(session);
    
    if (session?.user) {
      console.log('AuthProvider: User authenticated, fetching profile');
      // User is authenticated, fetch their profile
      await fetchUserProfile(session.user.id);
    } else {
      console.log('AuthProvider: User not authenticated, clearing user data');
      // User is not authenticated, clear user data
      if (mounted.current) {
        setUser(null);
        setError(null);
        setIsLoading(false);
      }
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    console.log('AuthProvider: useEffect triggered - setting up auth');
    mounted.current = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Starting authentication initialization...');

        // Check if Supabase environment variables are available
        if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
          console.error('AuthProvider: Missing Supabase environment variables');
          if (mounted.current) {
            setError('App configuration error: Missing Supabase credentials. Please check your environment variables.');
            setIsLoading(false);
          }
          return;
        }

        console.log('AuthProvider: Environment variables found, getting session...');

        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          if (mounted.current) {
            if (error.message.includes('Failed to fetch')) {
              setError('Unable to connect to authentication service. Please check your internet connection.');
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

        initialized.current = true;
        console.log('AuthProvider: Authentication initialization completed');
      } catch (error: any) {
        console.error('AuthProvider: Exception during auth initialization:', error);
        if (mounted.current) {
          if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            setError('Unable to connect to the server. Please check your internet connection.');
          } else {
            setError(error.message || 'Failed to initialize authentication');
          }
          setIsLoading(false);
        }
      }
    };

    console.log('AuthProvider: Setting up auth state listener');
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    console.log('AuthProvider: Starting auth initialization');
    // Initialize auth
    initializeAuth();

    return () => {
      console.log('AuthProvider: Cleanup - unmounting component');
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, handleAuthStateChange]);

  const signIn = async (email: string, password: string) => {
    if (!mounted.current) return;
    
    console.log('AuthProvider: Starting signIn for email:', email);
    setIsLoading(true);
    setError(null);
    
    try {
      // Input validation
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

      // Block any demo account attempts
      const lowerEmail = trimmedEmail.toLowerCase();
      if (lowerEmail.includes('demo') || lowerEmail.includes('test') || lowerEmail.includes('example')) {
        const error = new Error('Demo accounts are not allowed. Please use a real email address.');
        if (mounted.current) {
          setError(error.message);
          setIsLoading(false);
        }
        throw error;
      }

      console.log('AuthProvider: Attempting Supabase authentication');

      // Attempt authentication with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: lowerEmail,
        password: trimmedPassword,
      });

      if (authError) {
        console.log('AuthProvider: Authentication failed:', authError.message);
        
        // Handle specific authentication errors with user-friendly messages
        let userMessage: string;
        switch (authError.message) {
          case 'Invalid login credentials':
            userMessage = 'The email or password you entered is incorrect. Please check your credentials and try again.';
            break;
          case 'Email not confirmed':
            userMessage = 'Please verify your email address before signing in. Check your inbox for a confirmation email.';
            break;
          case 'Too many requests':
            userMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
            break;
          case 'User not found':
            userMessage = 'No account found with this email address. Please check your email or create a new account.';
            break;
          default:
            if (authError.message.includes('Failed to fetch')) {
              userMessage = 'Unable to connect to the authentication service. Please check your internet connection and try again.';
            } else if (authError.message.includes('network')) {
              userMessage = 'Network error occurred. Please check your internet connection and try again.';
            } else {
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

      // Verify that the user has a valid profile in our database
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('AuthProvider: User profile verification failed:', profileError);
          // Sign out the user if there's an error checking their profile
          await supabase.auth.signOut();
          const error = new Error('Account verification failed. Please contact support or try creating a new account.');
          if (mounted.current) {
            setError(error.message);
            setIsLoading(false);
          }
          throw error;
        }

        if (!profileData) {
          console.error('AuthProvider: User profile not found for authenticated user');
          // Sign out the user if they don't have a valid profile
          await supabase.auth.signOut();
          const error = new Error('Account setup incomplete. Please contact support or try creating a new account.');
          if (mounted.current) {
            setError(error.message);
            setIsLoading(false);
          }
          throw error;
        }

        console.log('AuthProvider: User profile verification successful');
      } catch (profileError: any) {
        console.error('AuthProvider: Profile verification error:', profileError);
        // Sign out the user on any profile verification error
        await supabase.auth.signOut();
        const error = new Error('Account verification failed. Please try again or contact support.');
        if (mounted.current) {
          setError(error.message);
          setIsLoading(false);
        }
        throw error;
      }

      console.log('AuthProvider: Sign in process completed successfully');
      
      // The auth state change listener will handle updating the user profile
      
    } catch (error: any) {
      // Don't log authentication failures as errors - they're expected user behavior
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

      // Strict validation for real user data
      if (!userData.firstName.trim() || !userData.lastName.trim()) {
        throw new Error('First name and last name are required');
      }

      if (userData.firstName.trim().length < 2 || userData.lastName.trim().length < 2) {
        throw new Error('First name and last name must be at least 2 characters long');
      }

      if (!validateEmail(userData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Block demo email addresses
      const lowerEmail = userData.email.trim().toLowerCase();
      if (lowerEmail.includes('demo') || lowerEmail.includes('test') || lowerEmail.includes('example')) {
        throw new Error('Demo email addresses are not allowed. Please use a real email address.');
      }

      if (!validateStrongPassword(userData.password)) {
        throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, and number');
      }

      if (!userData.phone.trim()) {
        throw new Error('Phone number is required');
      }

      // Validate phone number format (basic validation)
      const phoneDigits = userData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      if (!userData.birthDate.trim()) {
        throw new Error('Birth date is required');
      }

      // Validate birth date format and age
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

      // Create auth user - ONLY real accounts allowed
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: lowerEmail,
        password: userData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation for now
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
        
        if (authError.message.includes('Failed to fetch')) {
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

      // Convert MM/DD/YYYY to YYYY-MM-DD format for database
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

      // Create user profile with retry logic
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
        
        if (retries > 0) {
          console.log(`AuthProvider: Profile creation failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (profileError) {
        console.error('AuthProvider: Error creating user profile:', profileError);

        // Handle duplicate key constraint violation (user profile already exists)
        if (profileError.code === '23505') {
          console.log('AuthProvider: User profile already exists, treating as successful signup');
          // Profile already exists, this is not a fatal error
          // The auth state change listener will handle updating the user profile
          return;
        }

        // Clean up the auth user if profile creation fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('AuthProvider: Failed to clean up auth user:', cleanupError);
        }
        
        if (profileError.message?.includes('Failed to fetch')) {
          throw new Error('Unable to connect to the database. Please check your internet connection.');
        }
        
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('AuthProvider: Real user account created successfully:', profileResult);

      // The auth state change listener will handle updating the user profile

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
      // Clear local state first
      setUser(null);
      setSession(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthProvider: Supabase sign out error:', error);
        if (!error.message.includes('Failed to fetch')) {
          throw error;
        }
        // If it's a network error, we've already cleared local state
        console.log('AuthProvider: Network error during sign out, but local state cleared');
      }
      
      console.log('AuthProvider: Sign out successful');
      setError(null);
      
    } catch (error: any) {
      console.error('AuthProvider: Sign out error:', error);
      if (mounted.current) {
        if (error.message.includes('Failed to fetch')) {
          setError('Network error during sign out, but you have been signed out locally.');
        } else {
          setError(error.message || 'Failed to sign out');
        }
        // Even if there's an error, ensure local state is cleared
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
      // Validate update data
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
        if (error.message.includes('Failed to fetch')) {
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

      // Block demo email addresses
      const lowerEmail = email.trim().toLowerCase();
      if (lowerEmail.includes('demo') || lowerEmail.includes('test') || lowerEmail.includes('example')) {
        throw new Error('Demo email addresses are not supported. Please use a real email address.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(lowerEmail, {
        redirectTo: Platform.OS === 'web' ? `${window.location.origin}/reset-password` : undefined,
      });

      if (error) {
        if (error.message.includes('Failed to fetch')) {
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