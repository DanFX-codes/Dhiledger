import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

export const supabase = env.hasSupabase
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  })
  : null