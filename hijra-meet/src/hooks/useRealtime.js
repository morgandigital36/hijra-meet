import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtime = (eventId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  /**
   * Handle retry logic
   */
  const handleRetry = useCallback(() => {
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current += 1;
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);

      setTimeout(() => {
        console.log(`Retrying channel connection (${retryCountRef.current}/${maxRetries})...`);
        if (channelRef.current) {
          channelRef.current.subscribe();
        }
      }, delay);
    }
  }, []);

  /**
   * Subscribe to event channel
   */
  const subscribe = useCallback((callbacks = {}) => {
    if (!eventId) {
      setError('Event ID is required');
      return null;
    }

    try {
      // Create channel
      const channel = supabase.channel(`event:${eventId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: '' },
        },
      });

      // Handle channel status
      channel
        .on('system', {}, (payload) => {
          if (payload.status === 'SUBSCRIBED') {
            setIsConnected(true);
            setError(null);
            retryCountRef.current = 0;
          } else if (payload.status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            setError('Channel connection error');
            handleRetry();
          } else if (payload.status === 'TIMED_OUT') {
            setIsConnected(false);
            setError('Channel connection timed out');
            handleRetry();
          }
        });

      // Broadcast events
      if (callbacks.onMessage) {
        channel.on('broadcast', { event: 'message' }, callbacks.onMessage);
      }

      if (callbacks.onQuestion) {
        channel.on('broadcast', { event: 'question' }, callbacks.onQuestion);
      }

      if (callbacks.onVote) {
        channel.on('broadcast', { event: 'vote' }, callbacks.onVote);
      }

      if (callbacks.onHandRaise) {
        channel.on('broadcast', { event: 'hand_raise' }, callbacks.onHandRaise);
      }

      if (callbacks.onHandRaiseResponse) {
        channel.on('broadcast', { event: 'hand_raise_response' }, callbacks.onHandRaiseResponse);
      }

      if (callbacks.onParticipantUpdate) {
        channel.on('broadcast', { event: 'participant_update' }, callbacks.onParticipantUpdate);
      }

      // Presence tracking
      if (callbacks.onPresenceSync) {
        channel.on('presence', { event: 'sync' }, callbacks.onPresenceSync);
      }

      if (callbacks.onPresenceJoin) {
        channel.on('presence', { event: 'join' }, callbacks.onPresenceJoin);
      }

      if (callbacks.onPresenceLeave) {
        channel.on('presence', { event: 'leave' }, callbacks.onPresenceLeave);
      }

      // Subscribe
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to channel');
        }
      });

      channelRef.current = channel;
      return channel;
    } catch (err) {
      console.error('Error subscribing to channel:', err);
      setError(err.message);
      return null;
    }
  }, [eventId, handleRetry]);




  /**
   * Send message
   * Can be called as:
   * - sendMessage(content, senderName) for simple messages
   * - sendMessage({ type, content, senderId, ... }) for structured messages like NEW_TRACKS
   */
  const sendMessage = useCallback(async (contentOrPayload, senderName) => {
    if (!channelRef.current) {
      return { success: false, error: 'Channel not initialized' };
    }

    try {
      let payload;

      if (typeof contentOrPayload === 'object' && contentOrPayload !== null) {
        // Structured message (e.g., NEW_TRACKS)
        payload = {
          ...contentOrPayload,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Simple message (content, senderName)
        payload = {
          content: contentOrPayload,
          senderName,
          timestamp: new Date().toISOString(),
        };
      }

      console.log('[Realtime] Sending message:', payload);

      await channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload,
      });

      return { success: true };
    } catch (err) {
      console.error('Error sending message:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Send mute request (Host Only)
   */
  const sendMuteRequest = useCallback(async (targetParticipantId) => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        type: 'MUTE_REQUEST',
        targetId: targetParticipantId,
        timestamp: new Date().toISOString()
      }
    });
  }, []);

  /**
   * Send kick request (Host Only)
   */
  const sendKickRequest = useCallback(async (targetParticipantId) => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        type: 'KICK_REQUEST',
        targetId: targetParticipantId,
        timestamp: new Date().toISOString()
      }
    });
  }, []);

  /**
   * Send question
   */
  const sendQuestion = useCallback(async (content, askerName) => {
    if (!channelRef.current) {
      return { success: false, error: 'Channel not initialized' };
    }

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'question',
        payload: {
          content,
          askerName,
          timestamp: new Date().toISOString(),
        },
      });

      return { success: true };
    } catch (err) {
      console.error('Error sending question:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Send vote
   */
  const sendVote = useCallback(async (pollId, optionId, voterId) => {
    if (!channelRef.current) {
      return { success: false, error: 'Channel not initialized' };
    }

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'vote',
        payload: {
          pollId,
          optionId,
          voterId,
          timestamp: new Date().toISOString(),
        },
      });

      return { success: true };
    } catch (err) {
      console.error('Error sending vote:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Raise hand
   */
  const raiseHand = useCallback(async (participantId, participantName) => {
    if (!channelRef.current) {
      return { success: false, error: 'Channel not initialized' };
    }

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'hand_raise',
        payload: {
          participantId,
          participantName,
          timestamp: new Date().toISOString(),
        },
      });

      return { success: true };
    } catch (err) {
      console.error('Error raising hand:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Respond to hand raise (host only)
   */
  const respondToHandRaise = useCallback(async (participantId, approved) => {
    if (!channelRef.current) {
      return { success: false, error: 'Channel not initialized' };
    }

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'hand_raise_response',
        payload: {
          participantId,
          approved,
          timestamp: new Date().toISOString(),
        },
      });

      return { success: true };
    } catch (err) {
      console.error('Error responding to hand raise:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Track presence
   */
  const trackPresence = useCallback(async (participantId, participantName, role) => {
    if (!channelRef.current) {
      return { success: false, error: 'Channel not initialized' };
    }

    try {
      await channelRef.current.track({
        participantId,
        participantName,
        role,
        online_at: new Date().toISOString(),
      });

      return { success: true };
    } catch (err) {
      console.error('Error tracking presence:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Unsubscribe from channel
   */
  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe,
    sendMessage,
    sendQuestion,
    sendVote,
    raiseHand,
    respondToHandRaise,
    trackPresence,
    sendMuteRequest,
    sendKickRequest,
  };
};
