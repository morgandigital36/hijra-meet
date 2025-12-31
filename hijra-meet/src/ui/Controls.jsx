import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cameraController } from '../core/cameraController';
import { roleManager } from '../core/roleManager';
import { useParticipantStore } from '../store/participantStore';
import Chat from '../components/interaction/Chat';
import QnA from '../components/interaction/QnA';
import Polls from '../components/interaction/Polls';

export default function Controls({ sendMessage, eventId }) {
    const navigate = useNavigate();
    const localVideoRef = useRef(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const screenStreamRef = useRef(null);

    const { localParticipant, setLocalParticipant } = useParticipantStore();
    const isHost = roleManager.isHost();

    useEffect(() => {
        const autoStartCamera = async () => {
            if (localParticipant?.cameraOn && !isCameraOn) {
                try {
                    const stream = await cameraController.openCamera();
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                    setLocalParticipant({ ...localParticipant, stream });
                    setIsCameraOn(true);
                    setIsMicOn(localParticipant?.micOn ?? true);
                } catch (err) {
                    console.error('Failed to auto-start camera:', err);
                }
            }
        };
        autoStartCamera();
    }, [localParticipant?.id]);

    const handleOpenCamera = async () => {
        try {
            const stream = await cameraController.openCamera();
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setIsCameraOn(true);
            setIsMicOn(true);
            setLocalParticipant({ ...localParticipant, stream, cameraOn: true, micOn: true });
        } catch (err) {
            console.error('Failed to open camera:', err);
        }
    };

    const handleCloseCamera = async () => {
        try {
            await cameraController.closeCamera();
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
            setIsCameraOn(false);
            setIsMicOn(false);
            setLocalParticipant({ ...localParticipant, stream: null, cameraOn: false, micOn: false });
        } catch (err) {
            console.error('Failed to close camera:', err);
        }
    };

    const handleToggleMic = () => {
        const newState = !isMicOn;
        cameraController.toggleAudio(newState);
        setIsMicOn(newState);
        setLocalParticipant({ ...localParticipant, micOn: newState });
    };

    // Screen Share
    const handleScreenShare = async () => {
        if (isScreenSharing) {
            // Stop screen sharing
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }
            setIsScreenSharing(false);
            // Restore camera
            if (isCameraOn) {
                await handleOpenCamera();
            }
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                screenStreamRef.current = screenStream;
                setIsScreenSharing(true);

                // Listen for when user stops sharing via browser UI
                screenStream.getVideoTracks()[0].onended = () => {
                    setIsScreenSharing(false);
                    screenStreamRef.current = null;
                };

                // Update local participant stream to screen share
                setLocalParticipant({ ...localParticipant, stream: screenStream });
            } catch (err) {
                console.error('Failed to share screen:', err);
            }
        }
    };

    // Hand Raise
    const handleRaiseHand = () => {
        setHandRaised(!handRaised);
        setLocalParticipant({ ...localParticipant, handRaised: !handRaised });
        if (sendMessage) {
            sendMessage(handRaised ? 'HAND_LOWERED' : 'HAND_RAISED', localParticipant?.name);
        }
    };

    // Copy meeting link
    const copyMeetingLink = () => {
        const link = `${window.location.origin}/setup/${eventId}`;
        navigator.clipboard.writeText(link);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    const handleEndCall = async () => {
        cameraController.closeCamera();
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (isHost && confirm('Akhiri rapat untuk semua peserta?')) {
            if (sendMessage) {
                await sendMessage('ROOM_ENDED', localParticipant?.name || 'Host');
            }
        }
        navigate('/');
    };

    const emojis = ['👍', '👏', '🎉', '❤️', '😂', '😮', '😢', '🙏'];

    const sendEmoji = (emoji) => {
        if (sendMessage) {
            sendMessage(`EMOJI:${emoji}`, localParticipant?.name);
        }
        setShowEmoji(false);
    };

    return (
        <>
            {/* Control Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-3 bg-[#0d2920]/95 backdrop-blur-md border border-[#1a3d32] rounded-2xl shadow-2xl">
                {/* Mic */}
                <button
                    onClick={handleToggleMic}
                    className={`p-3 rounded-xl transition-all ${isMicOn ? 'bg-[#1a3d32] hover:bg-[#234d3f] text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
                    title={isMicOn ? "Matikan Mikrofon" : "Nyalakan Mikrofon"}
                >
                    {isMicOn ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                    )}
                </button>

                {/* Camera */}
                <button
                    onClick={isCameraOn ? handleCloseCamera : handleOpenCamera}
                    className={`p-3 rounded-xl transition-all ${isCameraOn ? 'bg-[#1a3d32] hover:bg-[#234d3f] text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
                    title={isCameraOn ? "Matikan Kamera" : "Nyalakan Kamera"}
                >
                    {isCameraOn ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    )}
                </button>

                {/* Screen Share */}
                <button
                    onClick={handleScreenShare}
                    className={`p-3 rounded-xl transition-all ${isScreenSharing ? 'bg-emerald-500 text-white' : 'bg-[#1a3d32] hover:bg-[#234d3f] text-white'}`}
                    title={isScreenSharing ? "Berhenti Berbagi Layar" : "Bagikan Layar"}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </button>

                {/* Hand Raise */}
                <button
                    onClick={handleRaiseHand}
                    className={`p-3 rounded-xl transition-all ${handRaised ? 'bg-amber-500 text-white' : 'bg-[#1a3d32] hover:bg-[#234d3f] text-white'}`}
                    title={handRaised ? "Turunkan Tangan" : "Angkat Tangan"}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                </button>

                {/* Emoji */}
                <div className="relative">
                    <button
                        onClick={() => setShowEmoji(!showEmoji)}
                        className={`p-3 rounded-xl transition-all ${showEmoji ? 'bg-emerald-500 text-white' : 'bg-[#1a3d32] hover:bg-[#234d3f] text-white'}`}
                        title="Kirim Reaksi"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    {showEmoji && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-[#0d2920] border border-[#1a3d32] rounded-xl shadow-xl flex gap-1">
                            {emojis.map((emoji) => (
                                <button key={emoji} onClick={() => sendEmoji(emoji)} className="w-10 h-10 rounded-lg hover:bg-[#1a3d32] flex items-center justify-center text-xl transition-colors">
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat */}
                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={`p-3 rounded-xl transition-all ${showSidebar ? 'bg-emerald-500 text-white' : 'bg-[#1a3d32] hover:bg-[#234d3f] text-white'}`}
                    title="Chat"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </button>

                {/* Share Link */}
                <div className="relative">
                    <button
                        onClick={copyMeetingLink}
                        className="p-3 rounded-xl bg-[#1a3d32] hover:bg-[#234d3f] text-white transition-all"
                        title="Salin Link Rapat"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                    {showCopied && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg whitespace-nowrap">
                            Link tersalin!
                        </div>
                    )}
                </div>

                {/* Settings */}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-3 rounded-xl transition-all ${showSettings ? 'bg-emerald-500 text-white' : 'bg-[#1a3d32] hover:bg-[#234d3f] text-white'}`}
                    title="Pengaturan"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>

                <div className="w-px h-8 bg-[#1a3d32] mx-1"></div>

                {/* End Call */}
                <button
                    onClick={handleEndCall}
                    className="px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
                    <span className="hidden md:inline">Akhiri</span>
                </button>
            </div>

            {/* Chat Sidebar */}
            <div className={`fixed right-0 top-0 bottom-0 w-80 bg-[#0a1f18] border-l border-[#1a3d32] shadow-2xl transform transition-transform duration-300 z-40 flex flex-col ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b border-[#1a3d32] flex justify-between items-center">
                    <h3 className="font-bold text-white">Interaksi</h3>
                    <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex border-b border-[#1a3d32]">
                    {['chat', 'qna', 'polls'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            {tab === 'chat' ? 'Chat' : tab === 'qna' ? 'Tanya Jawab' : 'Polling'}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'chat' && <Chat eventId={eventId} />}
                    {activeTab === 'qna' && <QnA eventId={eventId} isHost={isHost} />}
                    {activeTab === 'polls' && <Polls eventId={eventId} isHost={isHost} />}
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
                    <div className="bg-[#0a1f18] border border-[#1a3d32] rounded-2xl p-6 w-96 max-w-[90vw]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Pengaturan</h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Kamera</label>
                                <select className="w-full bg-[#0d2920] border border-[#1a3d32] rounded-xl py-3 px-4 text-white">
                                    <option>Default Camera</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Mikrofon</label>
                                <select className="w-full bg-[#0d2920] border border-[#1a3d32] rounded-xl py-3 px-4 text-white">
                                    <option>Default Microphone</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Speaker</label>
                                <select className="w-full bg-[#0d2920] border border-[#1a3d32] rounded-xl py-3 px-4 text-white">
                                    <option>Default Speaker</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <video ref={localVideoRef} className="hidden" muted playsInline />
        </>
    );
}
