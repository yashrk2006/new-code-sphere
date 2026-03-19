import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Server, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
// Generates smooth random data for the chart
const generateData = () => {
    return Array.from({ length: 20 }, (_, i) => ({
        time: i,
        inference: Math.floor(Math.random() * 20) + 80,
        latency: Math.floor(Math.random() * 5) + 2,
    }));
};
export default function MonitoringNodeDemo() {
    const [data, setData] = useState(generateData());
    useEffect(() => {
        const interval = setInterval(() => {
            setData((prev) => {
                const newData = [...prev.slice(1)];
                newData.push({
                    time: prev[prev.length - 1].time + 1,
                    inference: Math.floor(Math.random() * 20) + 80,
                    latency: Math.floor(Math.random() * 5) + 2,
                });
                return newData;
            });
        }, 1500);
        return () => clearInterval(interval);
    }, []);
    return (_jsx("section", { id: "demo", className: "py-24 relative", children: _jsxs("div", { className: "container mx-auto px-6 md:px-12", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsxs("h2", { className: "text-3xl md:text-5xl font-bold mb-4", children: ["Live Node ", _jsx("span", { className: "text-neon-purple text-glow", children: "Telemetry" })] }), _jsx("p", { className: "text-slate-400", children: "Real-time inference metrics from active edge deployment." })] }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "glass-card overflow-hidden border-slate-700 max-w-5xl mx-auto", children: [_jsxs("div", { className: "bg-slate-900 border-b border-slate-800 p-6 flex flex-wrap gap-4 items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" }), _jsx("h3", { className: "font-semibold text-lg", children: "vision-aiot-monitoring-node-alpha" })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700", children: [_jsx(Server, { className: "w-4 h-4 text-emerald-400" }), _jsx("span", { className: "text-slate-300", children: "Nodes: 14/14 Active" })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700", children: [_jsx(Zap, { className: "w-4 h-4 text-neon-blue" }), _jsx("span", { className: "text-slate-300", children: "Avg Latency: 4ms" })] })] })] }), _jsxs("div", { className: "p-6 md:p-8 grid md:grid-cols-3 gap-8", children: [_jsxs("div", { className: "col-span-2 space-y-6", children: [_jsxs("h4", { className: "text-sm font-medium text-slate-400 flex items-center gap-2", children: [_jsx(ActivityIcon, {}), " Inference Throughput (FPS)"] }), _jsx("div", { className: "h-64 w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: data, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorInference", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#00f0ff", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#00f0ff", stopOpacity: 0 })] }) }), _jsx(XAxis, { dataKey: "time", hide: true }), _jsx(YAxis, { stroke: "#475569", fontSize: 12, domain: ['auto', 'auto'] }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }, itemStyle: { color: '#00f0ff' }, labelStyle: { display: 'none' } }), _jsx(Area, { type: "monotone", dataKey: "inference", stroke: "#00f0ff", fillOpacity: 1, fill: "url(#colorInference)", strokeWidth: 2, isAnimationActive: false })] }) }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h4", { className: "text-sm font-medium text-slate-400 mb-4", children: "Latest Detections" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex gap-4 items-start", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-amber-500 shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-200", children: "Unrecognized Object" }), _jsx("p", { className: "text-xs text-slate-500", children: "Node-7 \u2022 2s ago" })] })] }), _jsxs("div", { className: "bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex gap-4 items-start", children: [_jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-500 shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-200", children: "Zone Cleared" }), _jsx("p", { className: "text-xs text-slate-500", children: "Node-3 \u2022 14s ago" })] })] }), _jsxs("div", { className: "bg-slate-800/30 border border-emerald-500/20 rounded-xl p-4 flex gap-4 items-start", children: [_jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-500 shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-200", children: "System Nominal" }), _jsx("p", { className: "text-xs text-slate-500", children: "All Nodes \u2022 45s ago" })] })] })] })] })] })] })] }) }));
}
function ActivityIcon() {
    return (_jsx("svg", { className: "w-4 h-4 text-neon-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" }) }));
}
