import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
    Clock, Camera,
    CheckCircle2, AlertTriangle, Navigation, Activity, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const socket = io(API_BASE);

interface CitizenIncident {
    id: string;
    category: 'Violence' | 'Crowd' | 'Municipal';
    description: string;
    image_url: string;
    status: 'REPORTED' | 'UNDER REVIEW' | 'TEAM DISPATCHED' | 'RESOLVED';
    resolution_image_url?: string;
    timestamp: string;
    eta?: string;
}

const STATUS_STEPS = ['REPORTED', 'UNDER REVIEW', 'TEAM DISPATCHED', 'RESOLVED'];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    Violence: { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500' },
    Crowd: { bg: 'bg-orange-100', text: 'text-orange-600', dot: 'bg-orange-500' },
    Municipal: { bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-500' },
};

export default function CitizenDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
    const [incidents, setIncidents] = useState<CitizenIncident[]>([]);

    useEffect(() => {
        const session = localStorage.getItem('citizen_session');
        if (!session) { navigate('/citizen/login'); return; }
        setUser(JSON.parse(session));

        const fetchIncidents = async () => {
            const { data } = await axios.get(`${API_BASE}/api/citizen/incidents`);
            setIncidents(data.slice(0, 5));
        };
        fetchIncidents();

        socket.on('citizen_incident_updated', (updated: CitizenIncident) => {
            setIncidents(prev => prev.map(inc => inc.id === updated.id ? updated : inc));
        });
        socket.on('citizen_incident_new', (newInc: CitizenIncident) => {
            setIncidents(prev => [newInc, ...prev].slice(0, 5));
        });

        return () => {
            socket.off('citizen_incident_updated');
            socket.off('citizen_incident_new');
        };
    }, [navigate]);

    if (!user) return null;

    const active = incidents.filter(i => i.status !== 'RESOLVED').length;
    const resolved = incidents.filter(i => i.status === 'RESOLVED').length;

    return (
        <div className="min-h-full bg-[#F5F7FA] pb-6">
            {/* Greeting Banner */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-5 pb-10 rounded-b-[36px] relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute right-10 top-10 w-20 h-20 rounded-full bg-white/5" />
                <div className="relative z-10">
                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Welcome back</p>
                    <h1 className="text-white text-2xl font-black mb-1">{user.name}</h1>
                    <p className="text-blue-200 text-sm">{user.phone}</p>
                </div>
            </div>

            <div className="px-4 -mt-6 space-y-5">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active</span>
                        </div>
                        <p className="text-4xl font-black text-gray-900">{active.toString().padStart(2, '0')}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolved</span>
                        </div>
                        <p className="text-4xl font-black text-gray-900">{resolved.toString().padStart(2, '0')}</p>
                    </div>
                </div>

                {/* Reports list */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-black text-gray-900">My Reports</h2>
                        <span className="text-xs text-gray-400 font-medium">Live updates</span>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence>
                            {incidents.length === 0 ? (
                                <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center">
                                    <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">No active reports filed.</p>
                                    <button
                                        onClick={() => navigate('/citizen/report')}
                                        className="mt-3 text-xs font-bold text-blue-600"
                                    >
                                        File your first report →
                                    </button>
                                </div>
                            ) : (
                                incidents.map(issue => {
                                    const cat = CATEGORY_COLORS[issue.category] || CATEGORY_COLORS.Municipal;
                                    return (
                                        <motion.div
                                            key={issue.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {issue.image_url ? (
                                                        <img src={issue.image_url} alt="Incident" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <AlertTriangle className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.bg} ${cat.text}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                                                            {issue.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-1 truncate">{issue.id}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(issue.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Progress */}
                                            <div className="px-4 pt-4 pb-5">
                                                {issue.status === 'TEAM DISPATCHED' && (
                                                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                                            <Navigation className="w-4 h-4 text-orange-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-orange-600">Unit En Route · ETA {issue.eta || '8 min'}</p>
                                                            <p className="text-[10px] text-orange-500">Team navigating to your location</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Step track */}
                                                <div className="relative">
                                                    {/* track */}
                                                    <div className="absolute top-2.5 left-2.5 right-2.5 h-0.5 bg-gray-100 rounded-full" />
                                                    <div
                                                        className="absolute top-2.5 left-2.5 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${(STATUS_STEPS.indexOf(issue.status) / (STATUS_STEPS.length - 1)) * (100 - 5)}%` }}
                                                    />
                                                    <div className="flex justify-between relative z-10">
                                                        {STATUS_STEPS.map((step, idx) => {
                                                            const isCompleted = STATUS_STEPS.indexOf(issue.status) > idx;
                                                            const isCurrent = issue.status === step;
                                                            let dotClass = 'bg-gray-100 border-gray-200 text-gray-300';
                                                            if (isCompleted) dotClass = 'bg-blue-500 border-blue-400 text-white';
                                                            if (isCurrent) dotClass = step === 'TEAM DISPATCHED'
                                                                ? 'bg-orange-500 border-orange-300 text-white shadow-md shadow-orange-200 animate-pulse'
                                                                : 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-200';
                                                            return (
                                                                <div key={step} className="flex flex-col items-center gap-2">
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${dotClass}`}>
                                                                        {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                                                                    </div>
                                                                    <span className={`text-[8px] font-bold text-center max-w-[48px] leading-tight ${isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>
                                                                        {step}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Resolution proof */}
                                            {issue.status === 'RESOLVED' && issue.resolution_image_url && (
                                                <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Proof of Resolution
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="relative rounded-xl overflow-hidden">
                                                            <img src={issue.image_url} alt="Before" className="w-full h-20 object-cover" />
                                                            <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm py-1 text-[9px] text-center font-bold text-white">BEFORE</div>
                                                        </div>
                                                        <div className="relative rounded-xl overflow-hidden ring-2 ring-emerald-400">
                                                            <img src={issue.resolution_image_url} alt="After" className="w-full h-20 object-cover" />
                                                            <div className="absolute bottom-0 inset-x-0 bg-emerald-600/80 backdrop-blur-sm py-1 text-[9px] text-center font-bold text-white">FIXED ✓</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* FAB - Report */}
            <button
                onClick={() => navigate('/citizen/report')}
                className="fixed bottom-[84px] right-5 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-xl shadow-blue-200 flex items-center justify-center border-4 border-[#F5F7FA] hover:shadow-2xl active:scale-95 transition-all z-40"
            >
                <Camera size={22} color="white" />
            </button>
        </div>
    );
}
