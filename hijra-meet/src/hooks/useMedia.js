import { useState, useEffect, useCallback } from 'react';
import { getUserMedia, getDevices, stopStream } from '../utils/mediaHelpers';

export const useMedia = () => {
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState({
    cameras: [],
    microphones: [],
    speakers: [],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Request media access
  const requestAccess = useCallback(async (constraints = {}) => {
    setLoading(true);
    setError(null);

    const { stream: mediaStream, error: mediaError } = await getUserMedia(constraints);

    if (mediaError) {
      setError(mediaError);
      setLoading(false);
      return { success: false, error: mediaError };
    }

    setStream(mediaStream);
    setLoading(false);
    return { success: true, stream: mediaStream };
  }, []);

  // Load available devices
  const loadDevices = useCallback(async () => {
    const { cameras, microphones, speakers, error: devicesError } = await getDevices();

    if (devicesError) {
      setError(devicesError);
      return { success: false, error: devicesError };
    }

    setDevices({ cameras, microphones, speakers });
    return { success: true, devices: { cameras, microphones, speakers } };
  }, []);

  // Stop current stream
  const stop = useCallback(() => {
    if (stream) {
      stopStream(stream);
      setStream(null);
    }
  }, [stream]);

  // Toggle video track
  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }, [stream]);

  // Toggle audio track
  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }, [stream]);

  // Switch camera
  const switchCamera = useCallback(async (deviceId) => {
    if (!stream) return { success: false, error: 'No active stream' };

    // Stop current video track
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.stop();
    }

    // Get new stream with selected camera
    const { stream: newStream, error: mediaError } = await getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });

    if (mediaError) {
      return { success: false, error: mediaError };
    }

    // Replace video track
    const newVideoTrack = newStream.getVideoTracks()[0];
    const sender = stream.getVideoTracks()[0];
    
    if (sender && newVideoTrack) {
      stream.removeTrack(sender);
      stream.addTrack(newVideoTrack);
      setStream(stream);
      return { success: true };
    }

    return { success: false, error: 'Failed to switch camera' };
  }, [stream]);

  // Switch microphone
  const switchMicrophone = useCallback(async (deviceId) => {
    if (!stream) return { success: false, error: 'No active stream' };

    // Stop current audio track
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.stop();
    }

    // Get new stream with selected microphone
    const { stream: newStream, error: mediaError } = await getUserMedia({
      video: false,
      audio: { deviceId: { exact: deviceId } },
    });

    if (mediaError) {
      return { success: false, error: mediaError };
    }

    // Replace audio track
    const newAudioTrack = newStream.getAudioTracks()[0];
    const sender = stream.getAudioTracks()[0];
    
    if (sender && newAudioTrack) {
      stream.removeTrack(sender);
      stream.addTrack(newAudioTrack);
      setStream(stream);
      return { success: true };
    }

    return { success: false, error: 'Failed to switch microphone' };
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stopStream(stream);
      }
    };
  }, [stream]);

  return {
    stream,
    devices,
    error,
    loading,
    requestAccess,
    loadDevices,
    stop,
    toggleVideo,
    toggleAudio,
    switchCamera,
    switchMicrophone,
  };
};
