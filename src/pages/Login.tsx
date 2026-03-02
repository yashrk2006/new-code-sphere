import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// Simple mock login for the demo
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate network delay
        setTimeout(() => {
            // Very basic validation for the demo
            if (email === 'admin@visionaiot.com' && password === 'admin') {
                const mockUser = { id: 'usr_1', email: 'admin@visionaiot.com', role: 'Admin' as const };
                // In a real app, this token would come from your backend
                const mockToken = 'mock_jwt_token_for_demo';

                setAuth(mockUser, mockToken);
                navigate('/dashboard');
            } else {
                setError('Invalid credentials. Use admin@visionaiot.com / admin');
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col md:flex-row font-sans selection:bg-blue-500/30 selection:text-white">

            {/* Left Column - Branding (Hidden on small screens) */}
            <div className="hidden md:flex flex-col justify-between w-1/2 bg-[#060A12] border-r border-slate-800 p-12 relative overflow-hidden">
                {/* Background Decorative Elems */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Video size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">VisionAIoT</span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                            Command Core <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                Access Gateway
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-md">
                            Secure authentication portal for the city-scale intelligence and anomaly detection infrastructure.
                        </p>
                    </motion.div>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-sm text-slate-500">
                    <ShieldCheck size={20} className="text-emerald-500" />
                    <span>AES-256 Encrypted Connection</span>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
                <div className="w-full max-w-md">
                    {/* Mobile Logo (visible only on small screens) */}
                    <div className="flex md:hidden items-center gap-3 mb-10 justify-center">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Video size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">VisionAIoT</span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-[#111623] border border-slate-800 rounded-2xl p-8 shadow-2xl"
                    >
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Operator Login</h2>
                            <p className="text-sm text-slate-400">Enter your credentials to access the command center.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3">
                                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400 font-medium leading-tight">{error}</p>
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@visionaiot.com"
                                        className="w-full bg-[#0B0F19] text-white text-sm border border-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block flex justify-between">
                                    <span>Password</span>
                                    <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Forgot?</a>
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-[#0B0F19] text-white text-sm border border-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Initialize Session
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Demo Notice */}
                        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                            <p className="text-xs text-slate-500 font-medium">Demo Access</p>
                            <p className="text-xs text-slate-600 mt-1 font-mono">admin@visionaiot.com / admin</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
