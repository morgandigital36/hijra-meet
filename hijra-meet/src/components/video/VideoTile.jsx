import { useEffect, useRef, useState } from 'react';
import { useAudioLevel } from '../../hooks/useAudioLevel';

function VideoTile({ stream, label, participant = {}, compact = false }) {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const { isSpeaking } = useAudioLevel(stream);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      const t = setTimeout(() => setVideoError(false), 0);
      return () => clearTimeout(t);
    }
  }, [stream]);

  const handleVideoError = () => {
    setVideoError(true);
  };

  return (
    <div
      className={`relative bg-[#0d2920] rounded-2xl overflow-hidden border border-[#1a3d32] ${isSpeaking ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-400/20' : ''
        } ${compact ? 'h-full' : 'aspect-video'} transition-all group`}
    >
      {stream && !videoError ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.id === 'local' || label === 'You' || label === 'Anda'}
          onError={handleVideoError}
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d2920]">
          <div className="text-center">
            <div className={`${compact ? 'w-12 h-12' : 'w-20 h-20'} bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-2`}>
              <span className={`${compact ? 'text-xl' : 'text-3xl'} font-bold text-white`}>
                {participant.name?.charAt(0).toUpperCase() || label?.charAt(0).toUpperCase() || 'P'}
              </span>
            </div>
            {!compact && (
              <p className="text-gray-500 text-sm">Kamera Mati</p>
            )}
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>

      {/* Hand Raised Indicator */}
      {participant.handRaised && (
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-amber-500 rounded-lg flex items-center gap-1.5 animate-bounce">
          <span className="text-lg">✋</span>
          <span className="text-xs font-medium text-white">Angkat Tangan</span>
        </div>
      )}

      {/* Name Label */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg flex items-center gap-2">
          <span className="text-white text-sm font-medium">
            {participant.name || label || 'Unknown'}
          </span>
          {participant.role === 'host' && (
            <span className="px-1.5 py-0.5 bg-emerald-500 text-[10px] text-white font-bold rounded">HOST</span>
          )}
          {isSpeaking && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </div>
      </div>

      {/* Mute Indicator */}
      {(participant.micOn === false) && (
        <div className="absolute bottom-3 right-3 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default VideoTile;