import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://nqojzvthnemwwkasxgwi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xb2p6dnRobmVtd3drYXN4Z3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzQxNjYsImV4cCI6MjA3ODQ1MDE2Nn0.5zIsSCDnv5TIkf7QMYhXqUeDxS9VKRNoUMnH2pLOGBE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
