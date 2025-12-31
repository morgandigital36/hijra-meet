// App Constants
export const APP_NAME = 'Hijra Meet';

// Limits
export const MAX_ACTIVE_CAMERAS = 20;
export const MAX_PARTICIPANTS = 250;

// Rate Limits
export const VOTE_RATE_LIMIT_MS = 5000; // 5 seconds
export const CHAT_RATE_LIMIT_MS = 1000; // 1 second
export const HAND_RAISE_COOLDOWN_MS = 10000; // 10 seconds

// Colors (matching Tailwind config)
export const COLORS = {
  navy: '#0F172A',
  emerald: '#10B981',
  rose: '#EF4444',
};

// WebRTC Configuration
export const WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

// Audio Detection
export const AUDIO_THRESHOLD = 0.01; // Speaking detection threshold
export const AUDIO_SAMPLE_RATE = 48000;

// Video Quality
export const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
};

export const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
