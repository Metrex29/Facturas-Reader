import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kbccanptwywszxxpnqvs.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Optional: Test the connection
supabase.from('users').select('*').limit(1)
  .then(response => {
    if (response.error) {
      console.error('Supabase connection error:', response.error)
    } else {
      console.log('Supabase connection successful')
    }
  })