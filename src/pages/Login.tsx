import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

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

        setTimeout(() => {
            const mockUser = { id: 'usr_1', email: 'admin@visionaiot.com', role: 'Admin' as const };
            const mockToken = 'mock_jwt_token_for_demo';
            setAuth(mockUser, mockToken);
            navigate('/dashboard');
        }, 300);
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col md:flex-row font-sans selection:bg-blue-500/30 overflow-hidden relative">
            {/* Background Decorative Elems */}
            <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-10 pointer-events-none" />

            {/* Left Column - Branding */}
            <div className="hidden md:flex flex-col justify-between w-1/2 bg-[#060A12]/40 backdrop-blur-3xl border-r border-white/5 p-16 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
                
                <div className="relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 mb-20"
                    >
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl shadow-xl shadow-blue-500/20">
                            <Video size={28} className="text-white" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter">VisionAIoT</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-tight mb-8">
                            Command <span className="text-glow text-blue-400">Core</span> <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                Access Gateway
                            </span>
                        </h1>
                        <p className="text-white/40 text-xl max-w-md font-light leading-relaxed">
                            Secure authentication portal for city-scale intelligence and high-velocity anomaly detection infrastructure.
                        </p>
                    </motion.div>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="relative z-10 flex items-center gap-4 text-sm text-white/30 font-medium tracking-widest uppercase"
                >
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0B0F19] bg-white/10 backdrop-blur-md flex items-center justify-center">
                                <Sparkles size={12} className="text-blue-400" />
                            </div>
                        ))}
                    </div>
                    <span>System Encrypted & Verified</span>
                </motion.div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="glass-card p-10 neon-border relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                        
                        <div className="mb-10 text-center md:text-left">
                            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Operator Login</h2>
                            <p className="text-white/40 font-medium">Enter your credentials to initialize session.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3"
                                >
                                    <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400 font-semibold leading-tight">{error}</p>
                                </motion.div>
                            )}

                            <div className="space-y-3">
                                <label className="text-xs font-black text-white/30 uppercase tracking-[0.2em] block ml-1">
                                    Email Identity
                                </label>
                                <div className="relative group">
                                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@visionaiot.com"
                                        className="w-full bg-white/5 text-white text-base border border-white/5 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-black text-white/30 uppercase tracking-[0.2em] block">
                                        Security Phrase
                                    </label>
                                    <a href="#" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Recover?</a>
                                </div>
                                <div className="relative group">
                                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 text-white text-base border border-white/5 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/10"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                {isLoading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Authorize & Launch
                                        <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-10 pt-8 border-t border-white/5 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-[10px] font-black uppercase tracking-[0.1em] text-blue-400/60 mb-3">
                                <ShieldCheck size={12} />
                                Demo Environment
                            </div>
                            <p className="text-xs text-white/20 font-mono tracking-wider italic">admin@visionaiot.com / admin</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
