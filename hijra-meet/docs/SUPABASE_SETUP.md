# Supabase Setup Guide

This guide will help you set up the Supabase backend for Hijra Meet.

## 📋 Prerequisites

- Supabase account (https://supabase.com)
- Supabase project created

## 🗄️ Database Schema

The following tables are required for Hijra Meet:

### 1. Events Table

```sql
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  max_cameras INTEGER DEFAULT 20,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'ended')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_event_id ON public.events(event_id);
CREATE INDEX idx_events_host_id ON public.events(host_id);
CREATE INDEX idx_events_status ON public.events(status);
```

### 2. Participants Table

```sql
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
  camera_on BOOLEAN DEFAULT FALSE,
  mic_on BOOLEAN DEFAULT FALSE,
  hand_raised BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_participants_event_id ON public.participants(event_id);
CREATE INDEX idx_participants_session_id ON public.participants(session_id);
```

### 3. Messages Table

```sql
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_event_id ON public.messages(event_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
```

### 4. Questions Table

```sql
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  asker_id TEXT NOT NULL,
  asker_name TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_event_id ON public.questions(event_id);
CREATE INDEX idx_questions_is_approved ON public.questions(is_approved);
CREATE INDEX idx_questions_is_pinned ON public.questions(is_pinned);
```

### 5. Polls Table

```sql
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_polls_event_id ON public.polls(event_id);
CREATE INDEX idx_polls_is_active ON public.polls(is_active);
```

### 6. Votes Table

```sql
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, voter_id)
);

CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX idx_votes_voter_id ON public.votes(voter_id);
```

## 🔒 Row Level Security (RLS) Policies

Enable RLS on all tables and apply the following policies:

### Events Policies

```sql
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anyone can read events
CREATE POLICY "Anyone can read events" ON public.events
  FOR SELECT USING (true);

-- Only authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Only host can update their events
CREATE POLICY "Host can update their events" ON public.events
  FOR UPDATE USING (auth.uid() = host_id);

-- Only host can delete their events
CREATE POLICY "Host can delete their events" ON public.events
  FOR DELETE USING (auth.uid() = host_id);
```

### Participants Policies (Anonymous Access)

```sql
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Anyone can read participants
CREATE POLICY "Anyone can read participants" ON public.participants
  FOR SELECT USING (true);

-- Anyone can insert participants (for anonymous join)
CREATE POLICY "Anyone can insert participants" ON public.participants
  FOR INSERT WITH CHECK (true);

-- Anyone can update participants
CREATE POLICY "Anyone can update participants" ON public.participants
  FOR UPDATE USING (true);

-- Anyone can delete participants
CREATE POLICY "Anyone can delete participants" ON public.participants
  FOR DELETE USING (true);
```

### Messages Policies (Anonymous Access)

```sql
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages
CREATE POLICY "Anyone can read messages" ON public.messages
  FOR SELECT USING (true);

-- Anyone can insert messages (for anonymous chat)
CREATE POLICY "Anyone can insert messages" ON public.messages
  FOR INSERT WITH CHECK (true);
```

### Questions Policies (Anonymous Access)

```sql
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved questions
CREATE POLICY "Anyone can read questions" ON public.questions
  FOR SELECT USING (true);

-- Anyone can insert questions
CREATE POLICY "Anyone can insert questions" ON public.questions
  FOR INSERT WITH CHECK (true);

-- Anyone can update questions (for upvotes)
CREATE POLICY "Anyone can update questions" ON public.questions
  FOR UPDATE USING (true);
```

### Polls Policies

```sql
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Anyone can read polls
CREATE POLICY "Anyone can read polls" ON public.polls
  FOR SELECT USING (true);

-- Only authenticated users can create polls
CREATE POLICY "Authenticated users can create polls" ON public.polls
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### Votes Policies (Anonymous Access with Rate Limiting)

```sql
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read votes
CREATE POLICY "Anyone can read votes" ON public.votes
  FOR SELECT USING (true);

-- Anyone can insert votes (rate limiting handled in application)
CREATE POLICY "Anyone can insert votes" ON public.votes
  FOR INSERT WITH CHECK (true);
```

## 🔄 Realtime Configuration

Enable Realtime for the following tables:

1. Go to Database > Replication in Supabase Dashboard
2. Enable replication for:
   - `public.events`
   - `public.participants`
   - `public.messages`
   - `public.questions`
   - `public.polls`
   - `public.votes`

## 🔑 Environment Variables

Add the following to your `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in:
- Supabase Dashboard > Settings > API

## ✅ Verification

Run the following SQL to verify your setup:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🚀 Next Steps

After completing the database setup:

1. Update `.env.local` with your Supabase credentials
2. Test the connection by running the app
3. Create a test event to verify everything works

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
