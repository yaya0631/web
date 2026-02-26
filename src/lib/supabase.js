import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vlvaolzoorrllqrkknxh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdmFvbHpvb3JybGxxcmtrbnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzg1NTksImV4cCI6MjA4NzY1NDU1OX0.p2k3L0jd421ns8te6X8a6bR333QkMnFjqp-NO7gsCrE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const TABLE = 'dossiers'
