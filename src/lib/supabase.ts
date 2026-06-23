import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl === 'your_project_url' || 
  supabaseAnonKey === 'your_anon_key';

if (isPlaceholder) {
  console.warn(
    'Supabase configuration warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured. ' +
    'Running with mock client fallbacks. Use Demo Mode in the browser or configure your .env.local file.'
  );
  // Fallbacks to prevent new URL() parsing crashes during initial load
  supabaseUrl = 'https://placeholder-project.supabase.co';
  supabaseAnonKey = 'placeholder-key';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
