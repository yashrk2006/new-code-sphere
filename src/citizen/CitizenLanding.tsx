import { Shield, Lock, Activity, Clock, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function CitizenLanding() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white text-gray-800 flex flex-col max-w-[430px] mx-auto shadow-2xl relative overflow-hidden">
            {/* Subtle top gradient band */}
            <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />

            {/* Status bar area */}
            <div className="h-12 flex items-center justify-between px-6 relative z-10">
                <span className="text-[11px] font-bold text-gray-400 tracking-wider">9:41 AM</span>
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-gray-400" />
                    <div className="w-5 h-2.5 rounded-sm border border-gray-400 relative"><div className="absolute inset-y-0.5 left-0.5 right-1 bg-gray-400 rounded-[1px]" /></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">

                {/* Logo Mark */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-200 relative">
                        <Shield className="w-12 h-12 text-white" />
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </div>
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                        CIVIC<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">SHIELD</span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium tracking-widest uppercase">
                        Report · Track · Resolve
                    </p>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full"
                >
                    <button
                        onClick={() => navigate('/citizen/login')}
                        className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-[0.98] transition-all hover:shadow-xl hover:shadow-blue-200"
                    >
                        <Lock className="w-5 h-5 text-blue-200" />
                        <span className="text-base tracking-wide">SECURE CITIZEN LOGIN</span>
                        <ArrowRight className="w-5 h-5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <p className="text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        End-to-end encrypted civic portal
                    </p>
                </motion.div>
            </div>

            {/* Stats Bottom Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="mx-4 mb-8 bg-gray-50 border border-gray-100 rounded-2xl p-5 z-10"
            >
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-lg font-black text-gray-900">4,231</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Reports</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-gray-100">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-lg font-black text-gray-900">98%</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Resolved</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                            <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-lg font-black text-gray-900">12m</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Response</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
