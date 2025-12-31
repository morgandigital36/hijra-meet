import { useState, useEffect } from 'react';

export default function PrayerTimesWidget() {
    const prayers = [
        { name: 'Subuh', time: '04:35', active: false },
        { name: 'Dzuhur', time: '11:55', active: false },
        { name: 'Ashar', time: '15:15', active: true },
        { name: 'Maghrib', time: '18:05', active: false },
        { name: 'Isya', time: '19:15', active: false },
    ];

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-white font-medium">
                    <svg className="w-5 h-5 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Waktu Sholat
                </h3>
                <span className="text-sm text-emerald cursor-pointer hover:underline">Menuju Ashar - 45 Menit Lagi</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {prayers.map((p) => (
                    <div
                        key={p.name}
                        className={`p-4 rounded-2xl border transition-all duration-200 ${p.active
                                ? 'bg-hijra-dark border-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden'
                                : 'bg-hijra-black border-hijra-dark hover:border-gray-700'
                            }`}
                    >
                        {p.active && (
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald/10 rounded-full blur-xl"></div>
                        )}
                        <div className={`flex justify-between items-start mb-2 ${p.active ? 'text-emerald' : 'text-gray-400'}`}>
                            <span className="text-sm font-medium">{p.name}</span>
                            {p.active && <div className="w-2 h-2 rounded-full bg-emerald animate-pulse"></div>}
                        </div>
                        <p className={`text-2xl font-bold tracking-tight ${p.active ? 'text-white' : 'text-gray-300'}`}>
                            {p.time}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
