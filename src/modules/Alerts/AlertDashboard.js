import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useAlertStore } from '../../store/useAlertStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Clock, CheckCircle, XCircle, Search, Filter, Eye, ChevronDown, Siren, Camera } from 'lucide-react';
// ─── Severity badge colors ──────────────────────────────────
const SEVERITY_STYLES = {
    Critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' },
    Medium: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' },
    Low: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500' },
};
const STATUS_STYLES = {
    Pending: { bg: 'bg-slate-600', text: 'text-slate-200', icon: _jsx(Clock, { className: "w-3 h-3" }) },
    Investigating: { bg: 'bg-blue-600', text: 'text-blue-100', icon: _jsx(Eye, { className: "w-3 h-3" }) },
    Resolved: { bg: 'bg-emerald-600', text: 'text-emerald-100', icon: _jsx(CheckCircle, { className: "w-3 h-3" }) },
    'False Positive': { bg: 'bg-slate-700', text: 'text-slate-300', icon: _jsx(XCircle, { className: "w-3 h-3" }) },
};
const TYPE_LABELS = {
    PARKING_VIOLATION: 'Parking Violation',
    CAPACITY_EXCEEDED: 'Capacity Exceeded',
    UNAUTHORIZED_VEHICLE: 'Unauthorized Vehicle',
    SUSPICIOUS_BEHAVIOR: 'Suspicious Behavior',
};
export default function AlertDashboard() {
    const { alerts, updateAlertStatus } = useAlertStore();
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [editNotes, setEditNotes] = useState('');
    const [editStatus, setEditStatus] = useState('Investigating');
    const [saving, setSaving] = useState(false);
    // Filters
    const [severityFilter, setSeverityFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    // When selecting an alert, pre-fill the form
    useEffect(() => {
        if (selectedAlert) {
            setEditNotes(selectedAlert.operator_notes || '');
            setEditStatus(selectedAlert.status === 'Pending' ? 'Investigating' : selectedAlert.status);
        }
    }, [selectedAlert]);
    // Keep selected alert in sync with live updates
    useEffect(() => {
        if (selectedAlert) {
            const updated = alerts.find((a) => a.id === selectedAlert.id);
            if (updated && updated.status !== selectedAlert.status) {
                setSelectedAlert(updated);
            }
        }
    }, [alerts, selectedAlert]);
    // Filter logic
    const filteredAlerts = useMemo(() => {
        return alerts.filter((a) => {
            if (severityFilter !== 'All' && a.severity !== severityFilter)
                return false;
            if (statusFilter !== 'All' && a.status !== statusFilter)
                return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (a.type.toLowerCase().includes(q) ||
                    a.camera_id.toLowerCase().includes(q) ||
                    (a.operator_notes || '').toLowerCase().includes(q));
            }
            return true;
        });
    }, [alerts, severityFilter, statusFilter, searchQuery]);
    const pendingCount = alerts.filter((a) => a.status === 'Pending').length;
    const criticalCount = alerts.filter((a) => a.severity === 'Critical' && a.status === 'Pending').length;
    const handleSave = async () => {
        if (!selectedAlert)
            return;
        setSaving(true);
        await updateAlertStatus(selectedAlert.id, editStatus, editNotes);
        setSaving(false);
        setSelectedAlert(null);
    };
    return (_jsxs("div", { className: "flex h-full bg-[#020617] text-slate-50 overflow-hidden", children: [_jsxs("div", { className: `${selectedAlert ? 'w-2/3' : 'w-full'} flex flex-col transition-all duration-300`, children: [_jsxs("div", { className: "p-6 pb-0 space-y-5", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-end justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-red-500 animate-pulse" }), _jsx("span", { className: "text-xs font-medium text-red-400 tracking-wider uppercase", children: "Live Alert Feed" })] }), _jsxs("h1", { className: "text-2xl font-bold tracking-tight text-white flex items-center gap-3", children: [_jsx(Siren, { className: "w-6 h-6 text-red-400" }), "Anomaly Alerts"] }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Real-time anomaly detection events from edge inference nodes." })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20", children: _jsxs("span", { className: "text-xs font-bold text-red-400", children: [criticalCount, " Critical"] }) }), _jsx("div", { className: "px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700", children: _jsxs("span", { className: "text-xs font-bold text-slate-300", children: [pendingCount, " Pending"] }) })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all flex-1 min-w-[200px] max-w-sm", children: [_jsx(Search, { className: "w-4 h-4 text-slate-500 mr-2 shrink-0" }), _jsx("input", { type: "text", placeholder: "Search alerts...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 w-full" })] }), _jsxs("div", { className: "relative group", children: [_jsxs("select", { value: severityFilter, onChange: (e) => setSeverityFilter(e.target.value), className: "appearance-none bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 pr-8 cursor-pointer hover:border-slate-700 transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none", children: [_jsx("option", { value: "All", children: "All Severity" }), _jsx("option", { value: "Critical", children: "Critical" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "Low", children: "Low" })] }), _jsx(ChevronDown, { className: "w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" })] }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "appearance-none bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 pr-8 cursor-pointer hover:border-slate-700 transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none", children: [_jsx("option", { value: "All", children: "All Status" }), _jsx("option", { value: "Pending", children: "Pending" }), _jsx("option", { value: "Investigating", children: "Investigating" }), _jsx("option", { value: "Resolved", children: "Resolved" }), _jsx("option", { value: "False Positive", children: "False Positive" })] }), _jsx(ChevronDown, { className: "w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" })] }), _jsxs("div", { className: "flex items-center gap-1.5 text-slate-500 text-xs ml-auto", children: [_jsx(Filter, { className: "w-3.5 h-3.5" }), _jsxs("span", { children: [filteredAlerts.length, " results"] })] })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 pt-4 space-y-2", children: [filteredAlerts.length === 0 && (_jsxs("div", { className: "h-64 flex flex-col items-center justify-center text-slate-500", children: [_jsx(Shield, { className: "w-10 h-10 opacity-20 mb-3" }), _jsx("p", { className: "text-sm font-medium", children: "No matching anomalies." }), _jsx("p", { className: "text-xs opacity-60 mt-1", children: "System is monitoring all zones securely." })] })), _jsx(AnimatePresence, { mode: "popLayout", children: filteredAlerts.map((alert) => {
                                    const sev = SEVERITY_STYLES[alert.severity];
                                    const st = STATUS_STYLES[alert.status];
                                    const isSelected = selectedAlert?.id === alert.id;
                                    return (_jsxs(motion.div, { layout: true, initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.25 }, onClick: () => setSelectedAlert(alert), className: `p-4 rounded-xl cursor-pointer flex items-center gap-4 border transition-all duration-200 group
                    ${isSelected
                                            ? 'bg-blue-600/10 border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.08)]'
                                            : alert.severity === 'Critical' && alert.status === 'Pending'
                                                ? `${sev.bg} ${sev.border} hover:border-red-500/50`
                                                : 'bg-[#040D21] border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'}
                  `, children: [_jsx("div", { className: `w-2.5 h-2.5 rounded-full shrink-0 ${sev.dot} ${alert.severity === 'Critical' && alert.status === 'Pending' ? 'animate-pulse' : ''}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-sm font-bold text-white truncate", children: TYPE_LABELS[alert.type] || alert.type }), _jsx("span", { className: `text-[10px] font-bold px-1.5 py-0.5 rounded ${sev.bg} ${sev.text} border ${sev.border}`, children: alert.severity })] }), _jsxs("div", { className: "flex items-center gap-3 mt-1", children: [_jsxs("span", { className: "text-xs text-slate-500 flex items-center gap-1", children: [_jsx(Camera, { className: "w-3 h-3" }), " ", alert.camera_id] }), _jsxs("span", { className: "text-xs text-emerald-400 font-mono", children: [(alert.confidence).toFixed(1), "% conf"] })] })] }), _jsxs("div", { className: "text-right shrink-0 flex flex-col items-end gap-1.5", children: [_jsxs("span", { className: `inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`, children: [st.icon, " ", alert.status] }), _jsx("p", { className: "text-[11px] font-mono text-slate-500", children: new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })] })] }, alert.id));
                                }) })] })] }), _jsx(AnimatePresence, { children: selectedAlert && (_jsxs(motion.div, { initial: { opacity: 0, x: 40, width: 0 }, animate: { opacity: 1, x: 0, width: '33.333%' }, exit: { opacity: 0, x: 40, width: 0 }, transition: { type: 'spring', damping: 25, stiffness: 250 }, className: "border-l border-slate-800 bg-[#040D21] flex flex-col overflow-hidden", children: [_jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-lg font-bold text-white flex items-center gap-2", children: [_jsx(AlertTriangle, { className: `w-5 h-5 ${SEVERITY_STYLES[selectedAlert.severity].text}` }), "Alert Details"] }), _jsx("button", { onClick: () => setSelectedAlert(null), className: "p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors", children: _jsx(XCircle, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "relative rounded-xl overflow-hidden border border-slate-800 group", children: [_jsx("img", { src: selectedAlert.image_url, alt: "Anomaly Snapshot", className: "w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" }), _jsx("div", { className: "absolute top-3 left-3 flex gap-2", children: _jsx("span", { className: `text-[10px] font-bold px-2 py-1 rounded-lg ${SEVERITY_STYLES[selectedAlert.severity].bg} ${SEVERITY_STYLES[selectedAlert.severity].text} border ${SEVERITY_STYLES[selectedAlert.severity].border} backdrop-blur-md`, children: selectedAlert.severity }) }), _jsx("div", { className: "absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10", children: _jsxs("span", { className: "text-[10px] font-mono text-emerald-400", children: [selectedAlert.confidence.toFixed(1), "% confidence"] }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "bg-slate-900/50 rounded-xl p-3 border border-slate-800", children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-semibold", children: "Type" }), _jsx("p", { className: "text-sm font-medium text-white mt-1", children: TYPE_LABELS[selectedAlert.type] })] }), _jsxs("div", { className: "bg-slate-900/50 rounded-xl p-3 border border-slate-800", children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-semibold", children: "Camera" }), _jsxs("p", { className: "text-sm font-medium text-white mt-1 flex items-center gap-1", children: [_jsx(Camera, { className: "w-3.5 h-3.5 text-blue-400" }), " ", selectedAlert.camera_id] })] }), _jsxs("div", { className: "bg-slate-900/50 rounded-xl p-3 border border-slate-800", children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-semibold", children: "Detected At" }), _jsx("p", { className: "text-sm font-mono text-white mt-1", children: new Date(selectedAlert.timestamp).toLocaleTimeString() })] }), _jsxs("div", { className: "bg-slate-900/50 rounded-xl p-3 border border-slate-800", children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-semibold", children: "Event ID" }), _jsx("p", { className: "text-[11px] font-mono text-slate-400 mt-1 truncate", children: selectedAlert.id })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2 block", children: "Update Status" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: ['Investigating', 'Resolved', 'False Positive', 'Pending'].map((s) => {
                                                const st = STATUS_STYLES[s];
                                                const isActive = editStatus === s;
                                                return (_jsxs("button", { onClick: () => setEditStatus(s), className: `flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border transition-all duration-200
                          ${isActive
                                                        ? `${st.bg} ${st.text} border-transparent shadow-lg`
                                                        : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'}
                        `, children: [st.icon, " ", s] }, s));
                                            }) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2 block", children: "Operator Notes" }), _jsx("textarea", { className: "w-full bg-slate-900 text-white text-sm p-3 rounded-xl border border-slate-800 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none resize-none", rows: 4, placeholder: "Enter details about this incident...", value: editNotes, onChange: (e) => setEditNotes(e.target.value) })] })] }), _jsxs("div", { className: "p-4 border-t border-slate-800 flex gap-3", children: [_jsx("button", { onClick: () => setSelectedAlert(null), className: "flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors border border-slate-700", children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: saving, className: "flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed", children: saving ? 'Saving...' : 'Save Changes' })] })] }, "detail-panel")) })] }));
}
