import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tzasipfripgaopulvhed.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YXNpcGZyaXBnYW9wdWx2aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MTY2NjgsImV4cCI6MjA1NTM5MjY2OH0.pB_tfLUUacQcX0V1sjQhwaE-yVms4q-8wi9TWDjdRm0'; // Replace with your Supabase Anon Key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
