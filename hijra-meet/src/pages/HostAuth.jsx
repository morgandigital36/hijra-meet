import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { setStoredHostName } from '../lib/database';
import { roleManager } from '../core/roleManager';

export default function HostAuth() {
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.redirect || '/';
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (isLogin) {
                // Login
                const { data, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authError) throw authError;

                // Set role as host
                roleManager.setRole('host');

                // Get user metadata for name
                if (data.user?.user_metadata?.name) {
                    setStoredHostName(data.user.user_metadata.name);
                }

                setMessage('Login berhasil! Mengalihkan...');
                setTimeout(() => navigate(redirectTo), 1000);
            } else {
                // Sign Up
                if (!name.trim()) {
                    setError('Nama wajib diisi');
                    setLoading(false);
                    return;
                }

                const { data, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: name.trim(),
                        },
                        emailRedirectTo: undefined, // Disable email redirect
                    },
                });

                if (authError) throw authError;

                // Save name to localStorage
                setStoredHostName(name.trim());
                roleManager.setRole('host');

                // Check if user is confirmed (no email verification required)
                if (data.session) {
                    setMessage('Pendaftaran berhasil! Mengalihkan...');
                    setTimeout(() => navigate('/'), 1000);
                } else {
                    // Email confirmation required by Supabase settings
                    setMessage('Akun berhasil dibuat! Anda bisa langsung login.');
                    setIsLogin(true);
                }
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'Terjadi kesalahan saat autentikasi');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError('');

        try {
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                },
            });

            if (authError) throw authError;
        } catch (err) {
            console.error('Google auth error:', err);
            setError(err.message || 'Gagal login dengan Google');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#071a14] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {isLogin ? 'Login Host' : 'Daftar Sebagai Host'}
                    </h1>
                    <p className="text-gray-400">
                        {isLogin
                            ? 'Masuk untuk mengelola majelis Anda'
                            : 'Buat akun untuk menjadi host majelis'}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-[#0d2920] border border-[#1a3d32] rounded-2xl p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nama Lengkap <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ahmad Yusuf"
                                    className="w-full bg-[#071a14] border border-[#1a3d32] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="host@example.com"
                                className="w-full bg-[#071a14] border border-[#1a3d32] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#071a14] border border-[#1a3d32] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                required
                                minLength={6}
                            />
                            {!isLogin && (
                                <p className="text-xs text-gray-500 mt-2">Minimal 6 karakter</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                            ) : (
                                <>
                                    {isLogin ? 'Masuk' : 'Daftar'}
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-[#1a3d32]"></div>
                        <span className="text-gray-500 text-sm">atau</span>
                        <div className="flex-1 h-px bg-[#1a3d32]"></div>
                    </div>

                    {/* Google Auth */}
                    <button
                        onClick={handleGoogleAuth}
                        disabled={loading}
                        className="w-full border border-[#1a3d32] hover:border-emerald-500/50 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Lanjutkan dengan Google
                    </button>

                    {/* Toggle Login/Register */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setMessage('');
                            }}
                            className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                        >
                            {isLogin ? (
                                <>
                                    Belum punya akun? <span className="text-emerald-400 font-medium">Daftar di sini</span>
                                </>
                            ) : (
                                <>
                                    Sudah punya akun? <span className="text-emerald-400 font-medium">Login di sini</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Back to Home */}
                    <div className="mt-4 text-center">
                        <Link
                            to="/"
                            className="text-sm text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>

                {/* Anonymous Mode Note */}
                <div className="mt-6 p-4 bg-[#0d2920]/50 border border-[#1a3d32] rounded-xl text-center">
                    <p className="text-sm text-gray-400">
                        💡 <span className="font-medium text-gray-300">Pro tip:</span> Buat akun untuk menyimpan dan mengelola majelis Anda secara permanen.
                    </p>
                </div>
            </div>
        </div>
    );
}
