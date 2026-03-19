import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAlertStore } from '../../store/useAlertStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Activity, Camera, Shield, Database, Download, AlertTriangle, Cpu, HardDrive, Server, Zap, CheckCircle, Terminal, FileText, Plus, Search, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import LiveInferenceFeed from './LiveInferenceFeed';
import AddNodeModal from '../../components/AddNodeModal';
import { AnomalyTrendChart } from './AnomalyTrendChart';
import { useCameraStore } from '../../store/useCameraStore';
import { useEdgeStore } from '../../store/useEdgeStore';
import { getApiUrl, getSocketUrl } from '../../utils/api';
// WebSocket connection strings (instantiated inside useEffect to prevent SSR hydration mismatch)
const SYSTEM_WS_URL = getSocketUrl();
const MAIN_WS_URL = getSocketUrl();
export default function CommandCenter() {
    const { alerts, addLiveAlert } = useAlertStore();
    const { addLiveNotification } = useNotificationStore();
    const [systemLogs, setSystemLogs] = useState([]);
    const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
    const [alertSearchQuery, setAlertSearchQuery] = useState('');
    // Dynamic Camera Navigation
    const [currentCamIndex, setCurrentCamIndex] = useState(0);
    // In a real app, this would be fetched from /api/nodes
    const [cameras, setCameras] = useState([
        { id: 'CAM-04', name: 'Primary Surveillance', streamUrl: 'http://192.168.1.8:8080/video', fps: 30 },
        { id: 'CAM-01', name: 'North Entrance', streamUrl: 'http://192.168.1.5:8080/video', fps: 24 },
        { id: 'CAM-02', name: 'Loading Dock', streamUrl: 'http://192.168.0.5:8080/video', fps: 24 },
    ]);
    const handleNextCamera = () => {
        setCurrentCamIndex((prev) => (prev + 1) % cameras.length);
    };
    const handleBackCamera = () => {
        setCurrentCamIndex((prev) => (prev - 1 + cameras.length) % cameras.length);
    };
    const activeCamera = cameras[currentCamIndex] || { id: 'None', name: 'None', streamUrl: '', fps: 0 };
    // Real-Time Dashboard States
    const [activeNodes, setActiveNodes] = useState(0);
    const [totalNodes, setTotalNodes] = useState(3);
    const [avgLatency, setAvgLatency] = useState(0);
    const [healthPercent, setHealthPercent] = useState(100);
    const [latencyTrend, setLatencyTrend] = useState(Array(5).fill({ value: 0 }));
    // 1. Initial API Fetching for historical KPIs (optional baseline)
    const { data: stats } = useQuery({
        queryKey: ['command_center_stats'],
        queryFn: async () => {
            // Fallback demo data baseline
            return {
                totalAnomalies: 221, criticalAnomalies: 0,
                anomalyTrend: [{ value: 5 }, { value: 7 }, { value: 3 }, { value: 8 }, { value: 12 }],
            };
        },
        refetchInterval: false,
    });
    // 2. Listen for Real-Time Telemetry
    useEffect(() => {
        // Prevent Vercel connection errors during SSR
        if (typeof window === 'undefined' || window.location.hostname.includes('vercel.app'))
            return;
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
                if (status === 'online')
                    active++;
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
        // AI Inference Updates (Latency tracking)
        mainSocket.on('boxes_CAM-04', () => {
            // Simulate a rolling latency calculation based on inference arrivals
            const mockCurrentLatency = 8 + Math.random() * 4;
            setAvgLatency(prev => {
                const newAvg = (prev * 0.9) + (mockCurrentLatency * 0.1); // smoothing
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
        if (!alertSearchQuery)
            return matchesStatus;
        const q = alertSearchQuery.toLowerCase();
        return matchesStatus && (a.type.toLowerCase().includes(q) ||
            a.camera_id.toLowerCase().includes(q) ||
            a.severity.toLowerCase().includes(q));
    }).slice(0, 6);
    const totalAnomaliesLive = (stats?.totalAnomalies || 0) + alerts.length;
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
        }
        catch (error) {
            console.error('Report generation failed:', error);
            alert('Failed to generate report. Please try again later.');
        }
        finally {
            setIsGenerating(false);
        }
    };
    return (_jsxs("div", { className: "p-6 bg-[#0B0F19] min-h-screen text-white overflow-y-auto overflow-x-hidden", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-8", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }), _jsx("span", { className: "text-xs font-bold tracking-widest text-green-500 uppercase", children: "Live System Status" })] }), _jsx("h1", { className: "text-4xl font-extrabold tracking-tight", children: "Command Center" }), _jsx("p", { className: "text-gray-400 mt-1", children: "Real-time edge inference and anomaly detection overview." })] }), _jsxs("div", { className: "flex gap-3 mt-4 md:mt-0 relative z-10", children: [_jsxs("button", { onClick: handleGenerateReport, disabled: isGenerating, className: "flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded-lg text-sm font-semibold transition", children: [isGenerating ? _jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }) : _jsx(FileText, { size: 16 }), isGenerating ? 'Generating...' : 'Generate Report'] }), _jsxs("button", { onClick: () => setIsAddNodeModalOpen(true), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition", children: [_jsx(Plus, { size: 16 }), " Add Camera Node"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6", children: [_jsxs("div", { className: "bg-[#151923] p-5 rounded-xl border border-gray-800 flex flex-col justify-between h-32", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-blue-500/10 rounded-lg", children: _jsx(Server, { size: 18, className: "text-blue-400" }) }), _jsx("span", { className: "text-sm text-gray-400 font-medium", children: "Active Edge Nodes" })] }), _jsx("div", { className: "flex items-end justify-between", children: _jsxs("div", { children: [_jsxs("h2", { className: "text-3xl font-bold", children: [activeNodes, "/", totalNodes] }), _jsxs("p", { className: "text-xs text-green-400 font-bold flex items-center gap-1 mt-1", children: ["\u2191 UP ", _jsxs("span", { className: "text-gray-500 font-normal", children: [Math.round((activeNodes / totalNodes) * 100) || 0, "% Operational"] })] })] }) })] }), _jsxs("div", { className: "bg-[#151923] p-5 rounded-xl border border-gray-800 flex flex-col justify-between h-32 relative overflow-hidden", children: [_jsxs("div", { className: "flex items-center gap-3 relative z-10", children: [_jsx("div", { className: "p-2 bg-red-500/10 rounded-lg", children: _jsx(AlertTriangle, { size: 18, className: "text-red-400" }) }), _jsx("span", { className: "text-sm text-gray-400 font-medium", children: "Total Anomalies (24h)" })] }), _jsx("div", { className: "flex items-end justify-between relative z-10", children: _jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold", children: totalAnomaliesLive }), _jsxs("p", { className: "text-xs text-gray-400 mt-1 flex items-center gap-1", children: ["\u2192 LIVE ", _jsxs("span", { className: "text-gray-500", children: ["Critical: ", criticalAnomaliesLive] })] })] }) }), _jsx("div", { className: "absolute bottom-0 right-0 w-1/2 h-16 opacity-30", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsx(LineChart, { data: stats?.anomalyTrend || [], children: _jsx(Line, { type: "monotone", dataKey: "value", stroke: "#EF4444", strokeWidth: 2, dot: false }) }) }) })] }), _jsxs("div", { className: "bg-[#151923] p-5 rounded-xl border border-gray-800 flex flex-col justify-between h-32 relative overflow-hidden", children: [_jsxs("div", { className: "flex items-center gap-3 relative z-10", children: [_jsx("div", { className: "p-2 bg-purple-500/10 rounded-lg", children: _jsx(Zap, { size: 18, className: "text-purple-400" }) }), _jsx("span", { className: "text-sm text-gray-400 font-medium", children: "Avg Inference Time" })] }), _jsx("div", { className: "flex items-end justify-between relative z-10", children: _jsxs("div", { children: [_jsxs("h2", { className: "text-3xl font-bold", children: [avgLatency.toFixed(1), "ms"] }), _jsxs("p", { className: "text-xs text-gray-400 mt-1 flex items-center gap-1", children: ["\u2192 LIVE ", _jsx("span", { className: "text-gray-500", children: "Using TensorRT ONNX" })] })] }) }), _jsx("div", { className: "absolute bottom-0 right-0 w-1/2 h-16 opacity-30", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: latencyTrend, children: [_jsx(YAxis, { domain: ['dataMin - 2', 'dataMax + 2'], hide: true }), _jsx(Line, { type: "stepAfter", dataKey: "value", stroke: "#A855F7", strokeWidth: 2, dot: false })] }) }) })] }), _jsxs("div", { className: "bg-[#151923] p-5 rounded-xl border border-gray-800 flex flex-col justify-between h-32", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-green-500/10 rounded-lg", children: _jsx(CheckCircle, { size: 18, className: "text-green-400" }) }), _jsx("span", { className: "text-sm text-gray-400 font-medium", children: "System Health" })] }), _jsx("div", { className: "flex items-end justify-between", children: _jsxs("div", { children: [_jsxs("h2", { className: "text-3xl font-bold", children: [healthPercent, "%"] }), _jsxs("p", { className: "text-xs text-green-400 font-bold flex items-center gap-1 mt-1", children: ["\u2191 UP ", _jsx("span", { className: "text-gray-500 font-normal", children: "All services operational" })] })] }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-6", children: [_jsxs("div", { className: "xl:col-span-2 flex flex-col gap-6", children: [_jsxs("div", { className: "bg-[#151923] rounded-xl border border-gray-800 shadow-xl overflow-hidden flex flex-col h-[500px]", children: [_jsxs("div", { className: "p-3 border-b border-gray-800 flex justify-between items-center bg-[#1A1D27]", children: [_jsxs("h3", { className: "font-bold flex items-center gap-2", children: [_jsx(Activity, { size: 18, className: "text-blue-500" }), " Live Edge Inference: ", activeCamera.name, _jsx("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 uppercase tracking-wider ml-2", children: "Rec" })] }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsxs("div", { className: "flex bg-gray-900 rounded-lg overflow-hidden border border-gray-700 mr-2", children: [_jsx("button", { onClick: handleBackCamera, className: "px-3 py-1 text-xs hover:bg-gray-700 transition font-bold text-gray-300", children: "BACK" }), _jsx("div", { className: "w-px bg-gray-700" }), _jsx("button", { onClick: handleNextCamera, className: "px-3 py-1 text-xs hover:bg-gray-700 transition font-bold text-gray-300", children: "NEXT" })] }), _jsx("span", { className: "bg-gray-800 px-2 py-1 rounded text-xs font-mono text-gray-400 border border-gray-700", children: activeCamera.id }), _jsxs("span", { className: "bg-gray-800 px-2 py-1 rounded text-xs font-mono text-gray-400 border border-gray-700", children: [activeCamera.fps, " FPS"] })] })] }), _jsx("div", { className: "flex-grow bg-black relative", children: _jsx(LiveInferenceFeed, { streamUrl: activeCamera.streamUrl, cameraId: activeCamera.id }) })] }), _jsxs("div", { className: "bg-[#151923] rounded-xl border border-gray-800 shadow-xl overflow-hidden h-48 flex flex-col", children: [_jsxs("div", { className: "p-2 px-4 border-b border-gray-800 bg-[#1A1D27] flex items-center gap-2", children: [_jsx(Terminal, { size: 14, className: "text-gray-400" }), _jsx("span", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "System Event Log" })] }), _jsx("div", { className: "p-4 font-mono text-xs overflow-y-auto flex-grow bg-[#0B0F19]", children: systemLogs.length === 0 ? (_jsx("span", { className: "text-gray-600", children: "Awaiting system telemetry..." })) : (systemLogs.map((log, i) => (_jsxs("div", { className: "mb-1", children: [_jsxs("span", { className: "text-gray-500", children: ["[", log.time, "]"] }), ' ', _jsxs("span", { className: log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-green-400', children: ["[", log.type.toUpperCase(), "]"] }), ' ', _jsx("span", { className: "text-gray-300", children: log.msg })] }, i)))) })] }), _jsx(AnomalyTrendChart, {})] }), _jsxs("div", { className: "bg-[#151923] rounded-xl border border-gray-800 shadow-xl flex flex-col h-[716px]", children: [_jsxs("div", { className: "p-4 border-b border-gray-800 bg-[#1A1D27]", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsxs("h3", { className: "font-bold flex items-center gap-2", children: [_jsx(AlertTriangle, { size: 18, className: "text-red-500" }), " Priority Alerts"] }), _jsxs("span", { className: "text-xs text-gray-500", children: [activeAlerts.length, " active"] })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" }), _jsx("input", { type: "text", placeholder: "Search alerts (CAM-01, Unauthorized...)", value: alertSearchQuery, onChange: (e) => setAlertSearchQuery(e.target.value), className: "w-full bg-[#0d0e12] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition" })] })] }), _jsx("div", { className: "p-4 space-y-3 overflow-y-auto flex-grow custom-scrollbar", children: activeAlerts.length === 0 ? (_jsxs("div", { className: "h-full flex flex-col items-center justify-center text-gray-500 opacity-60", children: [_jsx(Shield, { size: 48, className: "mb-4" }), _jsx("p", { className: "text-sm", children: "No active priority alerts." }), _jsx("p", { className: "text-xs mt-1", children: "System monitoring all zones." })] })) : (activeAlerts.map(alert => (_jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, className: `p-4 rounded-xl border ${alert.severity === 'Critical' ? 'bg-red-900/10 border-red-900/50' : 'bg-yellow-900/10 border-yellow-900/50'} flex gap-3`, children: [_jsx("div", { className: "mt-0.5", children: _jsx(AlertTriangle, { size: 16, className: alert.severity === 'Critical' ? 'text-red-500' : 'text-yellow-500' }) }), _jsxs("div", { className: "flex-grow", children: [_jsx("p", { className: `text-sm font-bold uppercase tracking-wide ${alert.severity === 'Critical' ? 'text-red-400' : 'text-yellow-400'}`, children: alert.type.replace('_', ' ') }), _jsxs("div", { className: "flex justify-between items-center mt-2", children: [_jsxs("p", { className: "text-xs text-gray-400 flex items-center gap-1", children: [_jsx(MapPin, { size: 12 }), " ", alert.camera_id] }), _jsx("p", { className: "text-xs text-gray-500", children: new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }), _jsx("div", { className: "mt-3 w-full bg-gray-900 h-1.5 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${alert.severity === 'Critical' ? 'bg-red-500' : 'bg-yellow-500'}`, style: { width: `${alert.confidence * 100}%` } }) }), _jsxs("p", { className: "text-right text-[10px] text-gray-500 mt-1 font-mono", children: ["CONF: ", (alert.confidence * 100).toFixed(2), "%"] })] })] }, alert.id)))) })] })] }), _jsx(AddNodeModal, { isOpen: isAddNodeModalOpen, onClose: () => setIsAddNodeModalOpen(false), onAdd: (data) => {
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
                } })] }));
}
