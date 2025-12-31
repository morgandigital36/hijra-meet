import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useMedia } from '../hooks/useMedia';
import { validateDisplayName } from '../utils/validators';
import { useParticipantStore } from '../store/participantStore';
import { roleManager } from '../core/roleManager';
import { checkEventAccess, getStoredHostName, setStoredHostName, updateEventHostName, getHostEvents } from '../lib/database';

function Setup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);

  const isHostFromState = location.state?.isHost || false;

  const {
    stream,
    devices,
    error: mediaError,
    loading: mediaLoading,
    requestAccess,
    loadDevices,
    toggleVideo,
    toggleAudio,
    switchCamera,
    switchMicrophone,
  } = useMedia();

  const setLocalParticipant = useParticipantStore((state) => state.setLocalParticipant);

  const [meetingCode, setMeetingCode] = useState(id || '');
  const [displayName, setDisplayName] = useState('');
  const [nameError, setNameError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [isHost, setIsHost] = useState(isHostFromState);
  const [isLoading, setIsLoading] = useState(true);
  const [eventInfo, setEventInfo] = useState(null);
  const [hostEvents, setHostEvents] = useState([]);

  // Check event access and auto-detect host
  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      setGeneralError('');

      if (id) {
        try {
          const result = await checkEventAccess(id);

          if (!result.accessible) {
            setGeneralError(result.error);
            setIsLoading(false);
            return;
          }

          setEventInfo(result.event);

          // Auto-detect if current user is host
          if (result.isHost) {
            setIsHost(true);
            roleManager.setRole('host');

            // Auto-fill host name
            const storedHostName = getStoredHostName();
            if (storedHostName) {
              setDisplayName(storedHostName);
            } else if (result.hostName) {
              setDisplayName(result.hostName);
              setStoredHostName(result.hostName);
            }
          }
        } catch (err) {
          setGeneralError('Gagal memuat informasi majelis');
        }
      }

      // Load host's previous events
      try {
        const events = await getHostEvents();
        setHostEvents(events.slice(0, 5)); // Show last 5 events
      } catch (err) {
        console.error('Failed to load host events:', err);
      }

      setIsLoading(false);
    };

    checkAccess();
  }, [id]);

  // Auto-fill meeting code from URL
  useEffect(() => {
    if (id) {
      setMeetingCode(id);
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      await requestAccess({ video: true, audio: true });
      const result = await loadDevices();
      if (result.success && result.devices) {
        if (result.devices.cameras.length > 0) {
          setSelectedCamera(result.devices.cameras[0].deviceId);
        }
        if (result.devices.microphones.length > 0) {
          setSelectedMic(result.devices.microphones[0].deviceId);
        }
      }
    };
    init();
  }, [requestAccess, loadDevices]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleToggleVideo = () => {
    const enabled = toggleVideo();
    setVideoEnabled(enabled);
  };

  const handleToggleAudio = () => {
    const enabled = toggleAudio();
    setAudioEnabled(enabled);
  };

  const handleCameraChange = async (e) => {
    const deviceId = e.target.value;
    setSelectedCamera(deviceId);
    await switchCamera(deviceId);
  };

  const handleMicChange = async (e) => {
    const deviceId = e.target.value;
    setSelectedMic(deviceId);
    await switchMicrophone(deviceId);
  };

  const handleJoinRoom = async () => {
    setNameError('');
    setGeneralError('');

    let code = meetingCode.trim();

    // If input is a URL, extract the meeting ID
    if (code.includes('http') || code.includes('localhost')) {
      try {
        const urlStr = code.startsWith('http') ? code : `https://${code}`;
        const url = new URL(urlStr);
        const pathParts = url.pathname.split('/').filter(p => p.length > 0);

        if (pathParts.length > 0) {
          code = pathParts[pathParts.length - 1];
        }
      } catch (err) {
        console.warn('Failed to parse URL, using raw code');
      }
    }

    if (!code) {
      setNameError('Kode rapat diperlukan');
      return;
    }

    // Validate name - REQUIRED for everyone
    const validation = validateDisplayName(displayName);
    if (!validation.valid) {
      setNameError(validation.error || 'Nama wajib diisi');
      return;
    }

    // Check event access again before joining
    try {
      const result = await checkEventAccess(code);
      if (!result.accessible) {
        setGeneralError(result.error);
        return;
      }

      // If host, save name and update event
      if (isHost || result.isHost) {
        setStoredHostName(validation.value);
        roleManager.setRole('host');

        // Update event with host name if not set
        if (!result.event.host_name) {
          await updateEventHostName(code, validation.value);
        }
      } else {
        roleManager.setRole('participant');
        roleManager.setParticipantName(validation.value);
      }

      setLocalParticipant({
        id: `user-${Date.now()}`,
        name: validation.value,
        role: (isHost || result.isHost) ? 'host' : 'participant',
        cameraOn: videoEnabled,
        micOn: audioEnabled,
        stream: stream,
      });

      navigate(`/event/${code}`, {
        state: {
          displayName: validation.value,
          isHost: isHost || result.isHost,
          videoEnabled,
          audioEnabled,
        },
      });
    } catch (err) {
      console.error(err);
      setGeneralError('Gagal mengakses majelis');
    }
  };

  const handleCreateNewMeeting = async () => {
    // Validate name first for new meeting
    if (!displayName.trim()) {
      setNameError('Masukkan nama Anda terlebih dahulu');
      return;
    }

    const validation = validateDisplayName(displayName);
    if (!validation.valid) {
      setNameError(validation.error);
      return;
    }

    try {
      setStoredHostName(validation.value);
      roleManager.setRole('host');

      const { createEvent } = await import('../lib/database');
      const newEvent = await createEvent({
        name: 'Instant Meeting',
        hostId: null,
        maxCameras: 20,
      });

      // Update event with host name
      await updateEventHostName(newEvent.id, validation.value);

      setMeetingCode(newEvent.id);
      setIsHost(true);
      navigate(`/setup/${newEvent.id}`, { state: { isHost: true }, replace: true });
    } catch (err) {
      console.error('Error creating event:', err);
      setGeneralError('Gagal membuat majelis baru');
    }
  };

  const copyMeetingLink = () => {
    const link = `${window.location.origin}/setup/${meetingCode}`;
    navigator.clipboard.writeText(link);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  // Load host events for upcoming meetings section
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);

  useEffect(() => {
    const loadUpcomingMeetings = async () => {
      if (isHost) {
        try {
          const events = await getHostEvents();
          setUpcomingMeetings(events.filter(e => e.status === 'initial' || e.status === 'live').slice(0, 3));
        } catch (err) {
          console.error('Failed to load upcoming meetings:', err);
        }
      }
    };
    loadUpcomingMeetings();
  }, [isHost]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#071a14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (generalError && !meetingCode) {
    return (
      <div className="min-h-screen bg-[#071a14] flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Akses Ditolak</h2>
          <p className="text-gray-400 mb-6">{generalError}</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071a14] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-medium tracking-tight">Hijra <span className="font-bold text-emerald-400">Meet</span></span>
          </Link>
        </div>

        {displayName && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-gray-400">{isHost ? 'Host' : 'Participant'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold border border-[#1a3d32]">
              {displayName?.charAt(0) || 'H'}
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Green Room */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* Left: Video Preview */}
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-[700px] aspect-video bg-[#1a1c1b] rounded-2xl overflow-hidden shadow-2xl border border-[#2d2f2e] group">
              {stream && videoEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-600/20 text-emerald-500 text-4xl font-bold flex items-center justify-center mx-auto mb-4">
                      {displayName?.[0]?.toUpperCase() || 'H'}
                    </div>
                    <p className="text-gray-400">Kamera dimatikan</p>
                  </div>
                </div>
              )}

              {/* Overlay Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-[#1a1c1b]/80 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={handleToggleAudio}
                  className={`p-3 rounded-full transition-colors ${audioEnabled ? 'bg-transparent hover:bg-white/10 text-white' : 'bg-rose-500 text-white border-transparent'}`}
                  title={audioEnabled ? "Matikan Mikrofon" : "Hidupkan Mikrofon"}
                >
                  {audioEnabled ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                  )}
                </button>
                <button
                  onClick={handleToggleVideo}
                  className={`p-3 rounded-full transition-colors ${videoEnabled ? 'bg-transparent hover:bg-white/10 text-white' : 'bg-rose-500 text-white border-transparent'}`}
                  title={videoEnabled ? "Matikan Kamera" : "Hidupkan Kamera"}
                >
                  {videoEnabled ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  )}
                </button>
              </div>

              {/* Audio Visualizer (Simple) */}
              <div className="absolute top-4 right-4 bg-[#1a1c1b]/60 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${audioEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs font-medium text-white">{audioEnabled ? 'Mic On' : 'Mic Off'}</span>
              </div>
            </div>

            {/* Device Selectors */}
            <div className="flex gap-4 mt-4 text-sm text-gray-400 w-full max-w-[700px]">
              <div className="flex-1">
                <select
                  value={selectedMic}
                  onChange={handleMicChange}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm hover:text-white cursor-pointer"
                >
                  {devices.microphones.map(d => <option key={d.deviceId} value={d.deviceId} className="bg-[#1a1c1b]">{d.label || 'Default Microphone'}</option>)}
                </select>
              </div>
              <div className="flex-1 text-right">
                <select
                  value={selectedCamera}
                  onChange={handleCameraChange}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm hover:text-white cursor-pointer text-right"
                >
                  {devices.cameras.map(d => <option key={d.deviceId} value={d.deviceId} className="bg-[#1a1c1b]">{d.label || 'Default Camera'}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Right: Join Actions */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <div>
              <h2 className="text-3xl lg:text-4xl font-normal mb-2 text-white">Siap untuk bergabung?</h2>
              {eventInfo ? (
                <p className="text-gray-400 text-lg">Anda akan masuk ke <span className="text-white font-medium">{eventInfo.name}</span></p>
              ) : (
                <p className="text-gray-400 text-lg">{isHost ? 'Anda adalah Host rapat ini.' : 'Pastikan nama Anda sudah benar.'}</p>
              )}
            </div>

            {/* Name Input Logic */}
            <div className="w-full max-w-sm">
              {!isHost ? (
                <>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Nama Tampilan</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setNameError('');
                    }}
                    placeholder="Nama Anda"
                    className="w-full bg-[#1a1c1b] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all text-lg"
                  />
                  {nameError && <p className="text-rose-400 text-sm mt-1">{nameError}</p>}
                </>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-[#1a1c1b] rounded-lg border border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                    {displayName?.[0] || 'H'}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">{displayName}</p>
                    <p className="text-xs text-emerald-400">Host (Anda)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                onClick={handleJoinRoom}
                disabled={isLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-full transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Memproses...' : 'Gabung Sekarang'}
              </button>
              {isHost && (
                <button
                  onClick={() => {
                    // Logic for presenting (future)
                    handleJoinRoom();
                  }}
                  className="flex-1 bg-[#1a1c1b] border border-gray-600 hover:bg-gray-800 text-emerald-400 font-medium py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Presentasi
                </button>
              )}
            </div>

            {generalError && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm w-full max-w-sm text-center">
                {generalError}
              </div>
            )}

            {/* Meeting Info / People */}
            {isHost && (
              <div className="mt-4 text-sm text-gray-500">
                {/* Placeholder for "No one else is here" */}
                <p>Belum ada orang lain di sini.</p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
export default Setup;
