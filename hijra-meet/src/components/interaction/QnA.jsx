import { useState, useEffect } from 'react';
import {
    submitQuestion,
    getQuestions,
    upvoteQuestion,
    pinQuestion,
    approveQuestion
} from '../../lib/database';
import { useParticipantStore } from '../../store/participantStore';
import { roleManager } from '../../core/roleManager';

export default function QnA({ eventId }) {
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const { localParticipant } = useParticipantStore();
    const isHost = roleManager.isHost();

    // Load questions
    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const qs = await getQuestions(eventId);
                setQuestions(qs || []);
            } catch (error) {
                console.error('Error loading questions:', error);
            }
        };

        loadQuestions();
    }, [eventId]);

    const handleSubmitQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestion.trim() || !localParticipant) return;

        setLoading(true);
        try {
            const q = await submitQuestion({
                eventId,
                askerId: localParticipant.id,
                askerName: localParticipant.name,
                content: newQuestion.trim(),
            });

            setQuestions(prev => [...prev, q]);
            setNewQuestion('');
        } catch (error) {
            console.error('Error submitting question:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpvote = async (questionId) => {
        try {
            await upvoteQuestion(questionId);
            setQuestions(prev =>
                prev.map(q =>
                    q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q
                )
            );
        } catch (error) {
            console.error('Error upvoting question:', error);
        }
    };

    const handlePin = async (questionId, isPinned) => {
        try {
            await pinQuestion(questionId, !isPinned);
            setQuestions(prev =>
                prev.map(q =>
                    q.id === questionId ? { ...q, is_pinned: !isPinned } : q
                )
            );
        } catch (error) {
            console.error('Error pinning question:', error);
        }
    };

    const handleApprove = async (questionId) => {
        try {
            await approveQuestion(questionId);
            setQuestions(prev =>
                prev.map(q =>
                    q.id === questionId ? { ...q, is_approved: true } : q
                )
            );
        } catch (error) {
            console.error('Error approving question:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-800 rounded-lg">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white">Q&A</h3>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {questions.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm">No questions yet</p>
                ) : (
                    questions.map((q) => (
                        <div
                            key={q.id}
                            className={`p-3 rounded-lg ${q.is_pinned ? 'bg-emerald-900/20 border-2 border-emerald-600' : 'bg-slate-700'
                                }`}
                        >
                            {/* Question Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-emerald text-sm">
                                            {q.asker_name}
                                        </span>
                                        {q.is_pinned && (
                                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded">
                                                Pinned
                                            </span>
                                        )}
                                        {!q.is_approved && isHost && (
                                            <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-white text-sm">{q.content}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-2">
                                {/* Upvote */}
                                <button
                                    onClick={() => handleUpvote(q.id)}
                                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-emerald transition-colors"
                                >
                                    <span>👍</span>
                                    <span>{q.upvotes || 0}</span>
                                </button>

                                {/* Host Actions */}
                                {isHost && (
                                    <>
                                        {!q.is_approved && (
                                            <button
                                                onClick={() => handleApprove(q.id)}
                                                className="text-sm text-emerald hover:underline"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handlePin(q.id, q.is_pinned)}
                                            className="text-sm text-blue-400 hover:underline"
                                        >
                                            {q.is_pinned ? 'Unpin' : 'Pin'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Submit Form */}
            <form onSubmit={handleSubmitQuestion} className="p-4 border-t border-slate-700">
                <div className="flex flex-col gap-2">
                    <textarea
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Ask a question..."
                        rows="2"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent text-sm resize-none"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!newQuestion.trim() || loading}
                        className="self-end px-4 py-2 bg-emerald hover:bg-emerald/90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                    >
                        Ask
                    </button>
                </div>
            </form>
        </div>
    );
}
