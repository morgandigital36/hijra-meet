# Supabase Setup Guide - Hijra Meet

## 📋 Database Schema

The following tables have been created with Row Level Security (RLS) enabled:

### 1. **events**
Stores webinar event information.

**Columns:**
- `id` (UUID, PK): Event ID
- `name` (TEXT): Event name
- `host_id` (UUID, FK → auth.users): Host user ID
- `max_cameras` (INTEGER): Maximum active cameras (default: 20)
- `status` (TEXT): Event status ('initial', 'live', 'ended')
- `started_at` (TIMESTAMPTZ): When event went live
- `ended_at` (TIMESTAMPTZ): When event ended
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**RLS Policies:**
- Hosts can manage their own events
- Anyone can view live events

---

### 2. **participants**
Tracks participant presence in events.

**Columns:**
- `id` (UUID, PK): Participant ID
- `event_id` (UUID, FK → events): Event ID
- `session_id` (TEXT): Unique session identifier
- `display_name` (TEXT): Participant display name
- `role` (TEXT): 'host' or 'participant'
- `camera_on` (BOOLEAN): Camera status
- `mic_on` (BOOLEAN): Microphone status
- `hand_raised` (BOOLEAN): Hand raise status
- `joined_at` (TIMESTAMPTZ): Join timestamp
- `last_seen_at` (TIMESTAMPTZ): Last activity timestamp

**RLS Policies:**
- Anyone can view participants
- Anyone can join as participant (anonymous)
- Users can update their own record
- Users can leave (delete their record)

---

### 3. **messages**
Stores chat messages.

**Columns:**
- `id` (UUID, PK): Message ID
- `event_id` (UUID, FK → events): Event ID
- `sender_id` (TEXT): Sender identifier
- `sender_name` (TEXT): Sender display name
- `content` (TEXT): Message content
- `created_at` (TIMESTAMPTZ): Creation timestamp

**RLS Policies:**
- Anyone can view messages
- Anyone can send messages (anonymous)

---

### 4. **questions**
Stores Q&A questions.

**Columns:**
- `id` (UUID, PK): Question ID
- `event_id` (UUID, FK → events): Event ID
- `asker_id` (TEXT): Asker identifier
- `asker_name` (TEXT): Asker display name
- `content` (TEXT): Question content
- `upvotes` (INTEGER): Upvote count
- `is_approved` (BOOLEAN): Approval status
- `is_pinned` (BOOLEAN): Pin status
- `created_at` (TIMESTAMPTZ): Creation timestamp

**RLS Policies:**
- Anyone can view approved questions
- Hosts can view all questions
- Anyone can submit questions
- Hosts can update questions (approve, pin)

---

### 5. **polls**
Stores poll questions.

**Columns:**
- `id` (UUID, PK): Poll ID
- `event_id` (UUID, FK → events): Event ID
- `question` (TEXT): Poll question
- `options` (JSONB): Poll options array
- `is_active` (BOOLEAN): Active status
- `created_at` (TIMESTAMPTZ): Creation timestamp

**RLS Policies:**
- Anyone can view polls
- Hosts can create polls

---

### 6. **votes**
Stores poll votes.

**Columns:**
- `id` (UUID, PK): Vote ID
- `poll_id` (UUID, FK → polls): Poll ID
- `voter_id` (TEXT): Voter identifier
- `option_id` (TEXT): Selected option ID
- `created_at` (TIMESTAMPTZ): Creation timestamp

**Unique Constraint:** (poll_id, voter_id) - One vote per user per poll

**RLS Policies:**
- Anyone can view votes
- Anyone can submit votes

---

## 🔧 Helper Functions

### `increment_question_upvotes(question_id UUID)`
Atomically increments upvote count for a question.

### `cleanup_stale_participants()`
Removes participants inactive for more than 30 seconds.

---

## 🔐 Security Features

1. **Row Level Security (RLS)** enabled on all tables
2. **Anonymous access** allowed for participants (no login required)
3. **Host authentication** required for moderation actions
4. **Rate limiting** should be implemented at application level

---

## 📡 Realtime Channels

Use Supabase Realtime for:
- Chat messages
- Q&A updates
- Poll results
- Participant presence
- Hand raise notifications

**Example channel names:**
- `event:{eventId}:chat`
- `event:{eventId}:qna`
- `event:{eventId}:polls`
- `event:{eventId}:presence`

---

## 🚀 Getting Started

1. **Get Supabase credentials:**
   - Go to your Supabase project settings
   - Copy Project URL and anon/public key
   - Add to `.env.local`:
     ```
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

2. **Database is ready!**
   - All tables and policies are already created
   - No additional SQL needed

3. **Test the connection:**
   - Run the app: `npm run dev`
   - Try creating an event
   - Check Supabase dashboard for data

---

## 📊 Monitoring

Check these in Supabase Dashboard:
- **Table Editor**: View data in real-time
- **Database**: Monitor queries and performance
- **Logs**: Check for errors
- **API**: Test endpoints

---

## 🔄 Migrations Applied

All migrations have been successfully applied:
- ✅ `create_events_table`
- ✅ `create_participants_table`
- ✅ `create_messages_table`
- ✅ `create_questions_table`
- ✅ `create_polls_and_votes_tables`
- ✅ `create_helper_functions`

---

## 💡 Usage Examples

See `src/lib/database.js` for helper functions:
- `createEvent()`
- `joinEvent()`
- `sendMessage()`
- `submitQuestion()`
- `createPoll()`
- And more...
