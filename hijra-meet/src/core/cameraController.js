import { webrtcManager } from './webrtcManager';

let localStream = null;

export const cameraController = {
    openCamera: async () => {
        try {
            console.log('Opening camera...');
            // a. getUserMedia - This works without WebRTC
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280, max: 1280 },
                    height: { ideal: 720, max: 720 },
                    frameRate: { max: 30 }
                },
                audio: true
            });

            localStream = stream;

            // b. Try to add to WebRTC if PeerConnection is ready (optional)
            const pc = webrtcManager.getPeerConnection();
            if (pc) {
                // Use addLocalStream to push tracks to Cloudflare correctly
                await webrtcManager.addLocalStream(stream);
            } else {
                console.log('Camera opened (WebRTC not ready yet - will be added later)');
            }

            console.log('Camera opened and ready');
            return stream;
        } catch (err) {
            console.error('Error opening camera:', err);
            throw err;
        }
    },

    toggleAudio: (enabled) => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
            console.log(`Audio ${enabled ? 'enabled' : 'disabled'}`);
        }
    },

    toggleVideo: (enabled) => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
            console.log(`Video ${enabled ? 'enabled' : 'disabled'}`);
        }
    },

    closeCamera: async () => {
        console.log('Closing camera...');

        // Stop local tracks first
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
            });
            localStream = null;
        }

        const pc = webrtcManager.getPeerConnection();
        if (!pc) return;

        // a. removeTrack
        // Find senders that are sending tracks
        const senders = pc.getSenders();
        senders.forEach(sender => {
            // If track is null, it's already stopped/removed or a recvonly transceiver?
            // We should remove senders that we control.
            // Since we stopped loose tracks in localStream, we can just remove all senders for now 
            // or more specifically check if they are active?
            // The instruction says "removeTrack".
            if (sender) {
                pc.removeTrack(sender);
            }
        });

        // Rename renegotiation to ensure peers know we stopped
        await webrtcManager.renegotiate();
        console.log('Camera closed and synced');
    }
};
