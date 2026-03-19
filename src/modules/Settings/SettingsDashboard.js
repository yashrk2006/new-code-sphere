import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetSettings, useUpdateSettings, settingsSchema } from '../../hooks/useSettings';
import { Settings, BrainCircuit, Bell, Save, CheckCircle2, Sliders, Cpu, Mail, Smartphone, ShieldCheck, Pencil, Globe, RefreshCw, } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const TABS = [
    { key: 'ai', label: 'AI & Detection', icon: _jsx(BrainCircuit, { className: "w-4 h-4" }) },
    { key: 'notifications', label: 'Notifications', icon: _jsx(Bell, { className: "w-4 h-4" }) },
    { key: 'general', label: 'General', icon: _jsx(Settings, { className: "w-4 h-4" }) },
];
const MODEL_OPTIONS = [
    { value: 'yolov8n-general', label: 'YOLOv8 Nano — General Objects (High FPS)', desc: 'Best for general surveillance, low-latency edge devices' },
    { value: 'yolov8m-municipal-parking', label: 'YOLOv8 Medium — Municipal Parking', desc: 'Optimized for capacity enforcement & vehicle detection' },
    { value: 'yolov8s-campus-attendance', label: 'YOLOv8 Small — Campus Tracking', desc: 'Fine-tuned for pedestrian counting & attendance' },
];
export default function SettingsDashboard() {
    const [activeTab, setActiveTab] = useState('ai');
    const [showSuccess, setShowSuccess] = useState(false);
    const { data: currentSettings, isLoading } = useGetSettings();
    const updateMutation = useUpdateSettings();
    const { register, handleSubmit, reset, watch, formState: { errors, isDirty }, } = useForm({
        resolver: zodResolver(settingsSchema),
    });
    // Populate form when data arrives
    useEffect(() => {
        if (currentSettings)
            reset(currentSettings);
    }, [currentSettings, reset]);
    const onSubmit = (data) => {
        updateMutation.mutate(data, {
            onSuccess: () => {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                reset(data);
            },
        });
    };
    const thresholdValue = watch('aiConfidenceThreshold');
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-full bg-[#020617] text-white", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsxs("div", { className: "relative w-14 h-14", children: [_jsx("div", { className: "absolute inset-0 rounded-full border-2 border-slate-800" }), _jsx("div", { className: "absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" })] }), _jsx("p", { className: "text-sm font-medium", children: "Loading Configuration..." })] }) }));
    }
    return (_jsxs("div", { className: "p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Sliders, { className: "w-4 h-4 text-orange-400" }), _jsx("span", { className: "text-xs font-medium text-orange-400 tracking-wider uppercase", children: "Configuration" })] }), _jsx("h1", { className: "text-2xl sm:text-3xl font-bold tracking-tight text-white", children: "System Settings" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "AI thresholds, notification routing, and global preferences." })] }), _jsxs("div", { className: "flex flex-col md:flex-row gap-5", children: [_jsxs("div", { className: "w-full md:w-56 flex md:flex-col gap-1.5 shrink-0", children: [TABS.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.key), className: `flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left w-full ${activeTab === tab.key
                                    ? 'bg-slate-800 text-white border border-slate-700'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 border border-transparent'}`, children: [tab.icon, tab.label] }, tab.key))), isDirty && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-medium flex items-center gap-1.5", children: [_jsx(Pencil, { className: "w-3 h-3" }), " Unsaved changes"] }))] }), _jsx("div", { className: "flex-1 bg-[#040D21] border border-slate-800 rounded-2xl overflow-hidden", children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), children: [_jsx("div", { className: "p-6", children: _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.15 }, children: [activeTab === 'ai' && (_jsxs("div", { className: "space-y-6", children: [_jsx(SectionHeader, { icon: _jsx(Cpu, { className: "w-4 h-4 text-blue-400" }), title: "AI Inference Configuration" }), _jsxs("div", { children: [_jsx(FieldLabel, { children: "Active Neural Network Model" }), _jsx("div", { className: "space-y-2 mt-2", children: MODEL_OPTIONS.map((m) => (_jsxs("label", { className: `flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                ${watch('activeModel') === m.value
                                                                            ? 'bg-blue-500/10 border-blue-500/30'
                                                                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`, children: [_jsx("input", { type: "radio", value: m.value, ...register('activeModel'), className: "mt-0.5 accent-blue-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white", children: m.label }), _jsx("p", { className: "text-[10px] text-slate-500 mt-0.5", children: m.desc })] })] }, m.value))) }), errors.activeModel && _jsx(ErrorText, { children: errors.activeModel.message })] }), _jsxs("div", { children: [_jsxs(FieldLabel, { children: ["Global Confidence Threshold:", ' ', _jsxs("span", { className: `font-bold ${thresholdValue > 85 ? 'text-emerald-400'
                                                                                : thresholdValue > 50 ? 'text-blue-400'
                                                                                    : 'text-amber-400'}`, children: [thresholdValue, "%"] })] }), _jsxs("div", { className: "mt-3 px-1", children: [_jsx("input", { type: "range", min: "10", max: "99", ...register('aiConfidenceThreshold', { valueAsNumber: true }), className: "w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-blue-500" }), _jsxs("div", { className: "flex justify-between text-[9px] text-slate-600 mt-1", children: [_jsx("span", { children: "10% \u2014 More detections, more false positives" }), _jsx("span", { children: "99% \u2014 Only high-confidence results" })] })] }), errors.aiConfidenceThreshold && _jsx(ErrorText, { children: errors.aiConfidenceThreshold.message })] }), _jsx(ToggleField, { label: "Auto-Acknowledge Low Severity", description: "Automatically resolve alerts below the confidence threshold without operator review.", icon: _jsx(ShieldCheck, { className: "w-4 h-4 text-emerald-400" }), register: register('autoAcknowledgeLowSeverity') })] })), activeTab === 'notifications' && (_jsxs("div", { className: "space-y-6", children: [_jsx(SectionHeader, { icon: _jsx(Bell, { className: "w-4 h-4 text-amber-400" }), title: "Alert Routing" }), _jsx(ToggleField, { label: "Critical Email Alerts", description: "Dispatch emails to operators immediately upon critical anomalies.", icon: _jsx(Mail, { className: "w-4 h-4 text-blue-400" }), register: register('enableEmailAlerts') }), _jsx(ToggleField, { label: "Browser Push Notifications", description: "Show native OS notifications even when the dashboard is minimized.", icon: _jsx(Smartphone, { className: "w-4 h-4 text-purple-400" }), register: register('enablePushNotifications') })] })), activeTab === 'general' && (_jsxs("div", { className: "space-y-6", children: [_jsx(SectionHeader, { icon: _jsx(Globe, { className: "w-4 h-4 text-cyan-400" }), title: "General Preferences" }), _jsxs("div", { children: [_jsx(FieldLabel, { children: "System Name" }), _jsx("input", { type: "text", ...register('systemName'), className: "w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors", placeholder: "e.g. VisionAIoT Campus Alpha" }), errors.systemName && _jsx(ErrorText, { children: errors.systemName.message }), _jsx("p", { className: "text-[10px] text-slate-600 mt-1", children: "Displayed in the dashboard header and exported reports." })] })] }))] }, activeTab) }) }), _jsxs("div", { className: "px-6 py-4 border-t border-slate-800 bg-slate-900/20 flex items-center justify-between", children: [_jsx(AnimatePresence, { children: showSuccess && (_jsxs(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0 }, className: "flex items-center gap-1.5 text-emerald-400 text-xs font-medium", children: [_jsx(CheckCircle2, { className: "w-4 h-4" }), "Configuration saved and synced with edge nodes."] })) }), !showSuccess && _jsx("div", {}), _jsx("button", { type: "submit", disabled: !isDirty || updateMutation.isPending, className: "bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-1.5 transition-all", children: updateMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-3.5 h-3.5 animate-spin" }), " Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-3.5 h-3.5" }), " Save Configuration"] })) })] })] }) })] })] }));
}
// ─── Sub-Components ─────────────────────────────────────────
function SectionHeader({ icon, title }) {
    return (_jsxs("div", { className: "flex items-center gap-2 pb-3 border-b border-slate-800 mb-4", children: [icon, _jsx("h2", { className: "text-sm font-bold text-white", children: title })] }));
}
function FieldLabel({ children }) {
    return _jsx("label", { className: "text-xs font-medium text-slate-400 block", children: children });
}
function ErrorText({ children }) {
    return _jsx("p", { className: "text-red-400 text-[11px] mt-1", children: children });
}
function ToggleField({ label, description, icon, register: reg, }) {
    return (_jsxs("label", { className: "flex items-start gap-3.5 p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors cursor-pointer", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5", children: icon }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-white", children: label }), _jsx("p", { className: "text-[10px] text-slate-500 mt-0.5", children: description })] }), _jsx("input", { type: "checkbox", ...reg, className: "w-5 h-5 accent-blue-500 mt-1 shrink-0 cursor-pointer" })] }));
}
