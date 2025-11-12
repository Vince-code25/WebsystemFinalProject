import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ujnrxuonwkuvsckhzqut.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbnJ4dW9ud2t1dnNja2h6cXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzM5NTQsImV4cCI6MjA3ODQ0OTk1NH0.sFp83whz3xAdfSpuJjhtuFOqRX7qrUGz_wNmK_Lulbc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
