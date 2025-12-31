import { VIDEO_CONSTRAINTS, AUDIO_CONSTRAINTS } from '../lib/constants';

// Get user media with constraints
export const getUserMedia = async (constraints = {}) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: constraints.video !== false ? {
        ...VIDEO_CONSTRAINTS,
        ...constraints.video,
      } : false,
      audio: constraints.audio !== false ? {
        ...AUDIO_CONSTRAINTS,
        ...constraints.audio,
      } : false,
    });
    return { stream, error: null };
  } catch (error) {
    return { stream: null, error: parseMediaError(error) };
  }
};

// Get display media for screen sharing
export const getDisplayMedia = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
      },
      audio: false,
    });
    return { stream, error: null };
  } catch (error) {
    return { stream: null, error: parseMediaError(error) };
  }
};

// Get available devices
export const getDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      cameras: devices.filter(d => d.kind === 'videoinput'),
      microphones: devices.filter(d => d.kind === 'audioinput'),
      speakers: devices.filter(d => d.kind === 'audiooutput'),
      error: null,
    };
  } catch (error) {
    return {
      cameras: [],
      microphones: [],
      speakers: [],
      error: parseMediaError(error),
    };
  }
};

// Stop all tracks in a stream
export const stopStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};

// Parse media errors
export const parseMediaError = (error) => {
  if (!error) return null;

  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return {
        type: 'permission',
        message: 'Camera/microphone access denied. Please allow permissions in your browser settings.',
      };
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        type: 'not_found',
        message: 'No camera or microphone found. Please connect a device.',
      };
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        type: 'hardware',
        message: 'Camera or microphone is already in use by another application.',
      };
    case 'OverconstrainedError':
      return {
        type: 'constraints',
        message: 'Camera or microphone does not support the requested settings.',
      };
    case 'AbortError':
      return {
        type: 'abort',
        message: 'Media access was aborted.',
      };
    default:
      return {
        type: 'unknown',
        message: error.message || 'An unknown error occurred while accessing media devices.',
      };
  }
};

// Check if browser supports required features
export const checkBrowserSupport = () => {
  const support = {
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
    mediaRecorder: !!window.MediaRecorder,
    webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
  };

  const isSupported = Object.values(support).every(Boolean);

  return { support, isSupported };
};
