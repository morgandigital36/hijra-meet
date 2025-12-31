import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { webrtcManager } from '../core/webrtcManager';
import { useRealtime } from '../hooks/useRealtime';
import { useParticipantStore } from '../store/participantStore';
import { cameraController } from '../core/cameraController';
import { roleManager } from '../core/roleManager';
import { checkEventAccess, updateEventStatus, kickAllParticipants } from '../lib/database';
import Controls from './Controls';
import ParticipantList from './ParticipantList';
import VideoTile from '../components/video/VideoTile';

export default function Meeting({ eventId }) {
    const navigate = useNavigate();
    const [remoteStreams, setRemoteStreams] = useState([]);
    const [showParticipants, setShowParticipants] = useState(false);
    const [floatingEmoji, setFloatingEmoji] = useState(null);
    const [eventError, setEventError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const streamsRef = useRef(new Map());
    const localTrackInfoRef = useRef(null);
    const notificationIdRef = useRef(0);

    const {
        subscribe,
        trackPresence,
        sendMessage,
        sendMuteRequest,
        sendKickRequest
    } = useRealtime(eventId);

    const {
        localParticipant,
        participants,
        addParticipant,
        removeParticipant,
        syncParticipants,
        resetParticipants
    } = useParticipantStore();

    // Add notification
    const showNotification = (message, type = 'info') => {
        const id = ++notificationIdRef.current;
        const notification = { id, message, type };
        setNotifications(prev => [...prev, notification]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    // Check event access on mount
    useEffect(() => {
        const checkAccess = async () => {
            try {
                const result = await checkEventAccess(eventId);
                if (!result.accessible) {
                    setEventError(result.error);
                    return;
                }

                // Update event status to live if host
                if (result.isHost) {
                    await updateEventStatus(eventId, 'live');
                }
            } catch (err) {
                console.error('Error checking event access:', err);
                setEventError('Gagal mengakses majelis');
            }
        };

        checkAccess();
    }, [eventId]);

    useEffect(() => {
        let participantId = null;
        let isCleaningUp = false;

        const initMeeting = async () => {
            if (!localParticipant) {
                // Redirect to setup if no participant info
                navigate(`/setup/${eventId}`);
                return;
            }

            try {
                const { joinEvent } = await import('../lib/database');
                const dbParticipant = await joinEvent({
                    eventId,
                    sessionId: localParticipant.id,
                    displayName: localParticipant.name,
                    role: localParticipant.role,
                    cameraOn: localParticipant.cameraOn,
                    micOn: localParticipant.micOn,
                });
                participantId = dbParticipant.id;
            } catch (error) {
                console.error('Error joining event in database:', error);
            }

            // Initialize WebRTC connection
            try {
                await webrtcManager.initPeerConnection(eventId);
            } catch (err) {
                console.error('WebRTC Init Error:', err);
                setEventError(`Gagal terhubung ke Cloudflare Calls: ${err.message}`);
                return;
            }

            // Handle incoming remote tracks
            webrtcManager.onRemoteTrack((track, stream) => {
                console.log('Received remote track:', track.kind, 'from stream:', stream.id);

                if (!streamsRef.current.has(stream.id)) {
                    streamsRef.current.set(stream.id, stream);
                    setRemoteStreams(prev => {
                        if (prev.some(s => s.id === stream.id)) return prev;
                        return [...prev, stream];
                    });
                }
            });

            // Subscribe to realtime channel
            const channel = subscribe({
                onPresenceSync: () => {
                    const state = channel.presenceState();
                    const syncedParticipants = [];
                    Object.values(state).forEach(presences => {
                        presences.forEach(p => {
                            // Avoid duplicate local participant
                            if (p.participantId !== localParticipant?.id) {
                                syncedParticipants.push({
                                    id: p.participantId,
                                    name: p.participantName,
                                    role: p.role,
                                    online_at: p.online_at
                                });
                            }
                        });
                    });
                    syncParticipants(syncedParticipants);
                    console.log('Presence synced:', syncedParticipants.length, 'participants');
                },

                onPresenceJoin: ({ newPresences }) => {
                    newPresences.forEach(p => {
                        // Avoid duplicate local participant
                        if (p.participantId !== localParticipant?.id) {
                            const participant = {
                                id: p.participantId,
                                name: p.participantName,
                                role: p.role,
                                online_at: p.online_at
                            };
                            addParticipant(participant);

                            // Show notification
                            if (!isCleaningUp) {
                                showNotification(`${p.participantName} bergabung ke majelis`, 'join');
                            }

                            console.log('Participant joined:', p.participantName);

                            // Reshare our tracks to new participant
                            if (localTrackInfoRef.current && localTrackInfoRef.current.sessionId) {
                                // Update publishedAt to current time for fresh timing
                                const reshareInfo = {
                                    ...localTrackInfoRef.current,
                                    publishedAt: new Date().toISOString()
                                };
                                console.log('[Meeting] Resharing tracks to new participant:', reshareInfo.sessionId);
                                sendMessage({
                                    type: 'NEW_TRACKS',
                                    content: JSON.stringify(reshareInfo),
                                    senderId: localParticipant.id
                                });
                            } else {
                                console.log('[Meeting] No tracks to reshare yet (stream not published)');
                            }
                        }
                    });
                },

                onPresenceLeave: ({ leftPresences }) => {
                    leftPresences.forEach(p => {
                        if (p.participantId !== localParticipant?.id) {
                            removeParticipant(p.participantId);

                            // Show notification
                            if (!isCleaningUp) {
                                showNotification(`${p.participantName} keluar dari majelis`, 'leave');
                            }

                            // Remove their stream
                            streamsRef.current.delete(p.participantId);
                            setRemoteStreams(prev => prev.filter(s => s.id !== p.participantId));

                            console.log('Participant left:', p.participantName);
                        }
                    });
                },

                onMessage: async (payload) => {
                    const message = payload.payload;
                    console.log('[Meeting] Received message:', message);

                    // Handle room ended
                    if (message?.content === 'ROOM_ENDED') {
                        isCleaningUp = true;
                        await cameraController.closeCamera();
                        resetParticipants();
                        alert('Host telah mengakhiri rapat.');
                        navigate('/');
                        return;
                    }

                    // Handle room deleted
                    if (message?.content === 'ROOM_DELETED') {
                        isCleaningUp = true;
                        await cameraController.closeCamera();
                        resetParticipants();
                        alert('Majelis ini telah dihapus oleh Host.');
                        navigate('/');
                        return;
                    }

                    // Handle mute request
                    if (message?.type === 'MUTE_REQUEST' && message?.targetId === localParticipant?.id) {
                        showNotification('Anda telah di-mute oleh host', 'warning');
                        cameraController.toggleAudio(false);
                    }

                    // Handle kick request
                    if (message?.type === 'KICK_REQUEST' && message?.targetId === localParticipant?.id) {
                        isCleaningUp = true;
                        await cameraController.closeCamera();
                        resetParticipants();
                        alert('Anda telah dikeluarkan dari rapat.');
                        navigate('/');
                        return;
                    }

                    // Handle emoji reactions
                    if (typeof message?.content === 'string' && message.content.startsWith('EMOJI:')) {
                        const emoji = message.content.replace('EMOJI:', '');
                        setFloatingEmoji({ emoji, sender: message.senderName });
                        setTimeout(() => setFloatingEmoji(null), 3000);
                    }

                    // Handle new tracks
                    if (message?.type === 'NEW_TRACKS') {
                        console.log('[Meeting] NEW_TRACKS received. senderId:', message.senderId, 'localId:', localParticipant?.id);

                        if (message?.senderId !== localParticipant?.id) {
                            try {
                                const trackInfo = JSON.parse(message.content);
                                console.log('Received track info, subscribing:', trackInfo);
                                await webrtcManager.subscribeToTracks(trackInfo);
                            } catch (err) {
                                console.error('Error parsing track info:', err);
                            }
                        } else {
                            console.log('[Meeting] Skipping own NEW_TRACKS message');
                        }
                    }
                }
            });

            // Track local participant presence
            if (localParticipant) {
                await trackPresence(localParticipant.id, localParticipant.name, localParticipant.role);
                console.log('Tracking presence for:', localParticipant.name);
            }

            // Publish local stream to WebRTC
            if (localParticipant.stream) {
                const trackInfo = await webrtcManager.addLocalStream(localParticipant.stream);
                if (trackInfo) {
                    // Add publishedAt timestamp so subscribers can calculate wait time
                    trackInfo.publishedAt = new Date().toISOString();
                    console.log('Local stream published, broadcasting info:', trackInfo.sessionId);
                    localTrackInfoRef.current = trackInfo;
                    await sendMessage({
                        type: 'NEW_TRACKS',
                        content: JSON.stringify(trackInfo),
                        senderId: localParticipant.id
                    });
                } else {
                    console.warn('Local stream added locally (no Cloudflare/Signaling)');
                }
            }
        };

        const timer = setTimeout(initMeeting, 500);

        return async () => {
            clearTimeout(timer);
            isCleaningUp = true;

            if (participantId && localParticipant) {
                try {
                    const { leaveEvent } = await import('../lib/database');
                    await leaveEvent(localParticipant.id);
                    console.log('Left event in database');
                } catch (error) {
                    console.error('Error leaving event in database:', error);
                }
            }
        };
    }, [eventId, subscribe, trackPresence, localParticipant, addParticipant, removeParticipant, syncParticipants, navigate, resetParticipants]);

    // Show error if event is inaccessible
    if (eventError) {
        return (
            <div className="min-h-screen bg-[#071a14] flex items-center justify-center">
                <div className="text-center max-w-md p-8">
                    <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Akses Ditolak</h2>
                    <p className="text-gray-400 mb-6">{eventError}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-xl transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        );
    }

    const participantCount = (participants?.length || 0) + (localParticipant ? 1 : 0);
    const isHost = roleManager.isHost();

    return (
        <div className="bg-[#071a14] h-screen w-full overflow-hidden flex flex-col relative">
            {/* Notification Toast */}
            <div className="fixed top-20 right-6 z-50 space-y-2">
                {notifications.map(notif => (
                    <div
                        key={notif.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md border animate-slide-in-right ${notif.type === 'join' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                            notif.type === 'leave' ? 'bg-gray-500/20 border-gray-500/30 text-gray-400' :
                                notif.type === 'warning' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                                    'bg-[#0d2920]/80 border-[#1a3d32] text-white'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {notif.type === 'join' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />}
                            {notif.type === 'leave' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />}
                            {notif.type === 'warning' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
                        </svg>
                        <span className="text-sm font-medium">{notif.message}</span>
                    </div>
                ))}
            </div>

            {/* Floating Emoji */}
            {floatingEmoji && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
                    <div className="text-8xl">{floatingEmoji.emoji}</div>
                    <p className="text-center text-white text-sm mt-2">{floatingEmoji.sender}</p>
                </div>
            )}

            {/* Top Bar */}
            <header className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex justify-between items-center bg-gradient-to-b from-[#071a14] to-transparent">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-sm leading-tight">Hijra Meet</h1>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${localParticipant?.stream ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                                <span className="text-gray-400 text-xs">{eventId.slice(0, 12)}...</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Debug Info Overlay */}
                <div className="hidden md:flex flex-col items-end mr-4 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
                    <div className="flex gap-2 text-[10px] font-mono text-gray-400">
                        <span>SIG: {channel?.state || '?'}</span>
                        <span>ICE: {webrtcManager.getConnectionStats().ice}</span>
                        <span>CONN: {webrtcManager.getConnectionStats().conn}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex px-4 py-2 bg-[#0d2920]/80 backdrop-blur border border-[#1a3d32] rounded-full items-center gap-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-white font-medium">REC</span>
                    </div>

                    <button
                        onClick={() => setShowParticipants(!showParticipants)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0d2920]/80 hover:bg-[#1a3d32] border border-[#1a3d32] rounded-lg text-white text-sm transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        {participantCount}
                    </button>
                    <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                        {localParticipant?.name?.charAt(0) || 'U'}
                    </div>
                </div>
            </header>

            {/* Video Grid */}
            <div className="flex-1 p-4 pt-20 pb-28 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-[1920px] mx-auto h-full">
                    {localParticipant?.stream && (
                        <VideoTile
                            key="local"
                            stream={localParticipant.stream}
                            label="Anda"
                            participant={localParticipant}
                        />
                    )}

                    {remoteStreams.map(stream => (
                        <VideoTile
                            key={stream.id}
                            stream={stream}
                            label={`Peserta ${stream.id.slice(0, 4)}`}
                        />
                    ))}

                    {!localParticipant?.stream && remoteStreams.length === 0 && (
                        <div className="col-span-full min-h-[50vh] flex flex-col items-center justify-center text-gray-500 gap-4">
                            <div className="w-24 h-24 rounded-full bg-[#0d2920] flex items-center justify-center animate-pulse border border-[#1a3d32]">
                                <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <p className="text-lg">Menunggu peserta lain bergabung...</p>
                            <p className="text-sm text-gray-600">Bagikan link rapat untuk mengundang peserta</p>
                        </div>
                    )}
                </div>
            </div>

            <Controls sendMessage={sendMessage} eventId={eventId} />

            {showParticipants && (
                <ParticipantList
                    onClose={() => setShowParticipants(false)}
                    onKick={sendKickRequest}
                    onMute={sendMuteRequest}
                />
            )}
        </div>
    );
}
