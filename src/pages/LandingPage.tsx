import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Activity, Map, Cpu, ArrowRight, Video, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
    const features = [
        { icon: Activity, title: 'Urban Pulse Analytics', desc: 'Predictive anomaly detection for smart city infrastructure with sub-500ms latency.' },
        { icon: Map, title: 'Live Geospatial Mapping', desc: 'Real-time zone mapping and dispatch routing powered by Google Maps integration.' },
        { icon: Cpu, title: 'Edge Node Telemetry', desc: 'Remote hardware monitoring, thermal tracking, and OTA AI model deployments.' },
        { icon: Shield, title: 'Governance & Security', desc: 'Strict Role-Based Access Control (RBAC) and immutable system audit logs.' },
    ];

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden relative">
            {/* Ambient Background */}
            <div className="fixed inset-0 bg-mesh opacity-50 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
            
            {/* Animated Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />

            {/* Navigation Bar */}
            <nav className="fixed w-full z-50 bg-[#0B0F19]/40 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            <Video size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">VisionAIoT</span>
                    </div>
                    <Link
                        to="/login"
                        className="px-6 py-2.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/30 rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-600/20"
                    >
                        Access System
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm font-medium mb-12 backdrop-blur-md"
                >
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="tracking-wide">System v2.0 AI Core Operational</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1] max-w-5xl">
                        Universal <span className="text-glow text-blue-400">Intelligence</span> <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500">
                            At The Edge.
                        </span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl md:text-2xl text-white/50 max-w-3xl mb-14 leading-relaxed font-light"
                >
                    Deploy production-ready AIoT anomaly detection. From municipal scale vision tracking to real-time industrial safety, manage your edge nodes with precision.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 items-center"
                >
                    <Link
                        to="/login"
                        className="group flex items-center gap-4 px-10 py-5 bg-white text-black text-xl font-bold rounded-2xl hover:bg-white/90 transition-all shadow-2xl shadow-white/10"
                    >
                        Launch Command Center
                        <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                    <button className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xl font-semibold rounded-2xl transition-all backdrop-blur-md">
                        View Documentation
                    </button>
                </motion.div>

                {/* Dashboard Mockup Element */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                    className="mt-24 w-full max-w-6xl aspect-[16/9] glass-card overflow-hidden neon-border p-1 animate-float"
                >
                    <div className="w-full h-full bg-[#0B0F19]/80 rounded-xl relative">
                        {/* Mock UI Elements */}
                        <div className="absolute inset-0 bg-grid opacity-20" />
                        <div className="absolute top-6 left-6 flex gap-4">
                            <div className="w-24 h-3 bg-white/10 rounded-full" />
                            <div className="w-16 h-3 bg-white/10 rounded-full" />
                        </div>
                        <div className="absolute top-6 right-6 flex gap-3">
                            <div className="w-4 h-4 rounded-full bg-red-500/50" />
                            <div className="w-4 h-4 rounded-full bg-yellow-500/50" />
                            <div className="w-4 h-4 rounded-full bg-green-500/50" />
                        </div>
                        <div className="flex items-center justify-center h-full">
                            <Sparkles size={100} className="text-blue-500/10" />
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Features Grid */}
            <section className="relative py-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-24">
                        <motion.h2 
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-black mb-6"
                        >
                            Engineered for <span className="text-blue-400">Extreme Scale</span>
                        </motion.h2>
                        <p className="text-xl text-white/40 max-w-2xl mx-auto">Seamless integration of real-time vision processing, edge telemetry, and governance.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                className="glass-card p-8 group cursor-pointer"
                            >
                                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <feat.icon size={28} className="text-blue-400 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{feat.title}</h3>
                                <p className="text-white/40 leading-relaxed">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTO Section */}
            <section className="py-24 px-6 relative">
                <div className="max-w-5xl mx-auto glass-card p-12 md:p-20 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none" />
                    <Zap size={80} className="text-blue-500/5 absolute -top-10 -left-10" />
                    <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10">Ready to secure your matrix?</h2>
                    <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto">Join the next generation of smart infrastructure operators today.</p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-4 px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white text-xl font-black rounded-2xl transition-all shadow-2xl shadow-blue-600/30"
                    >
                        Initialize Command Access
                        <ShieldCheck size={24} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl relative z-10 text-center">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <Video size={20} className="text-blue-500" />
                        <span className="text-xl font-bold text-white/80 tracking-tight">VisionAIoT</span>
                    </div>
                    <p className="text-white/20 text-sm">
                        © 2026 Engineered with precision by <span className="text-white/60 font-semibold tracking-wide">HACKOPS CREW</span>. ALL RIGHTS RESERVED.
                    </p>
                    <div className="flex gap-8 text-sm text-white/40 font-medium">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Status</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
