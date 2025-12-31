-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. Events Table
-- ==========================================
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  host_id uuid, -- Can link to auth.users if needed
  max_cameras int default 20,
  status text default 'initial', -- 'initial', 'live', 'ended'
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Toggle RLS (Row Level Security) - optional, enabling for good practice
alter table public.events enable row level security;

-- Policies (Simple public access for now, assuming public demo)
create policy "Enable read access for all users" on public.events for select using (true);
create policy "Enable insert access for all users" on public.events for insert with check (true);
create policy "Enable update access for all users" on public.events for update using (true);


-- ==========================================
-- 2. Participants Table
-- ==========================================
create table if not exists public.participants (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade,
  session_id text unique not null,
  display_name text,
  role text default 'participant', -- 'host', 'participant'
  camera_on boolean default false,
  mic_on boolean default false,
  last_seen_at timestamptz default now(),
  joined_at timestamptz default now()
);

alter table public.participants enable row level security;
create policy "Allow all access to participants" on public.participants for all using (true);


-- ==========================================
-- 3. Messages Table (Chat)
-- ==========================================
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade,
  sender_id text,
  sender_name text,
  content text,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;
create policy "Allow all access to messages" on public.messages for all using (true);


-- ==========================================
-- 4. Questions Table (Q&A)
-- ==========================================
create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade,
  asker_id text,
  asker_name text,
  content text,
  is_pinned boolean default false,
  upvotes int default 0,
  is_approved boolean default false,
  created_at timestamptz default now()
);

alter table public.questions enable row level security;
create policy "Allow all access to questions" on public.questions for all using (true);


-- ==========================================
-- 5. Polls Table
-- ==========================================
create table if not exists public.polls (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade,
  question text,
  options jsonb, -- Stores array of options e.g. [{"id": "1", "text": "Yes"}]
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.polls enable row level security;
create policy "Allow all access to polls" on public.polls for all using (true);


-- ==========================================
-- 6. Votes Table
-- ==========================================
create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  poll_id uuid references public.polls(id) on delete cascade,
  voter_id text,
  option_id text,
  created_at timestamptz default now()
);

alter table public.votes enable row level security;
create policy "Allow all access to votes" on public.votes for all using (true);


-- ==========================================
-- 7. Functions (RPC)
-- ==========================================

-- Function to safely increment upvotes
create or replace function increment_question_upvotes(question_id uuid)
returns void as $$
begin
  update public.questions
  set upvotes = upvotes + 1
  where id = question_id;
end;
$$ language plpgsql;


-- ==========================================
-- 8. Realtime Publication
-- ==========================================
-- Add tables to the publication to listen to changes on the client side
-- Note: 'messages' often uses broadcast for speed, but if persisting, this helps sync state.
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.questions;
alter publication supabase_realtime add table public.polls;
alter publication supabase_realtime add table public.votes;
