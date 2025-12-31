import { useEffect, useState } from 'react';
import { useEventStore } from '../../store/eventStore';
import { useParticipantStore } from '../../store/participantStore';

function Navbar() {
  const { eventName, isLive, startTime, isRecording } = useEventStore();
  const participants = useParticipantStore((state) => state.participants);
  const [duration, setDuration] = useState(0);

  // Update duration timer
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now - startTime) / 1000);
      setDuration(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Recording Indicator Bar */}
      {isRecording && (
        <div className="bg-rose h-1 w-full animate-pulse" />
      )}

      {/* Main Navbar */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Event Name & Live Badge */}
          <div className="flex items-center gap-4">
            <h1 className="text-white font-semibold text-lg truncate max-w-xs">
              {eventName || 'Hijra Meet'}
            </h1>
            {isLive && (
              <span className="flex items-center gap-2 px-3 py-1 bg-rose/20 text-rose rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-rose rounded-full animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          {/* Center: Timer */}
          {startTime && (
            <div className="text-gray-300 font-mono text-sm">
              {formatDuration(duration)}
            </div>
          )}

          {/* Right: Participant Count */}
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-xl">👥</span>
            <span className="font-medium">{participants.length + 1}</span>
          </div>
        </div>

        {/* Recording Status Text */}
        {isRecording && (
          <div className="mt-2 text-center">
            <span className="text-rose text-sm font-medium">
              🔴 Recording in progress
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export default Navbar;