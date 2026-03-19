import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Phone, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CitizenLogin() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && phone) {
            localStorage.setItem('citizen_session', JSON.stringify({ name, phone }));
            navigate('/citizen/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col max-w-[430px] mx-auto relative overflow-hidden">
            {/* Top accent gradient */}
            <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-b-[48px]" />

            {/* Header */}
            <div className="relative z-10 px-6 pt-14 pb-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-5 shadow-xl"
                >
                    <Shield className="w-8 h-8 text-white" />
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl font-black text-white tracking-tight mb-1"
                >
                    Secure Access
                </motion.h2>
                <p className="text-sm text-blue-200">Enter your details to access the portal</p>
            </div>

            {/* Form Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 flex-1 bg-white rounded-t-3xl shadow-2xl px-6 pt-8 pb-8 -mt-4"
            >
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Identity Verification</h3>
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Name Field */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Rajan Sharma"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Phone Field */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 active:scale-[0.98] transition-all"
                    >
                        Access Portal
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                {/* Divider & trust note */}
                <div className="mt-8 pt-5 border-t border-gray-100 text-center">
                    <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                        <Shield className="w-3 h-3 text-blue-400" />
                        Your data is encrypted end-to-end and never shared.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
