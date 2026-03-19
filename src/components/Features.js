import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Cpu, BellRing, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
const features = [
    {
        icon: _jsx(Cpu, { className: "w-8 h-8 text-neon-blue" }),
        title: 'Real-Time Edge AI',
        description: 'Processes heavy video streams locally on edge devices using optimized Vision Transformers. Bypasses cloud latency completely for instantaneous responses.',
    },
    {
        icon: _jsx(BellRing, { className: "w-8 h-8 text-neon-purple" }),
        title: 'Smart Alerts',
        description: 'Automated triggers configured for SMS, Email, or App notifications. Alerts are dispatched the exact millisecond an anomaly is classified.',
    },
    {
        icon: _jsx(BrainCircuit, { className: "w-8 h-8 text-emerald-400" }),
        title: 'Adaptive Learning',
        description: 'The system continuously improves through human-in-the-loop feedback, adapting to new types of anomalies dynamically without requiring full model retrains.',
    },
];
export default function Features() {
    return (_jsxs("section", { id: "features", className: "py-24 relative overflow-hidden", children: [_jsxs("div", { className: "container mx-auto px-6 md:px-12 relative z-10", children: [_jsxs("div", { className: "text-center mb-16 max-w-2xl mx-auto", children: [_jsxs("h2", { className: "text-3xl md:text-5xl font-bold mb-6", children: ["Intelligence at the ", _jsx("span", { className: "text-neon-blue text-glow", children: "Extreme Edge" })] }), _jsx("p", { className: "text-slate-400 text-lg", children: "VisionAIoT eliminates cloud dependency, offering unparalleled speed and privacy for your most critical security and monitoring needs." })] }), _jsx("div", { className: "grid md:grid-cols-3 gap-8", children: features.map((feature, idx) => (_jsxs(motion.div, { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: idx * 0.2 }, className: "glass-card p-8 hover:-translate-y-2 transition-transform duration-300 group", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-slate-800 transition-all", children: feature.icon }), _jsx("h3", { className: "text-2xl font-semibold text-white mb-4", children: feature.title }), _jsx("p", { className: "text-slate-400 leading-relaxed", children: feature.description })] }, idx))) })] }), _jsx("div", { className: "absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-neon-purple/10 blur-[100px] -z-10 rounded-full" }), _jsx("div", { className: "absolute right-0 top-1/4 w-96 h-96 bg-neon-blue/10 blur-[120px] -z-10 rounded-full" })] }));
}
