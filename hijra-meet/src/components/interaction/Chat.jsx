import { useState, useEffect, useRef } from 'react';
import { sendMessage as dbSendMessage, getMessages } from '../../lib/database';
import { useParticipantStore } from '../../store/participantStore';
import { useToast } from '../ui/ToastContainer';

export default function Chat({ eventId, sendMessage }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { localParticipant } = useParticipantStore();
    const toast = useToast();

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load initial messages
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const msgs = await getMessages(eventId);
                setMessages(msgs || []);
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        loadMessages();
    }, [eventId]);

    // Handle real-time message (from broadcast)
    useEffect(() => {
        // Messages will be added via realtime subscriptions
        // This is handled by the parent Meeting component
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !localParticipant) return;

        setLoading(true);
        try {
            // Store in database
            const msg = await dbSendMessage({
                eventId,
                senderId: localParticipant.id,
                senderName: localParticipant.name,
                content: newMessage.trim(),
            });

            // Broadcast via realtime
            await sendMessage(newMessage.trim(), localParticipant.name);

            // Optimistic update
            setMessages(prev => [...prev, msg]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-800 rounded-lg">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white">Chat</h3>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm">No messages yet</p>
                ) : (
                    messages.map((msg, index) => (
                        <div key={msg.id || index} className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                <span className="font-medium text-emerald text-sm">
                                    {msg.sender_name || msg.senderName}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            <p className="text-white text-sm mt-1">{msg.content}</p>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent text-sm"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || loading}
                        className="px-4 py-2 bg-emerald hover:bg-emerald/90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}
