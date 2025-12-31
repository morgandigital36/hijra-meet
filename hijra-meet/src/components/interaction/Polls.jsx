import { useState, useEffect } from 'react';
import { createPoll, getPolls, submitVote, getPollResults } from '../../lib/database';
import { useParticipantStore } from '../../store/participantStore';
import { roleManager } from '../../core/roleManager';

export default function Polls({ eventId }) {
    const [polls, setPolls] = useState([]);
    const [newPollQuestion, setNewPollQuestion] = useState('');
    const [newPollOptions, setNewPollOptions] = useState(['', '']);
    const [loading, setLoading] = useState(false);
    const [votedPolls, setVotedPolls] = useState(new Set());
    const { localParticipant } = useParticipantStore();
    const isHost = roleManager.isHost();

    // Load polls
    useEffect(() => {
        const loadPolls = async () => {
            try {
                const p = await getPolls(eventId);
                setPolls(p || []);
            } catch (error) {
                console.error('Error loading polls:', error);
            }
        };

        loadPolls();
    }, [eventId]);

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        if (!newPollQuestion.trim() || !isHost) return;

        const validOptions = newPollOptions.filter(o => o.trim());
        if (validOptions.length < 2) {
            alert('Please add at least 2 options');
            return;
        }

        setLoading(true);
        try {
            const poll = await createPoll({
                eventId,
                question: newPollQuestion.trim(),
                options: validOptions.map((text, index) => ({
                    id: String(index),
                    text: text.trim(),
                })),
            });

            setPolls(prev => [poll, ...prev]);
            setNewPollQuestion('');
            setNewPollOptions(['', '']);
        } catch (error) {
            console.error('Error creating poll:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (pollId, optionId) => {
        if (!localParticipant || votedPolls.has(pollId)) return;

        try {
            await submitVote({
                pollId,
                voterId: localParticipant.id,
                optionId,
            });

            setVotedPolls(prev => new Set([...prev, pollId]));

            // Refresh poll results
            const results = await getPollResults(pollId);
            setPolls(prev =>
                prev.map(p =>
                    p.id === pollId ? { ...p, results } : p
                )
            );
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    const addOption = () => {
        setNewPollOptions(prev => [...prev, '']);
    };

    const updateOption = (index, value) => {
        setNewPollOptions(prev =>
            prev.map((opt, i) => (i === index ? value : opt))
        );
    };

    const removeOption = (index) => {
        if (newPollOptions.length > 2) {
            setNewPollOptions(prev => prev.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-800 rounded-lg">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white">Polls</h3>
            </div>

            {/* Polls List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {polls.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm">No polls yet</p>
                ) : (
                    polls.map((poll) => {
                        const hasVoted = votedPolls.has(poll.id);
                        const totalVotes = poll.results
                            ? Object.values(poll.results).reduce((sum, votes) => sum + votes, 0)
                            : 0;

                        return (
                            <div key={poll.id} className="p-4 bg-slate-700 rounded-lg">
                                <h4 className="font-medium text-white mb-3">{poll.question}</h4>

                                <div className="space-y-2">
                                    {poll.options.map((option) => {
                                        const votes = poll.results?.[option.id] || 0;
                                        const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleVote(poll.id, option.id)}
                                                disabled={hasVoted}
                                                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${hasVoted
                                                    ? 'bg-slate-600 cursor-default'
                                                    : 'bg-slate-600 hover:bg-slate-500'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-white text-sm">{option.text}</span>
                                                    {hasVoted && (
                                                        <span className="text-gray-300 text-sm font-medium">
                                                            {percentage.toFixed(0)}%
                                                        </span>
                                                    )}
                                                </div>
                                                {hasVoted && (
                                                    <div className="w-full bg-slate-800 rounded-full h-2">
                                                        <div
                                                            className="bg-emerald h-2 rounded-full transition-all"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {hasVoted && (
                                    <p className="text-gray-400 text-xs mt-2">
                                        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Poll Form (Host Only) */}
            {isHost && (
                <form onSubmit={handleCreatePoll} className="p-4 border-t border-slate-700">
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={newPollQuestion}
                            onChange={(e) => setNewPollQuestion(e.target.value)}
                            placeholder="Poll question..."
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent text-sm"
                            disabled={loading}
                        />

                        {newPollOptions.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent text-sm"
                                    disabled={loading}
                                />
                                {newPollOptions.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(index)}
                                        className="px-2 text-rose hover:text-rose/80"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addOption}
                            className="text-sm text-emerald hover:underline"
                        >
                            + Add option
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-emerald hover:bg-emerald/90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                        >
                            Create Poll
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
