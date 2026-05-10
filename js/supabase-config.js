const SUPABASE_URL = 'https://vadfcowshqisnwqlikii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZGZjb3dzaHFpc253cWxpa2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDk2MTksImV4cCI6MjA5Mzk4NTYxOX0.HsnyQS42EOjP_G-sj-tzLar3vRiGcN_Q1AB5rZnvw74';

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

console.log("✅ Supabase connected");