import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEdgeStore } from '../../store/useEdgeStore';
import EdgeNodeCard from './EdgeNodeCard';
import { Server, Activity, Wifi, WifiOff, RefreshCw, Cpu, } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiUrl } from '../../utils/api';
export default function EdgeDashboard() {
    const { nodes, setInitialNodes } = useEdgeStore();
    // Fetch initial node list from REST API
    const { isLoading } = useQuery({
        queryKey: ['edge_nodes'],
        queryFn: async () => {
            const { data } = await axios.get(getApiUrl('/edge'));
            setInitialNodes(data);
            return data;
        },
        refetchOnWindowFocus: false,
    });
    const onlineCount = nodes.filter((n) => n.status === 'online').length;
    const offlineCount = nodes.filter((n) => n.status === 'offline').length;
    const busyCount = nodes.filter((n) => n.status === 'restarting' || n.status === 'updating').length;
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-full bg-[#020617] text-white", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsxs("div", { className: "relative w-14 h-14", children: [_jsx("div", { className: "absolute inset-0 rounded-full border-2 border-slate-800" }), _jsx("div", { className: "absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm font-medium text-white", children: "Connecting to Edge Fleet" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Querying device registry..." })] })] }) }));
    }
    return (_jsxs("div", { className: "p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full overflow-y-auto", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-end justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Server, { className: "w-4 h-4 text-blue-400" }), _jsx("span", { className: "text-xs font-medium text-blue-400 tracking-wider uppercase", children: "Infrastructure" })] }), _jsx("h1", { className: "text-2xl sm:text-3xl font-bold tracking-tight text-white", children: "Edge Compute Fleet" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Live hardware telemetry and model deployment." })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-4 bg-[#040D21] border border-slate-800 rounded-xl px-4 py-2.5", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Wifi, { className: "w-3.5 h-3.5 text-emerald-400" }), _jsx("span", { className: "text-xs font-bold text-white", children: onlineCount }), _jsx("span", { className: "text-[10px] text-slate-500", children: "Online" })] }), _jsx("div", { className: "w-px h-4 bg-slate-800" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(WifiOff, { className: "w-3.5 h-3.5 text-red-400" }), _jsx("span", { className: "text-xs font-bold text-white", children: offlineCount }), _jsx("span", { className: "text-[10px] text-slate-500", children: "Offline" })] }), busyCount > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-px h-4 bg-slate-800" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(RefreshCw, { className: "w-3.5 h-3.5 text-amber-400 animate-spin" }), _jsx("span", { className: "text-xs font-bold text-white", children: busyCount }), _jsx("span", { className: "text-[10px] text-slate-500", children: "Busy" })] })] }))] }), _jsxs("div", { className: "flex items-center gap-1.5 bg-[#040D21] border border-slate-800 rounded-xl px-3 py-2.5", children: [_jsx(Activity, { className: "w-3.5 h-3.5 text-emerald-400 animate-pulse" }), _jsx("span", { className: "text-[10px] text-slate-400 font-medium", children: "Telemetry Live" })] })] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "bg-[#040D21] border border-slate-800 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4", children: [_jsx(SummaryKPI, { label: "Total Nodes", value: nodes.length.toString(), icon: _jsx(Server, { className: "w-4 h-4 text-blue-400" }) }), _jsx(SummaryKPI, { label: "Fleet Uptime", value: `${nodes.length > 0 ? Math.round((onlineCount / nodes.length) * 100) : 0}%`, icon: _jsx(Activity, { className: "w-4 h-4 text-emerald-400" }) }), _jsx(SummaryKPI, { label: "Avg CPU Load", value: `${nodes.length > 0 ? (nodes.filter(n => n.status !== 'offline').reduce((s, n) => s + n.metrics.cpu_usage, 0) / Math.max(onlineCount + busyCount, 1)).toFixed(1) : '0'}%`, icon: _jsx(Cpu, { className: "w-4 h-4 text-amber-400" }) }), _jsx(SummaryKPI, { label: "Active Models", value: `v${nodes.find(n => n.status === 'online')?.model_version || '—'}`, icon: _jsx(Server, { className: "w-4 h-4 text-purple-400" }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: [nodes.map((node) => (_jsx(EdgeNodeCard, { node: node }, node.id))), nodes.length === 0 && (_jsxs("div", { className: "col-span-full flex flex-col items-center justify-center py-20 text-slate-500", children: [_jsx(Server, { className: "w-12 h-12 opacity-20 mb-3" }), _jsx("p", { className: "text-sm font-medium", children: "No edge nodes registered" }), _jsx("p", { className: "text-xs text-slate-600 mt-1", children: "Ensure the backend API is running" })] }))] })] }));
}
// ─── Summary KPI ────────────────────────────────────────────
function SummaryKPI({ label, value, icon }) {
    return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 shrink-0", children: icon }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[10px] text-slate-500 font-medium", children: label }), _jsx("p", { className: "text-lg font-bold text-white truncate", children: value })] })] }));
}
