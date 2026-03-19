import React, { useState } from 'react';
import {
    Camera, AlertTriangle, Activity, Shield, Database,
    LayoutDashboard, Video, Settings, Search, Menu, X,
    MapPin, Server as ServerIcon, ChevronLeft, ChevronRight, Users
} from 'lucide-react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAlertStore } from '../store/useAlertStore';
import { useAuthStore } from '../store/useAuthStore';
import NotificationDropdown from '../components/NotificationDropdown';
import { AnimatePresence, motion } from 'framer-motion';

const MODULE_ORDER = [
    { path: '/dashboard', title: 'Overview' },
    { path: '/dashboard/cameras', title: 'Live Cameras' },
    { path: '/dashboard/alerts', title: 'Anomaly Alerts' },
    { path: '/dashboard/citizen-hub', title: 'Citizen Hub' },
    { path: '/dashboard/analytics', title: 'Analytics' },
    { path: '/dashboard/map', title: 'Zone Map' },
    { path: '/dashboard/edge', title: 'Edge Nodes' },
    { path: '/dashboard/security', title: 'Security' },
    { path: '/dashboard/storage', title: 'Storage' },
    { path: '/dashboard/settings', title: 'Settings' },
];

export default function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const pendingAlertCount = useAlertStore((s) => s.alerts.filter(a => a.status === 'Pending').length);

    const currentIndex = MODULE_ORDER.findIndex((m) => m.path === location.pathname);
    const currentModule = MODULE_ORDER[Math.max(0, currentIndex)];

    const handleBack = () => {
        if (currentIndex > 0) navigate(MODULE_ORDER[currentIndex - 1].path);
    };
    const handleNext = () => {
        if (currentIndex < MODULE_ORDER.length - 1) navigate(MODULE_ORDER[currentIndex + 1].path);
    };

    return (
        <div className="flex h-screen bg-[#020617] text-slate-50 overflow-hidden font-sans selection:bg-blue-500/30 relative">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
            <div className="fixed inset-0 bg-mesh opacity-30 pointer-events-none" />
            <div className="fixed -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />
            <div className="fixed -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></motion.div>
            )}

            {/* Sidebar */}
            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#040D21]/40 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}>
                <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/20">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white glow-text">Vision<span className="text-blue-400">AIoT</span></span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 opacity-50">Intelligence</p>
                    <SidebarItem icon={<LayoutDashboard />} label="Command Center" active={location.pathname === '/dashboard'} path="/dashboard" />
                    <SidebarItem icon={<Video />} label="Live Streams" active={location.pathname === '/dashboard/cameras'} badge="4" path="/dashboard/cameras" />
                    <SidebarItem icon={<AlertTriangle />} label="Incidents" active={location.pathname === '/dashboard/alerts'} badge={pendingAlertCount > 0 ? String(pendingAlertCount) : undefined} badgeColor="bg-red-500/80 shadow-lg shadow-red-500/20" path="/dashboard/alerts" />
                    <SidebarItem icon={<Users />} label="Citizen Hub" active={location.pathname === '/dashboard/citizen-hub'} path="/dashboard/citizen-hub" />
                    <SidebarItem icon={<Activity />} label="Analytics" active={location.pathname === '/dashboard/analytics'} path="/dashboard/analytics" />
                    <SidebarItem icon={<MapPin />} label="Spatial Map" active={location.pathname === '/dashboard/map'} path="/dashboard/map" />

                    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-10 mb-4 opacity-50">Infrastructure</p>
                    <SidebarItem icon={<ServerIcon />} label="Edge Cluster" active={location.pathname === '/dashboard/edge'} badge="3 Active" badgeColor="bg-emerald-500/80 shadow-lg shadow-emerald-500/20" path="/dashboard/edge" />
                    <SidebarItem icon={<Shield />} label="Security" active={location.pathname === '/dashboard/security'} path="/dashboard/security" />
                    <SidebarItem icon={<Database />} label="Synapse Store" active={location.pathname === '/dashboard/storage'} path="/dashboard/storage" />
                    <SidebarItem icon={<Settings />} label="Preferences" active={location.pathname === '/dashboard/settings'} path="/dashboard/settings" />
                </div>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => {
                            useAuthStore.getState().logout();
                            navigate('/');
                        }}
                        className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-red-500/50 group-hover:bg-red-500/10 transition-all">
                            <X className="w-4 h-4 group-hover:text-red-400" />
                        </div>
                        <span className="text-sm font-medium">Terminate Session</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0 overflow-hidden">
                {/* Top Header */}
                <header className="relative z-[100] h-16 border-b border-white/5 bg-[#040D21]/40 backdrop-blur-xl shrink-0 flex items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 text-slate-400 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 focus-within:border-blue-500/50 focus-within:bg-white/10 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                            <Search className="w-4 h-4 text-slate-400 mr-2" />
                            <input type="text" placeholder="Search system resources..." className="bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 w-64" />
                        </div>
                    </div>

                    {/* Center: Back / Next Module Navigation */}
                    <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                        <button
                            onClick={handleBack}
                            disabled={currentIndex <= 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="w-32 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate px-1.5">
                            {currentModule?.title || 'System'}
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex >= MODULE_ORDER.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationDropdown />
                        <Link to="/dashboard/settings" className="relative group">
                            <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20 border border-white/20 relative z-10 animate-float">
                                SP
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Outlet for Nested Routes (DashboardOverview, CameraGrid, etc) */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10, scale: 0.995 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 1.005 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

// Helper Components
function SidebarItem({ icon, label, active, badge, badgeColor = "bg-blue-500", path = "/dashboard" }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, badgeColor?: string, path?: string }) {
    return (
        <Link to={path} className={`group relative w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${active
            ? 'bg-blue-600/10 text-white border border-blue-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}>
            {active && (
                <motion.div
                    layoutId="active-nav"
                    className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
            <div className="flex items-center gap-3 relative z-10">
                <div className={`transition-all duration-300 ${active ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
                </div>
                <span className={`text-sm font-medium tracking-tight transition-colors`}>{label}</span>
            </div>
            {badge && (
                <span className={`relative z-10 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-lg text-white ${badgeColor}`}>{badge}</span>
            )}
        </Link>
    );
}
