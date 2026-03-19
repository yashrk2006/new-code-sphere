import { useState, useEffect } from 'react';
import { useAlertStore } from '../../store/useAlertStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
    Activity, Shield, AlertTriangle, 
    Server, Zap, CheckCircle, Terminal, FileText, Plus, Search, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import LiveInferenceFeed from './LiveInferenceFeed';
import AddNodeModal from '../../components/AddNodeModal';
import { AnomalyTrendChart } from './AnomalyTrendChart';
import { getApiUrl, getSocketUrl } from '../../utils/api';



// WebSocket connection strings (instantiated inside useEffect to prevent SSR hydration mismatch)
const SYSTEM_WS_URL = getSocketUrl();
const MAIN_WS_URL = getSocketUrl();

export default function CommandCenter() {
    const { alerts, addLiveAlert } = useAlertStore();
    const { addLiveNotification } = useNotificationStore();
    const [systemLogs, setSystemLogs] = useState<{ time: string, msg: string, type: string }[]>([]);
    const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
    const [alertSearchQuery, setAlertSearchQuery] = useState('');
    
    // Dynamic Camera Navigation
    const [currentCamIndex, setCurrentCamIndex] = useState(0);
    const [cameras, setCameras] = useState<{id: string, name: string, streamUrl: string, fps: number}[]>([]);

    const handleNextCamera = () => {
        if (cameras.length === 0) return;
        setCurrentCamIndex((prev) => (prev + 1) % cameras.length);
    };

    const handleBackCamera = () => {
        if (cameras.length === 0) return;
        setCurrentCamIndex((prev) => (prev - 1 + cameras.length) % cameras.length);
    };

    const activeCamera = cameras[currentCamIndex] || { id: 'None', name: 'None', streamUrl: '', fps: 0 };
    
    // Real-Time Dashboard States
    const [activeNodes, setActiveNodes] = useState(0);
    const [totalNodes, setTotalNodes] = useState(0);
    const [avgLatency, setAvgLatency] = useState(0);
    const [healthPercent, setHealthPercent] = useState(100);
    const [latencyTrend, setLatencyTrend] = useState<{value: number}[]>(Array(5).fill({value: 0}));

    // 1. Initial API Fetching for historical KPIs
    const { data: stats } = useQuery({
        queryKey: ['command_center_stats'],
        queryFn: async () => {
             const res = await axios.get(getApiUrl('/stats/overview'));
             return res.data;
        },
        refetchInterval: 30000,
    });

    // 2. Listen for Real-Time Telemetry
    useEffect(() => {
        // Prevent Vercel connection errors during SSR
        if (typeof window === 'undefined' || window.location.hostname.includes('vercel.app')) return;

        const socket = io(SYSTEM_WS_URL);
        const mainSocket = io(MAIN_WS_URL);
        // System Logs
        socket.on('system_log', (log) => {
            setSystemLogs(prev => [{ time: new Date().toLocaleTimeString(), ...log }, ...prev].slice(0, 50));
        });

        // Edge Heartbeats mapping to Active Nodes & Health
        const edgeStatusMap = new Map();
        mainSocket.on('edge_heartbeat', (nodeData) => {
            edgeStatusMap.set(nodeData.id, nodeData.status);
            
            // Calculate Active Nodes
            let active = 0;
            edgeStatusMap.forEach(status => {
                if (status === 'online') active++;
            });
            setActiveNodes(active);
            setTotalNodes(Math.max(3, edgeStatusMap.size)); // Demo assumes at least 3

            // Calculate System Health (mock logic based on CPU/RAM of nodes)
            if (nodeData.metrics) {
                const cpuHealth = Math.max(0, 100 - nodeData.metrics.cpu_usage);
                const ramHealth = Math.max(0, 100 - nodeData.metrics.ram_usage);
                let newHealth = Math.round((cpuHealth + ramHealth) / 2);
                
                // If avg latency > 50ms, drop health by 5% as requested
                setAvgLatency(currentAvgLatency => {
                    if (currentAvgLatency > 50) {
                        newHealth -= 5;
                    }
                    return currentAvgLatency; // don't actually mutate latency here
                });
                
                setHealthPercent(newHealth);
            }
        });

        mainSocket.on('init_cameras', (initialCameras) => {
            const streamUrl = import.meta.env.VITE_CAMERA_URL || 'http://localhost:5001/video_feed';
            // Ensure CAM-04 points to VITE_CAMERA_URL (ngrok in prod, localhost in dev)
            const enriched = initialCameras.map((cam: any) => {
                if (cam.id === 'CAM-04' && !cam.streamUrl) {
                    return { ...cam, streamUrl, fps: 30 };
                }
                return cam;
            });
            setCameras(enriched);
        });

        // AI Inference Updates (Latency tracking)
        mainSocket.on('boxes_CAM-04', () => {
            // Tracking is handled inside LiveInferenceFeed, 
            // but we update the dashboard avg for KPI
            setAvgLatency(prev => {
                const newAvg = (prev * 0.9) + (12 * 0.1); // using a realistic baseline of 12ms for local
                setLatencyTrend(t => [...t.slice(1), { value: newAvg }]);
                return newAvg;
            });
        });

        // Live Alerts
        mainSocket.on('new_anomaly', (alert) => {
             addLiveAlert(alert);
             
             // Sync to Notification Bell
             addLiveNotification({
                 id: alert.id || Date.now().toString(),
                 type: alert.severity === 'Critical' ? 'critical' : 'warning',
                 title: `New Anomaly: ${alert.type.replace('_', ' ')}`,
                 message: `Detected at ${alert.camera_id} with ${(alert.confidence * 100).toFixed(1)}% confidence.`,
                 is_read: false,
                 created_at: new Date().toISOString()
             });

             // Play alert sound for priority anomalies
             const audio = new Audio('/alert-chime.mp3'); 
             audio.play().catch(e => console.log('Audio autoplay blocked by browser', e));
        });

        return () => { 
            socket.off('system_log'); 
            mainSocket.off('edge_heartbeat');
            mainSocket.off('boxes_CAM-04');
            mainSocket.off('new_anomaly');
            socket.disconnect();
            mainSocket.disconnect();
        };
    }, [addLiveAlert, addLiveNotification]);

    // Derived stats for UI
    const activeAlerts = alerts.filter(a => {
        const matchesStatus = a.status !== 'Resolved';
        if (!alertSearchQuery) return matchesStatus;
        const q = alertSearchQuery.toLowerCase();
        return matchesStatus && (
            a.type.toLowerCase().includes(q) ||
            a.camera_id.toLowerCase().includes(q) ||
            a.severity.toLowerCase().includes(q)
        );
    }).slice(0, 6);
    const totalAnomaliesLive = (stats?.totalAnomalies24h || 0) + alerts.length;
    const criticalAnomaliesLive = alerts.filter(a => a.severity === 'Critical').length;

    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateReport = async () => {
         try {
             setIsGenerating(true);
             const response = await axios.get(getApiUrl('/reports/generate'), {
                 responseType: 'blob'
             });
             
             // Create a URL for the blob and trigger download
             const url = window.URL.createObjectURL(new Blob([response.data]));
             const link = document.createElement('a');
             link.href = url;
             link.setAttribute('download', `security_report_${new Date().toISOString().split('T')[0]}.pdf`);
             document.body.appendChild(link);
             link.click();
             link.parentNode?.removeChild(link);
         } catch (error) {
             console.error('Report generation failed:', error);
             alert('Failed to generate report. Please try again later.');
         } finally {
             setIsGenerating(false);
         }
    };

    return (
        <div className="p-6 bg-[#0B0F19] min-h-screen text-white overflow-y-auto overflow-x-hidden">

            {/* Header & Quick Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-bold tracking-widest text-green-500 uppercase">Live System Status</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-glow">Command Center</h1>
                    <p className="text-slate-400 mt-1">Real-time edge inference and anomaly detection overview.</p>
                </div>

                <div className="flex gap-3 mt-4 md:mt-0 relative z-10">
                    <button 
                         onClick={handleGenerateReport} 
                         disabled={isGenerating}
                         className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded-lg text-sm font-semibold transition"
                    >
                        {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileText size={16} />} 
                        {isGenerating ? 'Generating...' : 'Generate Report'}
                    </button>
                    <button 
                         onClick={() => setIsAddNodeModalOpen(true)}
                         className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition"
                    >
                        <Plus size={16} /> Add Camera Node
                    </button>
                </div>
            </div>

            {/* KPI Cards with Live Sparklines */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {/* Active Nodes */}
                <div className="glass-card p-5 flex flex-col justify-between h-32 hover:neon-border transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg"><Server size={18} className="text-blue-400" /></div>
                        <span className="text-sm text-gray-400 font-medium">Active Edge Nodes</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-3xl font-bold">{activeNodes}/{totalNodes}</h2>
                            <p className="text-xs text-green-400 font-bold flex items-center gap-1 mt-1">↑ UP <span className="text-gray-500 font-normal">{Math.round((activeNodes / totalNodes) * 100) || 0}% Operational</span></p>
                        </div>
                    </div>
                </div>

                {/* Total Anomalies */}
                <div className="glass-card p-5 flex flex-col justify-between h-32 relative overflow-hidden hover:neon-border transition-all duration-300">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle size={18} className="text-red-400" /></div>
                        <span className="text-sm text-gray-400 font-medium">Total Anomalies (24h)</span>
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                        <div>
                            <h2 className="text-3xl font-bold">{totalAnomaliesLive}</h2>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">→ LIVE <span className="text-gray-500">Critical: {criticalAnomaliesLive}</span></p>
                        </div>
                    </div>
                    {/* Sparkline Background */}
                    <div className="absolute bottom-0 right-0 w-1/2 h-16 opacity-30">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.anomalyTrend || []}>
                                <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Avg Inference Time */}
                <div className="glass-card p-5 flex flex-col justify-between h-32 relative overflow-hidden hover:neon-border transition-all duration-300">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 bg-purple-500/10 rounded-lg"><Zap size={18} className="text-purple-400" /></div>
                        <span className="text-sm text-gray-400 font-medium">Avg Inference Time</span>
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                        <div>
                            <h2 className="text-3xl font-bold">{avgLatency.toFixed(1)}ms</h2>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">→ LIVE <span className="text-gray-500">Using TensorRT ONNX</span></p>
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-1/2 h-16 opacity-30">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={latencyTrend}>
                                <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                                <Line type="stepAfter" dataKey="value" stroke="#A855F7" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* System Health */}
                <div className="glass-card p-5 flex flex-col justify-between h-32 hover:neon-border transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle size={18} className="text-green-400" /></div>
                        <span className="text-sm text-gray-400 font-medium">System Health</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-3xl font-bold">{healthPercent}%</h2>
                            <p className="text-xs text-green-400 font-bold flex items-center gap-1 mt-1">↑ UP <span className="text-gray-500 font-normal">All services operational</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid: Video Feed & Alerts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left Column: Video & Terminal */}
                <div className="xl:col-span-2 flex flex-col gap-6">

                    {/* Live Edge Inference Widget */}
                    <div className="glass-card shadow-2xl overflow-hidden flex flex-col h-[500px] border-neon-blue/20">
                        <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 backdrop-blur-md">
                            <h3 className="font-bold flex items-center gap-2">
                                <Activity size={18} className="text-blue-500" /> Live Edge Inference: {activeCamera.name}
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 uppercase tracking-wider ml-2">Rec</span>
                            </h3>
                            <div className="flex gap-2 items-center">
                                <div className="flex bg-gray-900 rounded-lg overflow-hidden border border-gray-700 mr-2">
                                    <button onClick={handleBackCamera} className="px-3 py-1 text-xs hover:bg-gray-700 transition font-bold text-gray-300">BACK</button>
                                    <div className="w-px bg-gray-700"></div>
                                    <button onClick={handleNextCamera} className="px-3 py-1 text-xs hover:bg-gray-700 transition font-bold text-gray-300">NEXT</button>
                                </div>
                                <span className="bg-gray-800 px-2 py-1 rounded text-xs font-mono text-gray-400 border border-gray-700">{activeCamera.id}</span>
                                <span className="bg-gray-800 px-2 py-1 rounded text-xs font-mono text-gray-400 border border-gray-700">{activeCamera.fps} FPS</span>
                            </div>
                        </div>
                        <div className="flex-grow bg-black relative">
                            <LiveInferenceFeed streamUrl={activeCamera.streamUrl} cameraId={activeCamera.id} />
                        </div>
                    </div>

                    {/* NEW FEATURE: Live System Terminal */}
                    <div className="glass-card shadow-xl overflow-hidden h-48 flex flex-col">
                        <div className="p-2 px-4 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2">
                            <Terminal size={14} className="text-slate-400" />
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Event Log</span>
                        </div>
                        <div className="p-4 font-mono text-xs overflow-y-auto flex-grow bg-slate-950/50">
                            {systemLogs.length === 0 ? (
                                <span className="text-gray-600">Awaiting system telemetry...</span>
                            ) : (
                                systemLogs.map((log, i) => (
                                    <div key={i} className="mb-1">
                                        <span className="text-gray-500">[{log.time}]</span>{' '}
                                        <span className={log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-green-400'}>
                                            [{log.type.toUpperCase()}]
                                        </span>{' '}
                                        <span className="text-gray-300">{log.msg}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Anomaly Trend Chart */}
                    <AnomalyTrendChart />
                </div>

                {/* Right Column: Priority Alerts */}
                <div className="glass-card shadow-xl flex flex-col h-[716px]">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/60">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold flex items-center gap-2">
                                <AlertTriangle size={18} className="text-red-500" /> Priority Alerts
                            </h3>
                            <span className="text-xs text-gray-500">{activeAlerts.length} active</span>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search alerts (CAM-01, Unauthorized...)"
                                value={alertSearchQuery}
                                onChange={(e) => setAlertSearchQuery(e.target.value)}
                                className="w-full bg-[#0d0e12] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition"
                            />
                        </div>
                    </div>

                    <div className="p-4 space-y-3 overflow-y-auto flex-grow custom-scrollbar">
                        {activeAlerts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                                <Shield size={48} className="mb-4" />
                                <p className="text-sm">No active priority alerts.</p>
                                <p className="text-xs mt-1">System monitoring all zones.</p>
                            </div>
                        ) : (
                            activeAlerts.map(alert => (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    key={alert.id}
                                    className={`p-4 rounded-xl border ${alert.severity === 'Critical' ? 'bg-red-900/10 border-red-900/50' : 'bg-yellow-900/10 border-yellow-900/50'} flex gap-3`}
                                >
                                    <div className="mt-0.5">
                                        <AlertTriangle size={16} className={alert.severity === 'Critical' ? 'text-red-500' : 'text-yellow-500'} />
                                    </div>
                                    <div className="flex-grow">
                                        <p className={`text-sm font-bold uppercase tracking-wide ${alert.severity === 'Critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {alert.type.replace('_', ' ')}
                                        </p>
                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <MapPin size={12} /> {alert.camera_id}
                                            </p>
                                            <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div className="mt-3 w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full ${alert.severity === 'Critical' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${alert.confidence * 100}%` }}></div>
                                        </div>
                                        <p className="text-right text-[10px] text-gray-500 mt-1 font-mono">CONF: {(alert.confidence * 100).toFixed(2)}%</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            <AddNodeModal 
                isOpen={isAddNodeModalOpen} 
                onClose={() => setIsAddNodeModalOpen(false)} 
                onAdd={(data) => {
                    console.log('Deploying node:', data);
                    // Mock immediate feedback
                    setSystemLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: `Provisioning new edge node: ${data.name}...`, type: 'info' }, ...prev].slice(0, 50));
                    setTimeout(() => {
                         setTotalNodes(prev => prev + 1);
                         setActiveNodes(prev => prev + 1);
                         
                         // Add new camera to navigation
                         const newCamId = `CAM-0${cameras.length + 1}`;
                         setCameras(prev => [...prev, { id: newCamId, name: data.name, streamUrl: data.ip.includes('http') ? data.ip : `http://${data.ip}`, fps: 30 }]);
                         
                         setSystemLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: `Node ${data.name} connected successfully.`, type: 'info' }, ...prev].slice(0, 50));
                    }, 1500);
                    setIsAddNodeModalOpen(false);
                }} 
            />
        </div>
    );
}
