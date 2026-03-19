import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { 
    Shield, Users, Trash2, CheckCircle2, 
    AlertTriangle, MapPin, Navigation, Brain, 
    Star, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_BASE = rawApiUrl.replace(/\/+$/, '');

interface CitizenIncident {
    id: string;
    citizen_name: string;
    citizen_phone: string;
    category: 'Violence' | 'Crowd' | 'Municipal';
    description: string;
    location: { lat: number; lng: number };
    image_url: string;
    status: 'REPORTED' | 'UNDER REVIEW' | 'TEAM DISPATCHED' | 'RESOLVED';
    resolution_image_url?: string;
    timestamp: string;
    ai_priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
    is_verified_red_flag: boolean;
    eta?: string;
    // AI analysis fields
    ai_credibility_score?: number;
    ai_summary?: string;
    ai_recommended_action?: string;
    ai_image_verdict?: string;
    ai_location_context?: string;
    ai_analysis_status?: 'PENDING' | 'PROCESSING' | 'DONE' | 'SKIPPED' | 'FAILED';
}

const createIcon = (color: string) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const icons = {
    REPORTED: createIcon('red'),
    'UNDER REVIEW': createIcon('orange'),
    'TEAM DISPATCHED': createIcon('blue'),
    RESOLVED: createIcon('grey')
};

const catIcons = { Violence: Shield, Crowd: Users, Municipal: Trash2 };

// ─── AI Score Badge ──────────────────────────────────────────────────────────
function AiScoreBadge({ score, status }: { score?: number; status?: string }) {
    if (status === 'PENDING' || status === 'PROCESSING') {
        return (
            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 bg-slate-700/60 text-slate-300 rounded-full border border-slate-600/50">
                <Brain className="w-2.5 h-2.5 animate-pulse text-blue-400" />
                AI Analyzing...
            </span>
        );
    }
    if (status === 'SKIPPED' || status === 'FAILED' || score === undefined) {
        return (
            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 bg-slate-700/60 text-slate-400 rounded-full border border-slate-600/50">
                <Brain className="w-2.5 h-2.5" /> No AI
            </span>
        );
    }
    const color = score >= 75 ? 'text-red-400 bg-red-500/10 border-red-500/30'
        : score >= 50 ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    return (
        <span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border ${color}`}>
            <Star className="w-2.5 h-2.5" />
            AI Score: {score}%
        </span>
    );
}

// ─── AI Panel (expandable) ───────────────────────────────────────────────────
function AiPanel({ inc }: { inc: CitizenIncident }) {
    const [open, setOpen] = useState(false);

    if (!inc.ai_summary || inc.ai_analysis_status === 'PENDING') return null;

    const actionColor = inc.ai_credibility_score && inc.ai_credibility_score >= 75
        ? 'border-red-500/40 bg-red-500/5'
        : inc.ai_credibility_score && inc.ai_credibility_score >= 50
        ? 'border-orange-500/40 bg-orange-500/5'
        : 'border-emerald-500/40 bg-emerald-500/5';

    return (
        <div className="mt-3 border border-blue-500/20 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/80 text-left"
            >
                <span className="flex items-center gap-2 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                    <Brain className="w-3 h-3" /> Gemini AI Analysis
                </span>
                {open ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 py-3 space-y-3 bg-slate-950/60"
                    >
                        {/* Summary */}
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Analysis</p>
                            <p className="text-xs text-slate-300 leading-relaxed">{inc.ai_summary}</p>
                        </div>

                        {/* Image verdict */}
                        {inc.ai_image_verdict && inc.ai_image_verdict !== 'No image provided' && (
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Image Check</p>
                                <p className="text-xs text-slate-400 italic">{inc.ai_image_verdict}</p>
                            </div>
                        )}

                        {/* Location context */}
                        {inc.ai_location_context && (
                            <div className="flex items-start gap-2">
                                <MapPin className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-slate-400">{inc.ai_location_context}</p>
                            </div>
                        )}

                        {/* Recommended action */}
                        {inc.ai_recommended_action && (
                            <div className={`border rounded-lg p-2.5 ${actionColor}`}>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">⚡ Recommended Action</p>
                                <p className="text-xs font-bold text-white">{inc.ai_recommended_action}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CitizenIncidentHub() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState<CitizenIncident[]>([]);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'REPORTED' | 'TEAM DISPATCHED' | 'RESOLVED'>('ALL');

    useEffect(() => {
        const socket = io(API_BASE);

        const fetchIncidents = async () => {
            const { data } = await axios.get(`${API_BASE}/api/citizen/incidents`);
            setIncidents(data);
        };
        fetchIncidents();

        socket.on('citizen_incident_new', (inc: CitizenIncident) =>
            setIncidents(prev => [inc, ...prev])
        );
        socket.on('citizen_incident_updated', (inc: CitizenIncident) =>
            setIncidents(prev => prev.map(p => p.id === inc.id ? inc : p))
        );

        return () => {
            socket.off('citizen_incident_new');
            socket.off('citizen_incident_updated');
            socket.disconnect();
        };
    }, []);

    const handleAction = async (id: string, action: 'dispatch' | 'resolve') => {
        setLoadingId(id);
        const payload = action === 'resolve'
            ? { image_url: 'https://images.unsplash.com/photo-1584483783936-cecb8da1c22e?w=800' }
            : {};
        await axios.post(`${API_BASE}/api/citizen/incidents/${id}/${action}`, payload);

        if (action === 'dispatch') {
            const inc = incidents.find(i => i.id === id);
            if (inc?.location) navigate(`/dashboard/map?lat=${inc.location.lat}&lng=${inc.location.lng}`);
        }
        setLoadingId(null);
    };

    const filtered = filter === 'ALL'
        ? incidents
        : incidents.filter(i => i.status === filter);

    const sorted = filtered.slice().sort((a, b) =>
        (a.is_verified_red_flag ? -1 : b.is_verified_red_flag ? 1 : 0)
    );

    const stats = {
        total: incidents.length,
        critical: incidents.filter(i => i.ai_priority === 'CRITICAL').length,
        pending: incidents.filter(i => i.ai_analysis_status === 'PENDING' || i.ai_analysis_status === 'PROCESSING').length,
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400 tracking-wider uppercase">Public Intake</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Citizen Incident Hub</h1>
                <p className="text-slate-400 text-sm mt-1">AI-verified triage and dispatch for citizen-reported civic issues.</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Reports', value: stats.total, color: 'text-white' },
                    { label: 'Critical', value: stats.critical, color: 'text-red-400' },
                    { label: 'AI Analyzing', value: stats.pending, color: 'text-blue-400' },
                ].map(s => (
                    <div key={s.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Live Map Panel */}
                <div className="bg-[#040D21] border border-slate-800 rounded-2xl overflow-hidden h-[480px] flex flex-col relative z-0">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-400" /> Live Geotags
                        </h2>
                        <span className="text-[9px] text-slate-500 font-mono">{incidents.length} pins</span>
                    </div>
                    <div className="flex-1 relative">
                        <MapContainer center={[28.6139, 77.2090]} zoom={13} className="w-full h-full z-0">
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                            />
                            {incidents.map(inc => (
                                <Marker key={inc.id} position={[inc.location.lat, inc.location.lng]} icon={icons[inc.status]}>
                                    <Popup>
                                        <div className="p-1 min-w-[180px]">
                                            <p className="font-bold text-sm mb-0.5">{inc.category}</p>
                                            <p className="text-xs text-slate-500 mb-1">{inc.status}</p>
                                            {inc.ai_credibility_score !== undefined && (
                                                <p className="text-xs font-bold text-orange-500 mb-1">AI Score: {inc.ai_credibility_score}%</p>
                                            )}
                                            {inc.ai_recommended_action && (
                                                <p className="text-[10px] text-slate-600">{inc.ai_recommended_action}</p>
                                            )}
                                            {inc.image_url && <img src={inc.image_url} className="w-full h-20 object-cover rounded-md mt-1" alt="Incident" />}
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>

                {/* Queue Panel */}
                <div className="bg-[#040D21] border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[480px]">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-400" /> Incident Queue
                        </h2>
                        {/* Filter tabs */}
                        <div className="flex gap-1">
                            {(['ALL', 'REPORTED', 'TEAM DISPATCHED', 'RESOLVED'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`text-[8px] font-bold px-2 py-1 rounded-md transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {f === 'ALL' ? 'All' : f === 'REPORTED' ? 'New' : f === 'TEAM DISPATCHED' ? 'Active' : 'Done'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <AnimatePresence>
                            {sorted.map(inc => {
                                const Icon = catIcons[inc.category] || Shield;
                                return (
                                    <motion.div
                                        key={inc.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`bg-slate-900/50 border rounded-xl p-4 transition-colors ${
                                            inc.is_verified_red_flag && inc.status === 'REPORTED'
                                                ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                                : 'border-slate-800 hover:border-slate-600'
                                        }`}
                                    >
                                        {/* Top row */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-3">
                                                <div className="w-14 h-14 rounded-lg bg-slate-950 overflow-hidden shrink-0 relative">
                                                    {inc.image_url && <img src={inc.image_url} alt="Incident" className="w-full h-full object-cover" />}
                                                    {inc.is_verified_red_flag && (
                                                        <span className="absolute top-0 left-0 bg-red-600 text-[7px] font-black px-1 py-0.5 rounded-br-md text-white">RED FLAG</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                        <Icon className={`w-3.5 h-3.5 shrink-0 ${inc.is_verified_red_flag ? 'text-red-400' : 'text-blue-400'}`} />
                                                        <span className="text-xs font-bold text-white uppercase">{inc.category}</span>
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                                            inc.status === 'REPORTED' ? 'bg-red-500/20 text-red-400'
                                                            : inc.status === 'TEAM DISPATCHED' ? 'bg-orange-500/20 text-orange-400'
                                                            : 'bg-emerald-500/20 text-emerald-400'
                                                        }`}>{inc.status}</span>
                                                    </div>
                                                    <AiScoreBadge score={inc.ai_credibility_score} status={inc.ai_analysis_status} />
                                                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{inc.description || '—'}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 font-mono">
                                                        <span>{inc.citizen_name}</span>
                                                        <span>•</span>
                                                        <Clock className="w-2.5 h-2.5" />
                                                        <span>{new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {inc.eta && <span className="text-blue-400">• ETA: {inc.eta}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Panel */}
                                        <AiPanel inc={inc} />

                                        {/* Action buttons */}
                                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/50 mt-3">
                                            {inc.status === 'REPORTED' || inc.status === 'UNDER REVIEW' ? (
                                                <button
                                                    onClick={() => handleAction(inc.id, 'dispatch')}
                                                    disabled={loadingId === inc.id}
                                                    className="w-full sm:w-auto px-4 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold py-2 rounded flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(22,163,74,0.3)]"
                                                >
                                                    <Navigation size={13} /> NAVIGATE TO INCIDENT
                                                </button>
                                            ) : inc.status === 'TEAM DISPATCHED' ? (
                                                <button
                                                    onClick={() => handleAction(inc.id, 'resolve')}
                                                    disabled={loadingId === inc.id}
                                                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> MARK RESOLVED
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Case Closed
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {sorted.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-40 py-12">
                                <Shield className="w-10 h-10 mb-3" />
                                <p className="text-sm">No incidents in this queue.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
