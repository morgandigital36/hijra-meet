import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useParticipantStore } from '../store/participantStore';
import { roleManager } from '../core/roleManager';
import { getHostEvents, deleteEvent, getStoredHostName, setStoredHostName } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const location = useLocation();
  const [meetingCode, setMeetingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hostEvents, setHostEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { localParticipant, setLocalParticipant } = useParticipantStore();
  const { user, isAuthenticated, signOut } = useAuth();

  const hostName = getStoredHostName() || user?.user_metadata?.name;

  // Load host events on mount
  useEffect(() => {
    loadHostEvents();
  }, [user]); // Reload when user changes

  // Auto-create event if returning from Auth with 'create' action
  useEffect(() => {
    if (isAuthenticated && location.state?.action) {
      const action = location.state.action;
      // Clear state to prevent double trigger
      navigate(location.pathname, { replace: true, state: {} });

      if (action === 'create') {
        handleCreateEvent();
      } else if (action === 'create_link') {
        handleCreateLinkOnly();
      }
    }
  }, [isAuthenticated, location.state]);

  const loadHostEvents = async () => {
    setLoadingEvents(true);
    try {
      const events = await getHostEvents(user?.id);
      setHostEvents(events);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleCreateEvent = async () => {
    // Check if user is authenticated - redirect to auth if guest
    if (!isAuthenticated) {
      navigate('/host/auth', { state: { redirect: '/', action: 'create' } });
      return;
    }

    // Check if host has a name set
    if (!hostName) {
      // Redirect to setup page to set name
      navigate('/setup/new', { state: { isHost: true, needsName: true } });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { createEvent, updateEventHostName } = await import('../lib/database');
      roleManager.setRole('host');

      const newEvent = await createEvent({
        name: 'Instant Meeting',
        hostId: user?.id,
        maxCameras: 20,
      });

      await updateEventHostName(newEvent.id, hostName);

      navigate(`/setup/${newEvent.id}`, { state: { isHost: true } });
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLinkOnly = async () => {
    if (!isAuthenticated) {
      navigate('/host/auth', { state: { redirect: '/', action: 'create_link' } });
      return;
    }

    setLoading(true);
    try {
      const { createEvent, updateEventHostName } = await import('../lib/database');

      const newEvent = await createEvent({
        name: 'Kajian Nanti', // Or 'Upcoming Meeting'
        hostId: user?.id,
      });

      // If we have a host name, set it
      if (hostName) {
        await updateEventHostName(newEvent.id, hostName);
      }

      // Populate the input with the new ID (or full link)
      setMeetingCode(newEvent.id);
      setShowNewMeetingMenu(false);

    } catch (err) {
      console.error('Error creating link:', err);
      setError('Gagal membuat link rapat');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = (e) => {
    e.preventDefault();
    let code = meetingCode.trim();

    // If input is a URL, extract the meeting ID
    if (code.includes('http') || code.includes('localhost')) {
      try {
        // Handle URLs like http://localhost:5174/setup/abcd-1234
        // Or specific hijra meet domain
        const urlStr = code.startsWith('http') ? code : `https://${code}`;
        const url = new URL(urlStr);
        const pathParts = url.pathname.split('/').filter(p => p.length > 0);

        // Take the last part as ID if valid
        if (pathParts.length > 0) {
          code = pathParts[pathParts.length - 1];
        }
      } catch (err) {
        console.warn('Failed to parse URL, using raw code');
      }
    }

    if (code) {
      navigate(`/setup/${code}`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    setDeleting(true);
    try {
      await deleteEvent(eventId);
      setHostEvents(prev => prev.filter(e => e.id !== eventId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert(err.message || 'Gagal menghapus majelis');
    } finally {
      setDeleting(false);
    }
  };

  const handleRejoinEvent = (eventId) => {
    roleManager.setRole('host');
    navigate(`/setup/${eventId}`, { state: { isHost: true } });
  };

  const menuItems = [
    { label: 'Beranda', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Jadwal', path: '/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Rekaman', path: '/recordings', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { label: 'Pengaturan', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  const [showNewMeetingMenu, setShowNewMeetingMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNewMeetingMenu && !event.target.closest('.new-meeting-menu')) {
        setShowNewMeetingMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNewMeetingMenu]);

  return (
    <div className="min-h-screen bg-[#071a14] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#071a14]/90 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-medium tracking-tight">Hijra <span className="font-bold text-emerald-400">Meet</span></span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-lg font-medium text-gray-200">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs text-gray-400">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{hostName}</p>
                <p className="text-xs text-emerald-400">Host Account</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-lg font-bold border-2 border-[#1a3d32] cursor-pointer hover:border-emerald-500 transition-colors" onClick={signOut} title="Sign Out">
                {hostName?.charAt(0) || 'H'}
              </div>
            </div>
          ) : (
            <Link to="/host/auth" className="text-emerald-400 hover:text-emerald-300 font-medium text-sm">
              Login Host
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:px-12 gap-12 lg:gap-24 relative overflow-hidden">

        {/* Left Column (Actions) */}
        <div className="w-full lg:w-1/2 max-w-xl z-10">
          <h1 className="text-4xl lg:text-5xl font-normal leading-tight mb-6">
            Majelis Video Conference yang <span className="text-emerald-400 font-bold">Aman & Berkah.</span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed">
            Didesain untuk kemudahan dan keberkahan komunikasi. Hubungkan kajian, rapat, dan silaturahmi di satu tempat.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            {/* New Meeting Button */}
            <div className="relative new-meeting-menu">
              <button
                onClick={() => setShowNewMeetingMenu(!showNewMeetingMenu)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-emerald-900/40"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Rapat Baru
              </button>

              {showNewMeetingMenu && (
                <div className="absolute top-14 left-0 w-72 bg-[#1a3d32] border border-[#2d5c4d] rounded-lg shadow-xl py-2 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                  <button
                    onClick={handleCreateEvent}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#234d3f] text-left w-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Mulai rapat instan</span>
                  </button>
                  <button
                    onClick={handleCreateLinkOnly}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#234d3f] text-left w-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Buat rapat untuk nanti</span>
                  </button>
                </div>
              )}
            </div>

            {/* Join Code Input */}
            <form onSubmit={handleJoinEvent} className="flex gap-2 w-full sm:max-w-xs transition-all focus-within:ring-1 focus-within:ring-white rounded-lg">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  placeholder="Masukkan kode atau link"
                  className="w-full bg-transparent border border-gray-500 rounded-lg py-3.5 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              {meetingCode.trim() && (
                <button type="submit" className="text-emerald-400 hover:text-emerald-300 font-medium px-2 py-2">
                  Gabung
                </button>
              )}
            </form>
          </div>

          <div className="border-t border-gray-700/50 mt-10 pt-6">
            <Link to="/learn-more" className="text-sm text-gray-400 hover:underline">Pelajari lebih lanjut tentang Hijra Meet</Link>
          </div>
        </div>

        {/* Right Column (Visuals/Events) */}
        <div className="hidden lg:flex w-1/2 flex-col items-center justify-center relative">

          {/* Decorative Background */}
          <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

          {isAuthenticated && hostEvents.length > 0 ? (
            // Show Host Events Carousel
            <div className="w-full max-w-md bg-[#0d2920]/80 backdrop-blur-md border border-[#1a3d32] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Jadwal Majelis</h2>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Terjadwal</span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {hostEvents.slice(0, 3).map(event => (
                  <div key={event.id} className="p-4 bg-[#1a3d32]/50 hover:bg-[#1a3d32] rounded-xl cursor-pointer transition-colors border border-transparent hover:border-emerald-500/30 group" onClick={() => handleRejoinEvent(event.id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white group-hover:text-emerald-300 transition-colors">{event.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(event.created_at).toLocaleDateString('id-ID', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button className="p-2 rounded-full bg-emerald-600 text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#1a3d32] text-center">
                <Link to="/schedule" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">Lihat semua jadwal</Link>
              </div>
            </div>
          ) : (
            // Placeholder Illustration
            <div className="bg-[#0d2920]/50 p-8 rounded-full border border-[#1a3d32] w-80 h-80 flex flex-col items-center justify-center text-center backdrop-blur-sm">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Dapatkan Link</h3>
              <p className="text-sm text-gray-400">Klik <span className="text-white font-medium">Rapat Baru</span> untuk mendapatkan link yang bisa Anda bagikan.</p>
            </div>
          )}
        </div>

      </main>

      {/* Footer/Toast Placeholder */}
      <footer className="p-6 text-center text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} Hijra Meet. All rights reserved.
      </footer>
    </div>
  );
}
