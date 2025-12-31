import { useState, useEffect, useCallback, useRef } from 'react';
import { cloudflareClient } from '../lib/cloudflare';
import { WEBRTC_CONFIG } from '../lib/constants';

export const useWebRTC = (eventId, localStream) => {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [error, setError] = useState(null);

  const peerConnectionRef = useRef(null);
  const sessionIdRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);


  const initializeConnection = useCallback(async () => {
    if (!eventId) {
      setError({ type: 'config', message: 'Event ID is required' });
      return;
    }

    try {
      setConnectionState('connecting');
      setError(null);

      const pc = new RTCPeerConnection(WEBRTC_CONFIG);
      peerConnectionRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected') {
          setConnectionState('connected');
          reconnectAttemptsRef.current = 0;
        } else if (pc.iceConnectionState === 'failed') {
          setConnectionState('failed');
        } else if (pc.iceConnectionState === 'disconnected') {
          setConnectionState('disconnected');
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => {
          const existingStream = prev.find(s => s.id === event.streams[0].id);
          if (existingStream) return prev;

          return [...prev, {
            id: event.streams[0].id,
            stream: event.streams[0],
            participantId: event.streams[0].id,
          }];
        });
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sessionIdRef.current = `session-${eventId}-${Date.now()}`;
      const answer = await cloudflareClient.joinSession(sessionIdRef.current, offer);

      await pc.setRemoteDescription(answer);
      setConnectionState('connected');
    } catch (err) {
      console.error('Error initializing WebRTC connection:', err);
      setError({
        type: 'connection',
        message: err.message || 'Failed to establish WebRTC connection',
      });
      setConnectionState('failed');
    }
  }, [eventId, localStream]);

  const publishStream = useCallback(async (stream) => {
    if (!peerConnectionRef.current) return { success: false };

    try {
      const pc = peerConnectionRef.current;

      pc.getSenders().forEach((sender) => {
        pc.removeTrack(sender);
      });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const answer = await cloudflareClient.renegotiate(sessionIdRef.current, offer);
      await pc.setRemoteDescription(answer);

      return { success: true };
    } catch (err) {
      console.error('Error publishing stream:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const unpublishStream = useCallback(async () => {
    if (!peerConnectionRef.current) return;

    try {
      const pc = peerConnectionRef.current;

      pc.getSenders().forEach((sender) => {
        pc.removeTrack(sender);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const answer = await cloudflareClient.renegotiate(sessionIdRef.current, offer);
      await pc.setRemoteDescription(answer);

      return { success: true };
    } catch (err) {
      console.error('Error unpublishing stream:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const closeConnection = useCallback(async () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (sessionIdRef.current) {
      try {
        await cloudflareClient.closeSession(sessionIdRef.current);
      } catch (err) {
        console.error('Error closing Cloudflare session:', err);
      }
      sessionIdRef.current = null;
    }

    setRemoteStreams([]);
    setConnectionState('disconnected');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeConnection();
    }, 0);

    return () => {
      clearTimeout(timer);
      closeConnection();
    };
  }, [initializeConnection, closeConnection]);

  return {
    connectionState,
    remoteStreams,
    error,
    publishStream,
    unpublishStream,
    reconnect: initializeConnection,
    close: closeConnection,
  };
};
