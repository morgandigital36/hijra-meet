import { useMemo } from 'react';
import VideoTile from './VideoTile';
import EmptyState from './EmptyState';

function VideoStage({ participants = [], screenShare = null }) {
  // Calculate grid layout based on participant count
  const getGridClass = useMemo(() => {
    const count = participants.length;
    
    if (count === 0) return '';
    if (count === 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  }, [participants.length]);

  // If screen share is active, show it prominently
  if (screenShare) {
    return (
      <div className="h-full w-full bg-slate-900 p-4">
        <div className="h-full flex flex-col gap-4">
          {/* Screen Share (main) */}
          <div className="flex-1 bg-black rounded-lg overflow-hidden">
            <video
              autoPlay
              playsInline
              className="w-full h-full object-contain"
              ref={(video) => {
                if (video && screenShare.stream) {
                  video.srcObject = screenShare.stream;
                }
              }}
            />
          </div>

          {/* Host camera (picture-in-picture) */}
          {participants.length > 0 && (
            <div className="h-32 flex gap-2 overflow-x-auto">
              {participants.slice(0, 5).map((participant) => (
                <div key={participant.id} className="w-48 flex-shrink-0">
                  <VideoTile participant={participant} compact />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // No participants
  if (participants.length === 0) {
    return <EmptyState />;
  }

  // Normal grid view
  return (
    <div className={`h-full w-full bg-slate-900 p-4 grid ${getGridClass} gap-4 auto-rows-fr transition-all duration-300`}>
      {participants.map((participant) => (
        <VideoTile key={participant.id} participant={participant} />
      ))}
    </div>
  );
}

export default VideoStage;