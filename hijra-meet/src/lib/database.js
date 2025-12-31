import { supabase } from './supabase';

// Generate unique host ID
export const generateHostId = () => {
  return `host-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create host ID (persistent in localStorage)
export const getOrCreateHostId = () => {
  let hostId = localStorage.getItem('hijra_host_id');
  if (!hostId) {
    hostId = generateHostId();
    localStorage.setItem('hijra_host_id', hostId);
  }
  return hostId;
};

// Get stored host name
export const getStoredHostName = () => {
  return localStorage.getItem('hijra_host_name');
};

// Set stored host name
export const setStoredHostName = (name) => {
  localStorage.setItem('hijra_host_name', name);
};

// ============================================
// EVENTS
// ============================================

export const createEvent = async (eventData) => {
  const hostIdentifier = getOrCreateHostId();
  const hostName = getStoredHostName();

  const { data, error } = await supabase
    .from('events')
    .insert({
      name: eventData.name,
      host_id: eventData.hostId || null, // Use authenticated ID if provided
      host_identifier: hostIdentifier,
      host_name: hostName || null,
      max_cameras: eventData.maxCameras || 20,
      status: 'initial',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getEvent = async (eventId) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) throw error;
  return data;
};

// Check if event exists and is accessible
export const checkEventAccess = async (eventId) => {
  const { data, error } = await supabase
    .from('events')
    .select('id, status, host_id, host_identifier, host_name, name')
    .eq('id', eventId)
    .single();

  if (error) {
    return { accessible: false, error: 'Majelis tidak ditemukan' };
  }

  if (data.status === 'deleted') {
    return { accessible: false, error: 'Majelis ini telah dihapus oleh Host' };
  }

  if (data.status === 'ended') {
    return { accessible: false, error: 'Majelis ini telah berakhir' };
  }

  const currentHostIdentifier = localStorage.getItem('hijra_host_id');
  const isHost = currentHostIdentifier === data.host_identifier;

  return {
    accessible: true,
    event: data,
    isHost,
    hostName: data.host_name
  };
};

// Get all events created by current host
// Get all events created by current host (authenticated or anonymous)
export const getHostEvents = async (userId = null) => {
  const hostIdentifier = localStorage.getItem('hijra_host_id');

  if (!hostIdentifier && !userId) return [];

  let query = supabase
    .from('events')
    .select('*')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (userId) {
    // If logged in, get events by auth ID OR local identifier
    query = query.or(`host_id.eq.${userId},host_identifier.eq.${hostIdentifier}`);
  } else {
    // If anonymous, just get by identifier
    query = query.eq('host_identifier', hostIdentifier);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const updateEventStatus = async (eventId, status) => {
  const updates = { status };

  if (status === 'live') {
    updates.started_at = new Date().toISOString();
  } else if (status === 'ended') {
    updates.ended_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update host name for an event
export const updateEventHostName = async (eventId, hostName) => {
  const { data, error } = await supabase
    .from('events')
    .update({ host_name: hostName })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;

  // Also save to localStorage
  setStoredHostName(hostName);
  return data;
};

// Delete event (soft delete)
export const deleteEvent = async (eventId) => {
  const hostIdentifier = localStorage.getItem('hijra_host_id');

  if (!hostIdentifier) {
    throw new Error('Host identifier not found');
  }

  // Verify ownership first
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('host_identifier')
    .eq('id', eventId)
    .single();

  if (fetchError) {
    console.error('Error fetching event:', fetchError);
    throw new Error('Majelis tidak ditemukan');
  }

  if (event.host_identifier !== hostIdentifier) {
    throw new Error('Anda tidak memiliki izin untuk menghapus majelis ini');
  }

  // Soft delete - update status to 'deleted'
  const { data, error } = await supabase
    .from('events')
    .update({
      status: 'deleted',
      ended_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error deleting event:', error);
    throw new Error('Gagal menghapus majelis');
  }

  // Delete all participants
  await supabase
    .from('participants')
    .delete()
    .eq('event_id', eventId);

  return data;
};

// ============================================
// PARTICIPANTS
// ============================================

export const joinEvent = async (participantData) => {
  // Use upsert to handle page refreshes (avoids duplicate key error)
  const { data, error } = await supabase
    .from('participants')
    .upsert({
      event_id: participantData.eventId,
      session_id: participantData.sessionId,
      display_name: participantData.displayName,
      role: participantData.role || 'participant',
      camera_on: participantData.cameraOn || false,
      mic_on: participantData.micOn || false,
      last_seen_at: new Date().toISOString(),
    }, {
      onConflict: 'event_id,session_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const leaveEvent = async (sessionId) => {
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('session_id', sessionId);

  if (error) throw error;
};

export const updateParticipant = async (sessionId, updates) => {
  const { data, error } = await supabase
    .from('participants')
    .update({
      ...updates,
      last_seen_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getParticipants = async (eventId) => {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('event_id', eventId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data;
};

// Kick all participants from event
export const kickAllParticipants = async (eventId) => {
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('event_id', eventId);

  if (error) throw error;
};

// ============================================
// MESSAGES (Chat)
// ============================================

export const sendMessage = async (messageData) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      event_id: messageData.eventId,
      sender_id: messageData.senderId,
      sender_name: messageData.senderName,
      content: messageData.content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getMessages = async (eventId, limit = 100) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
};

// ============================================
// QUESTIONS (Q&A)
// ============================================

export const submitQuestion = async (questionData) => {
  const { data, error } = await supabase
    .from('questions')
    .insert({
      event_id: questionData.eventId,
      asker_id: questionData.askerId,
      asker_name: questionData.askerName,
      content: questionData.content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getQuestions = async (eventId) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('event_id', eventId)
    .order('is_pinned', { ascending: false })
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const upvoteQuestion = async (questionId) => {
  const { data, error } = await supabase.rpc('increment_question_upvotes', {
    question_id: questionId,
  });

  if (error) {
    // Fallback if RPC doesn't exist
    const { data: question } = await supabase
      .from('questions')
      .select('upvotes')
      .eq('id', questionId)
      .single();

    const { data: updated, error: updateError } = await supabase
      .from('questions')
      .update({ upvotes: (question?.upvotes || 0) + 1 })
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  return data;
};

export const approveQuestion = async (questionId) => {
  const { data, error } = await supabase
    .from('questions')
    .update({ is_approved: true })
    .eq('id', questionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const pinQuestion = async (questionId, isPinned) => {
  const { data, error } = await supabase
    .from('questions')
    .update({ is_pinned: isPinned })
    .eq('id', questionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// POLLS & VOTES
// ============================================

export const createPoll = async (pollData) => {
  const { data, error } = await supabase
    .from('polls')
    .insert({
      event_id: pollData.eventId,
      question: pollData.question,
      options: pollData.options,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPolls = async (eventId) => {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const submitVote = async (voteData) => {
  const { data, error } = await supabase
    .from('votes')
    .insert({
      poll_id: voteData.pollId,
      voter_id: voteData.voterId,
      option_id: voteData.optionId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getVotes = async (pollId) => {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('poll_id', pollId);

  if (error) throw error;
  return data;
};

export const getPollResults = async (pollId) => {
  const { data, error } = await supabase
    .from('votes')
    .select('option_id')
    .eq('poll_id', pollId);

  if (error) throw error;

  // Count votes per option
  const results = data.reduce((acc, vote) => {
    acc[vote.option_id] = (acc[vote.option_id] || 0) + 1;
    return acc;
  }, {});

  return results;
};
