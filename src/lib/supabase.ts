import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

console.log('Supabase configuration:')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseAnonKey.length)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on your database schema
export interface Design {
  id: string
  user_id: string
  name: string
  type: 'web_application' | 'website'
  pages_count: number
  figma_link?: string
  description?: string
  status: 'pending' | 'accepted' | 'in_development' | 'completed' | 'rejected'
  created_at: string
  updated_at: string
  accepted_at?: string
  development_started_at?: string
  completed_at?: string
  rejected_at?: string
  admin_notes?: string
  reviewed_by?: string
}

export interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  username?: string
  role: 'student' | 'mentor' | 'admin' | 'volunteer'
  created_at: string
  updated_at: string
}

export interface DesignWithUser extends Design {
  user_profile?: Profile
  reviewer_profile?: Profile
}
