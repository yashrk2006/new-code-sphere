import React from 'react';
import {
    Camera, AlertTriangle, Activity, Shield, Database, Brain,
    LayoutDashboard, Video, Bell, Settings, Search, Menu, X,
    MapPin, Radio
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useMockRealtimeData } from '../hooks/useMockRealtimeData';
import { useNavigate } from 'react-router-dom';

const MOCK_CAMERAS = [
    { id: 'CAM-01', location: 'Main Entrance', status: 'active', fps: 30, resolution: '4K', latency: '12ms', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800' },
    { id: 'CAM-02', location: 'Manufacturing Line A', status: 'active', fps: 60, resolution: '1080p', latency: '8ms', image: 'https://images.unsplash.com/photo-1565106430482-8f6e1f182b83?auto=format&fit=crop&q=80&w=800' },
    { id: 'CAM-03', location: 'Server Room Alpha', status: 'warning', fps: 24, resolution: '1080p', latency: '45ms', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800' },
    { id: 'CAM-04', location: 'Perimeter Fence South', status: 'offline', fps: 0, resolution: '1080p', latency: '--', image: 'https://images.unsplash.com/photo-1510065094200-e2b583f6fbf0?auto=format&fit=crop&q=80&w=800' },
];

export default function Dashboard() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const data = useMockRealtimeData();
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-[#020617] text-slate-50 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Sidebar Navigation */}
            <aside className={`fixed md:relative z-40 w-64 h-full bg-[#040D21] border-r border-slate-800 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Vision<span className="text-blue-500">AIoT</span></span>
                    </div>
                    <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Main Menu</p>
                    <SidebarItem icon={<LayoutDashboard />} label="Overview" active />
                    <SidebarItem icon={<Video />} label="Live Cameras" badge="4" />
                    <SidebarItem icon={<AlertTriangle />} label="Anomaly Alerts" badge="12" badgeColor="bg-red-500" />
                    <SidebarItem icon={<Activity />} label="Analytics" />
                    <SidebarItem icon={<MapPin />} label="Zone Map" />

                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4">System</p>
                    <SidebarItem icon={<ServerIcon />} label="Edge Nodes" badge="3 Active" badgeColor="bg-emerald-500" />
                    <SidebarItem icon={<Shield />} label="Security" />
                    <SidebarItem icon={<Database />} label="Storage" />
                    <SidebarItem icon={<Settings />} label="Settings" />
                </div>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                            <X className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-medium">Exit Dashboard</p>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#020617] overflow-y-auto">
                {/* Top Header */}
                <header className="h-16 border-b border-slate-800 bg-[#040D21]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                            <Search className="w-4 h-4 text-slate-400 mr-2" />
                            <input type="text" placeholder="Search cameras, zones, alerts..." className="bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 w-64" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full box-content border-2 border-[#040D21]"></span>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs font-medium text-emerald-500 tracking-wider uppercase">Live System Status</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Command Center</h1>
                            <p className="text-slate-400 text-sm mt-1">Real-time edge inference and anomaly detection overview.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700">
                                Generate Report
                            </button>
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                                Add Camera Node
                            </button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard title="Active Edge Nodes" value="24/25" subtext="96% Operational" icon={<ServerIcon />} trend="up" />
                        <KPICard title="Total Anomalies (24h)" value={data.anomalies.toLocaleString()} subtext="Requires Attention: 12" icon={<AlertTriangle />} trend="down" />
                        <KPICard title="Avg Inference Time" value={`${data.inferenceMs}ms`} subtext="Using TensorRT ONNX" icon={<Brain />} trend="stable" />
                        <KPICard title="Total Processed" value="14.2M" subtext="Frames today" icon={<Activity />} trend="up" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Live Feed Spotlight */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Video className="w-5 h-5 text-blue-400" />
                                    Live Feed Spotlight <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">REC</span>
                                </h2>
                                <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">View All Cameras &rarr;</button>
                            </div>

                            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group aspect-video">
                                <img
                                    src={MOCK_CAMERAS[0].image}
                                    alt="Live Feed"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />

                                {/* AI Overlays (Simulated) */}
                                {data.detections.map(det => (
                                    <div
                                        key={det.id}
                                        className={`absolute border-2 transition-all duration-300 ease-linear ${det.color}`}
                                        style={{ top: `${det.y}%`, left: `${det.x}%`, width: `${det.width}%`, height: `${det.height}%` }}
                                    >
                                        <div className={`absolute -top-6 left-0 px-2 py-1 bg-[#040D21]/90 backdrop-blur-sm border ${det.color.split(' ')[1]} text-xs font-bold whitespace-nowrap`}>
                                            {det.label} {det.confidence}%
                                        </div>
                                    </div>
                                ))}

                                {/* Video HUD overlaid */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none"></div>

                                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur text-sm font-medium border border-white/10">
                                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                                        CAM-01 (Main Gate)
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur text-xs text-slate-300 border border-white/10">
                                        <Activity className="w-3 h-3" />
                                        30 FPS | 4K | 12ms Latency
                                    </div>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                                    <div>
                                        <p className="text-white font-bold text-shadow">Model: ResNet-50</p>
                                        <p className="text-emerald-400 text-sm font-semibold text-shadow">Status: Processing</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-mono text-sm text-shadow">{new Date().toLocaleTimeString()}</p>
                                        <p className="text-slate-300 text-xs text-shadow">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Priority Alerts */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                    Priority Alerts
                                </h2>
                                <button className="text-sm text-slate-400 hover:text-white font-medium">Mark all read</button>
                            </div>

                            <div className="bg-[#040D21] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 h-[calc(100%-2.5rem)] overflow-hidden">
                                <AnimatePresence>
                                    {data.alerts.map((alert) => (
                                        <motion.div
                                            key={alert.id}
                                            initial={{ opacity: 0, y: -20, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3 }}
                                            className={`p-3 rounded-xl border flex gap-3 items-start ${alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                                                alert.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                                                    'bg-blue-500/10 border-blue-500/20'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg shrink-0 ${alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {alert.severity === 'critical' ? <Shield className="w-4 h-4" /> :
                                                    alert.severity === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                                        <Activity className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`font-semibold text-sm truncate ${alert.severity === 'critical' ? 'text-red-400' :
                                                        alert.severity === 'warning' ? 'text-amber-400' :
                                                            'text-blue-400'
                                                        }`}>{alert.type}</p>
                                                    <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{alert.time}</span>
                                                </div>
                                                <p className="text-xs text-slate-300 truncate mb-1">{alert.camera}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/30 border border-white/5 text-slate-400">
                                                        ID: {alert.id}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-400">Conf: {alert.confidence}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <button className="mt-auto w-full py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-slate-700">
                                    View Alert History
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
                        {/* Trend Graph */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-400" />
                                Anomaly Detection Trend
                            </h2>
                            <div className="bg-[#040D21] border border-slate-800 rounded-2xl p-6 h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.trendData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f8fafc' }}
                                            itemStyle={{ color: '#a78bfa' }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Camera Grid Mini */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Database className="w-5 h-5 text-emerald-400" />
                                Camera Network Status
                            </h2>
                            <div className="bg-[#040D21] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                                {MOCK_CAMERAS.map(cam => (
                                    <div key={cam.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={cam.image} alt={cam.location} className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                                                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${cam.status === 'active' ? 'bg-emerald-500' :
                                                    cam.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                                                    }`}></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{cam.id}</p>
                                                <p className="text-xs text-slate-400">{cam.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button className="mt-2 text-sm text-blue-400 hover:text-blue-300 font-medium">Manage Network Settings</button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

// Helper Components
function SidebarItem({ icon, label, active, badge, badgeColor = "bg-blue-500" }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, badgeColor?: string }) {
    return (
        <button className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${active
            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_20px_rgba(37,99,235,0.1)]'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
            }`}>
            <div className="flex items-center gap-3">
                <div className={`transition-colors ${active ? 'text-blue-400' : 'text-slate-500'}`}>
                    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
                </div>
                <span className={`text-sm font-medium ${active ? 'text-blue-400' : ''}`}>{label}</span>
            </div>
            {badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${badgeColor}`}>{badge}</span>
            )}
        </button>
    );
}

function KPICard({ title, value, subtext, icon, trend }: { title: string, value: string, subtext: string, icon: React.ReactNode, trend: 'up' | 'down' | 'stable' }) {
    return (
        <div className="bg-[#040D21] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 text-shadow">
                    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
                </div>
                {trend === 'up' && <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">+2.4%</span>}
                {trend === 'down' && <span className="text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded border border-red-400/20">-1.2%</span>}
            </div>
            <h4 className="text-3xl font-bold text-white mb-1 relative z-10">{value}</h4>
            <p className="text-sm font-medium text-slate-400 mb-1 relative z-10">{title}</p>
            <p className="text-xs text-slate-500 relative z-10 font-mono mt-2 pt-2 border-t border-slate-800/50">{subtext}</p>
        </div>
    );
}

function ServerIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
    );
}
