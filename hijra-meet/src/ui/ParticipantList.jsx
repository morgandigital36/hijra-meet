import React from 'react';
import { useParticipantStore } from '../store/participantStore';
import { roleManager } from '../core/roleManager';

export default function ParticipantList({ onClose, onKick, onMute }) {
    const { participants, localParticipant } = useParticipantStore();
    const isHost = roleManager.isHost();

    // Combine local and remote participants for the list
    const allParticipants = [
        ...(localParticipant ? [{ ...localParticipant, isLocal: true }] : []),
        ...participants
    ];

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-700 shadow-2xl p-4 transform transition-transform z-40 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Participants ({allParticipants.length})</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-4">
                {allParticipants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                                {p.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white flex items-center gap-2">
                                    {p.name}
                                    {p.isLocal && <span className="text-[10px] bg-slate-600 px-1 rounded">You</span>}
                                    {p.role === 'host' && <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-1 rounded border border-emerald-800">Host</span>}
                                </p>
                            </div>
                        </div>

                        {/* Status Icons & Controls */}
                        <div className="flex items-center gap-2">
                            {/* Icons (Read-only status) */}
                            <span className="text-xs" title={p.micOn ? "Mic On" : "Mic Off"}>
                                {p.micOn ? '🎤' : '🔇'}
                            </span>
                            <span className="text-xs" title={p.cameraOn ? "Camera On" : "Camera Off"}>
                                {p.cameraOn ? '📹' : '⬛'}
                            </span>

                            {/* Host Controls */}
                            {isHost && !p.isLocal && (
                                <div className="flex items-center gap-1 pl-2 border-l border-slate-700 ml-2">
                                    <button
                                        onClick={() => onMute(p.id)}
                                        className="p-1 hover:bg-rose-900/50 rounded text-rose-400 transition-colors"
                                        title="Mute Participant"
                                    >
                                        🔇
                                    </button>
                                    <button
                                        onClick={() => onKick(p.id)}
                                        className="p-1 hover:bg-rose-900/50 rounded text-rose-400 transition-colors"
                                        title="Kick Participant"
                                    >
                                        🚫
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
