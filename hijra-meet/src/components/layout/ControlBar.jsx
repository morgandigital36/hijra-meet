import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ControlBar({
  role = 'participant',
  audioEnabled = true,
  videoEnabled = true,
  handRaised = false,
  onToggleAudio,
  onToggleVideo,
  onRaiseHand,
  onScreenShare,
  onRecord,
  onLeave,
}) {
  const navigate = useNavigate();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleLeave = () => {
    if (onLeave) {
      onLeave();
    }
    navigate('/');
  };

  return (
    <>
      <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
        <div className="flex items-center justify-center gap-3">
          {/* Microphone */}
          <button
            onClick={onToggleAudio}
            className={`p-4 rounded-full transition-all ${
              audioEnabled
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-rose hover:bg-rose/90 text-white'
            }`}
            title={audioEnabled ? 'Mute' : 'Unmute'}
            aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            <span className="text-xl">{audioEnabled ? '🎤' : '🔇'}</span>
          </button>

          {/* Camera */}
          <button
            onClick={onToggleVideo}
            className={`p-4 rounded-full transition-all ${
              videoEnabled
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-rose hover:bg-rose/90 text-white'
            }`}
            title={videoEnabled ? 'Stop video' : 'Start video'}
            aria-label={videoEnabled ? 'Stop video' : 'Start video'}
          >
            <span className="text-xl">{videoEnabled ? '📹' : '📷'}</span>
          </button>

          {/* Raise Hand (Participants only) */}
          {role === 'participant' && (
            <button
              onClick={onRaiseHand}
              className={`p-4 rounded-full transition-all ${
                handRaised
                  ? 'bg-emerald hover:bg-emerald/90 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
              title={handRaised ? 'Lower hand' : 'Raise hand'}
              aria-label={handRaised ? 'Lower hand' : 'Raise hand'}
            >
              <span className="text-xl">✋</span>
            </button>
          )}

          {/* Screen Share (Host only) */}
          {role === 'host' && onScreenShare && (
            <button
              onClick={onScreenShare}
              className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all"
              title="Share screen"
              aria-label="Share screen"
            >
              <span className="text-xl">🖥️</span>
            </button>
          )}

          {/* Record (Host only) */}
          {role === 'host' && onRecord && (
            <button
              onClick={onRecord}
              className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all"
              title="Record"
              aria-label="Record"
            >
              <span className="text-xl">⏺️</span>
            </button>
          )}

          {/* Leave */}
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="p-4 rounded-full bg-rose hover:bg-rose/90 text-white transition-all ml-4"
            title="Leave"
            aria-label="Leave meeting"
          >
            <span className="text-xl">📞</span>
          </button>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-white text-lg font-semibold mb-2">
              Leave Meeting?
            </h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to leave this meeting?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                className="flex-1 py-2 px-4 bg-rose hover:bg-rose/90 text-white rounded-lg transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ControlBar;