import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

console.log('Supabase: Initializing client...');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

console.log('Supabase: Environment check - URL exists:', !!supabaseUrl);
console.log('Supabase: Environment check - Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase: Missing environment variables');
  console.error('Supabase: EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('Supabase: EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

console.log('Supabase: Creating client with URL:', supabaseUrl.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    // Use PKCE flow for better security and persistence
    flowType: 'pkce',
    // Use platform-specific storage for session persistence
    storage: Platform.OS === 'web' ? window.localStorage : AsyncStorage,
  },
  global: {
    headers: {
      'X-Client-Info': 'babylon-app'
    }
  },
  db: {
    schema: 'public'
  }
})

console.log('Supabase: Client created successfully');

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string | null
          birth_date: string | null
          avatar_url: string | null
          verified: boolean | null
          reputation: number | null
          total_posts: number | null
          total_likes: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          phone?: string | null
          birth_date?: string | null
          avatar_url?: string | null
          verified?: boolean | null
          reputation?: number | null
          total_posts?: number | null
          total_likes?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          birth_date?: string | null
          avatar_url?: string | null
          verified?: boolean | null
          reputation?: number | null
          total_posts?: number | null
          total_likes?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}