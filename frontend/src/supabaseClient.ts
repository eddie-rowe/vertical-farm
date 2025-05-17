import { createClient } from '@supabase/supabase-js';

// Hardcoded values for debugging
const supabaseUrl = 'https://mlyupwrkoxtmywespgzx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1seXVwd3Jrb3h0bXl3ZXNwZ3p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjgzMzk1MCwiZXhwIjoyMDYyNDA5OTUwfQ.WkXHP8xzSMbSgn6sDXp0J_QodgxNnT-ntU-OF8Q8ni0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase URL at init:', supabaseUrl);