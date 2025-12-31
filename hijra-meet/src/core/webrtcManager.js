import { cloudflareClient } from '../lib/cloudflare';

let peerConnection = null;
let cloudflareSessionId = null;
let localSessionId = null;
let initializationPromise = null; // Lock to prevent race conditions
const remoteTrackCallbacks = [];

const isCloudflareConfigured = () => {
    return import.meta.env.VITE_CLOUDFLARE_APP_ID &&
        import.meta.env.VITE_CLOUDFLARE_API_TOKEN;
};

const ICE_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export const webrtcManager = {
    getPeerConnection: () => peerConnection,
    getSessionId: () => cloudflareSessionId,
    isReady: () => peerConnection !== null && cloudflareSessionId !== null,

    initPeerConnection: async (eventId) => {
        // If already initialized, return immediately
        if (peerConnection && cloudflareSessionId) {
            return peerConnection;
        }

        // If initialization is in progress, wait for it
        if (initializationPromise) {
            console.log('[WebRTC] Waiting for ongoing initialization...');
            return initializationPromise;
        }

        // Start initialization
        initializationPromise = (async () => {
            try {
                console.log('[WebRTC] Initializing Peer Connection...');
                peerConnection = new RTCPeerConnection(ICE_CONFIG);
                localSessionId = `session-${eventId}-${Date.now()}`;

                peerConnection.ontrack = (event) => {
                    console.log('Track received:', event.track.kind, 'stream:', event.streams[0]?.id);
                    remoteTrackCallbacks.forEach(cb => cb(event.track, event.streams[0]));
                };

                // Add transceivers
                peerConnection.addTransceiver('video', { direction: 'sendrecv' });
                peerConnection.addTransceiver('audio', { direction: 'sendrecv' });

                // Check configuration first
                if (!isCloudflareConfigured()) {
                    throw new Error('Cloudflare Calls credentials are missing in .env.local');
                }

                console.log('Initializing Cloudflare Calls session...');

                // 1. Create Offer
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);

                // 2. Send Offer to Cloudflare to create session
                const result = await cloudflareClient.createSession(offer);
                cloudflareSessionId = result.sessionId;

                // 3. Set Remote Description (Answer)
                if (result.sessionDescription) {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(result.sessionDescription));
                }

                console.log('Cloudflare session created:', cloudflareSessionId);
                return peerConnection;
            } catch (err) {
                console.error('Cloudflare initialization failed:', err);
                // Reset on failure
                peerConnection = null;
                cloudflareSessionId = null;
                throw new Error(`Gagal terhubung ke Server Video: ${err.message}`);
            } finally {
                initializationPromise = null;
            }
        })();

        return initializationPromise;
    },



    // Publish local stream - RETURNS TRACK INFO to broadcast
    addLocalStream: async (stream) => {
        if (!peerConnection) return null;

        // Add tracks to PC
        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
        });

        if (!cloudflareSessionId) {
            console.error('Cloudflare session ID is missing');
            throw new Error('Cloudflare session not initialized');
        }

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // Push tracks (publish) - Use custom trackName and mid
            // Cloudflare requires both trackName and mid (media line index in SDP)
            const tracks = stream.getTracks();
            const tracksToPublish = tracks.map((track, index) => ({
                location: 'local',
                trackName: `${track.kind}-${index}`, // e.g., "video-0", "audio-0"
                mid: String(index) // SDP media line index as string
            }));

            const response = await cloudflareClient.pushTracks(cloudflareSessionId, offer, tracksToPublish);

            if (response.sessionDescription) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(response.sessionDescription));
            }

            console.log('Tracks published successfully', response);

            // Return info needed by others to pull these tracks
            // IMPORTANT: Use the track info from Cloudflare's response, as they assign the actual trackNames
            const publishedTracks = response.tracks || tracksToPublish.map((t, i) => ({
                trackName: t.trackName,
                mid: t.mid,
                kind: tracks[i].kind
            }));

            // Add kind information if Cloudflare doesn't return it
            const tracksWithKind = publishedTracks.map((t, i) => ({
                ...t,
                kind: t.kind || (tracks[i] ? tracks[i].kind : (t.trackName.includes('video') ? 'video' : 'audio'))
            }));

            console.log('Broadcasting track info:', { sessionId: cloudflareSessionId, tracks: tracksWithKind });

            return {
                sessionId: cloudflareSessionId,
                tracks: tracksWithKind
            };
        } catch (err) {
            console.error('Publish failed:', err);
            throw err;
        }
    },

    // Renegotiate session (e.g., after adding/removing tracks)
    renegotiate: async () => {
        if (!peerConnection || !cloudflareSessionId) {
            console.warn('Cannot renegotiate: PeerConnection or SessionId missing');
            return;
        }

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // Send re-offer to Cloudflare
            const response = await cloudflareClient.renegotiate(cloudflareSessionId, offer);

            if (response.sessionDescription) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(response.sessionDescription));
                console.log('Renegotiation successful');
            }
        } catch (err) {
            console.error('Renegotiation failed:', err);
            throw err;
        }
    },

    // Subscribe to remote tracks with exponential backoff retry
    subscribeToTracks: async (remoteInfo, retryCount = 0) => {
        const MAX_RETRIES = 5;
        // Exponential backoff: 3s, 5s, 8s, 12s, 15s
        const getRetryDelay = (attempt) => {
            const delays = [3000, 5000, 8000, 12000, 15000];
            return delays[Math.min(attempt, delays.length - 1)];
        };

        if (!peerConnection || !cloudflareSessionId) {
            console.warn('Cannot subscribe: PeerConnection or SessionId missing');
            return;
        }

        // Wait for initial delay based on publishedAt if this is the first attempt
        if (retryCount === 0 && remoteInfo.publishedAt) {
            const timeSincePublish = Date.now() - new Date(remoteInfo.publishedAt).getTime();
            const minWaitTime = 3000; // Wait at least 3 seconds from publish
            if (timeSincePublish < minWaitTime) {
                const waitTime = minWaitTime - timeSincePublish;
                console.log(`[WebRTC] Waiting ${waitTime}ms for tracks to propagate...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        console.log(`[WebRTC] Subscribing to remote tracks (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, remoteInfo.sessionId);

        const tracksToPull = remoteInfo.tracks.map((t) => ({
            location: 'remote',
            sessionId: remoteInfo.sessionId,
            trackName: t.trackName
        }));

        console.log('[WebRTC] Tracks to pull:', tracksToPull);

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            const response = await cloudflareClient.pullTracks(cloudflareSessionId, offer, tracksToPull);

            if (response.sessionDescription) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(response.sessionDescription));
                console.log('[WebRTC] ✓ Successfully subscribed to remote tracks!');
                return true; // Success!
            } else if (response.tracks && response.tracks.length > 0) {
                const trackErrors = response.tracks.filter(t => t.errorCode);
                if (trackErrors.length > 0) {
                    // Retryable errors: timing-related or temporary backend issues
                    const hasRetryableError = trackErrors.some(t =>
                        t.errorCode === 'empty_track_error' ||
                        t.errorCode === 'not_found_track_error' ||
                        t.errorCode === 'internal_error'
                    );

                    if (hasRetryableError && retryCount < MAX_RETRIES) {
                        const delay = getRetryDelay(retryCount);
                        console.log(`[WebRTC] Track error (${trackErrors[0].errorCode}) - Retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return webrtcManager.subscribeToTracks(remoteInfo, retryCount + 1);
                    } else {
                        console.error('[WebRTC] ✗ Track subscription failed after max retries:');
                        trackErrors.forEach((t, i) => {
                            console.error(`  Track ${i}: ${t.errorCode} - ${t.errorDescription}`);
                        });
                        return false;
                    }
                } else {
                    console.log('[WebRTC] Tracks added successfully (no renegotiation needed)');
                    return true;
                }
            } else {
                console.warn('[WebRTC] Unexpected response format:', response);
                return false;
            }
        } catch (err) {
            if (retryCount < MAX_RETRIES) {
                const delay = getRetryDelay(retryCount);
                console.log(`[WebRTC] Subscribe error, retrying in ${delay}ms...`, err.message);
                await new Promise(resolve => setTimeout(resolve, delay));
                return webrtcManager.subscribeToTracks(remoteInfo, retryCount + 1);
            }
            console.error('[WebRTC] ✗ Subscribe failed after max retries:', err);
            return false;
        }
    },

    onRemoteTrack: (callback) => {
        remoteTrackCallbacks.push(callback);
    },

    close: async () => {
        if (cloudflareSessionId) {
            await cloudflareClient.closeSession(cloudflareSessionId).catch(console.error);
        }
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
    }
};
