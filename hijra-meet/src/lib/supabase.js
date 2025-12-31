import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log actual values
console.log('Supabase URL value:', JSON.stringify(supabaseUrl));
console.log('Supabase Key loaded:', supabaseAnonKey ? 'Yes' : 'No');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found. Please check .env file.');
  console.error('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create client or fallback to error-throwing proxy
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({}, {
    get: () => {
      throw new Error('Supabase Client not initialized: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    }
  });

// Auth helpers
export const auth = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
};

// Realtime channel helpers
export const createChannel = (channelName) => {
  return supabase.channel(channelName);
};

export const subscribeToChannel = (channel, event, callback) => {
  return channel
    .on('broadcast', { event }, callback)
    .subscribe();
};

export const broadcastToChannel = async (channel, event, payload) => {
  return await channel.send({
    type: 'broadcast',
    event,
    payload,
  });
};
