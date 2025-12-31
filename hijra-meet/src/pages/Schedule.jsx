import { Link, useLocation } from 'react-router-dom';
import { useParticipantStore } from '../store/participantStore';

export default function Schedule() {
    const location = useLocation();
    const { localParticipant } = useParticipantStore();

    const schedules = [
        { id: 1, title: 'Kajian Rutin Ba\'da Ashar', date: '31', month: 'Dec', time: '15:45 - 16:30', participants: 24 },
        { id: 2, title: 'Evaluasi Tim Mingguan', date: '31', month: 'Dec', time: '20:00 - 21:00', participants: 8 },
        { id: 3, title: 'Diskusi Project Ramadhan', date: '02', month: 'Jan', time: '10:00 - 11:00', participants: 12 },
    ];

    const menuItems = [
        { label: 'Beranda', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { label: 'Jadwal', path: '/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { label: 'Rekaman', path: '/recordings', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
        { label: 'Pengaturan', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ];

    return (
        <div className="min-h-screen bg-[#071a14] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#071a14] border-r border-[#1a3d32] flex flex-col h-screen fixed left-0 top-0">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="font-bold text-xl text-white">Hijra Meet</span>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path
                                    ? 'bg-emerald-500 text-white font-medium'
                                    : 'text-gray-400 hover:bg-[#0d2920] hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 m-4 bg-[#0d2920] rounded-xl flex items-center gap-3 border border-[#1a3d32]">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                        {localParticipant?.name?.charAt(0) || 'G'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{localParticipant?.name || 'Guest User'}</p>
                        <p className="text-xs text-emerald-400 truncate">Online</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Jadwal Rapat</h1>
                            <p className="text-gray-400">Kelola jadwal rapat dan kajian Anda</p>
                        </div>
                        <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Buat Jadwal
                        </button>
                    </div>

                    <div className="bg-[#0d2920] border border-[#1a3d32] rounded-2xl overflow-hidden divide-y divide-[#1a3d32]">
                        {schedules.map((schedule) => (
                            <div key={schedule.id} className="p-5 flex items-center gap-6 hover:bg-[#0a1f18] transition-colors group">
                                <div className="flex flex-col items-center justify-center w-16 h-16 bg-[#071a14] rounded-xl border border-[#1a3d32]">
                                    <span className="text-xs text-gray-400 font-medium uppercase">{schedule.month}</span>
                                    <span className="text-2xl font-bold text-white">{schedule.date}</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white mb-1">{schedule.title}</h4>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            {schedule.time}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            {schedule.participants} Peserta
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium hover:bg-emerald-500 hover:text-white transition-all">
                                        Edit
                                    </button>
                                    <button className="px-4 py-2 rounded-lg border border-[#1a3d32] text-gray-300 font-medium hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all">
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
