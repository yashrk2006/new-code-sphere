import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Shield, Key, Users, Activity, Trash2, Plus, Lock, Eye, UserCheck, Clock, ExternalLink, Copy, AlertTriangle, CheckCircle2, XCircle, RefreshCw, } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InviteUserModal from '../../components/InviteUserModal';
import { getApiUrl } from '../../utils/api';
const TABS = [
    { key: 'users', label: 'User Management', icon: _jsx(Users, { className: "w-4 h-4" }) },
    { key: 'audit', label: 'Audit Trail', icon: _jsx(Activity, { className: "w-4 h-4" }) },
    { key: 'tokens', label: 'API & Edge Tokens', icon: _jsx(Key, { className: "w-4 h-4" }) },
];
const ROLE_STYLES = {
    Admin: { bg: 'bg-purple-500/15', text: 'text-purple-400', icon: _jsx(Shield, { className: "w-3 h-3" }) },
    Operator: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: _jsx(UserCheck, { className: "w-3 h-3" }) },
    Viewer: { bg: 'bg-slate-500/15', text: 'text-slate-400', icon: _jsx(Eye, { className: "w-3 h-3" }) },
};
export default function SecurityDashboard() {
    const [activeTab, setActiveTab] = useState('users');
    const queryClient = useQueryClient();
    // ─── Users ──────────────────────────────────────────────────
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['security_users'],
        queryFn: async () => (await axios.get(getApiUrl('/security/users'))).data,
        enabled: activeTab === 'users',
    });
    const deleteUserMutation = useMutation({
        mutationFn: (userId) => axios.delete(getApiUrl(`/security/users/${userId}`)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security_users'] });
            queryClient.invalidateQueries({ queryKey: ['security_logs'] });
        },
    });
    // ─── Audit Logs ─────────────────────────────────────────────
    const { data: logs, isLoading: logsLoading } = useQuery({
        queryKey: ['security_logs'],
        queryFn: async () => (await axios.get(getApiUrl('/security/logs'))).data,
        enabled: activeTab === 'audit',
        refetchInterval: 5000, // Fetch every 5s for "live" system events
    });
    // ─── Tokens ─────────────────────────────────────────────────
    const { data: tokens, isLoading: tokensLoading } = useQuery({
        queryKey: ['security_tokens'],
        queryFn: async () => (await axios.get(getApiUrl('/security/tokens'))).data,
        enabled: activeTab === 'tokens',
    });
    const [newlyGeneratedToken, setNewlyGeneratedToken] = useState(null);
    const createTokenMutation = useMutation({
        mutationFn: () => axios.post(getApiUrl('/security/tokens'), { name: `CAM-Node-${Math.floor(Math.random() * 100)}`, scopes: ['inference:push', 'heartbeat:send'] }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['security_tokens'] });
            queryClient.invalidateQueries({ queryKey: ['security_logs'] });
            if (response.data.plain_token) {
                setNewlyGeneratedToken(response.data.plain_token);
            }
        },
    });
    const revokeTokenMutation = useMutation({
        mutationFn: (id) => axios.delete(getApiUrl(`/security/tokens/${id}`)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security_tokens'] });
            queryClient.invalidateQueries({ queryKey: ['security_logs'] });
        },
    });
    return (_jsxs("div", { className: "p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto", children: [_jsx("div", { className: "flex flex-col sm:flex-row sm:items-end justify-between gap-4", children: _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Lock, { className: "w-4 h-4 text-emerald-400" }), _jsx("span", { className: "text-xs font-medium text-emerald-400 tracking-wider uppercase", children: "Security Center" })] }), _jsx("h1", { className: "text-2xl sm:text-3xl font-bold tracking-tight text-white", children: "Security & Access Control" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Manage users, review audit logs, and configure edge device authentication." })] }) }), _jsx("div", { className: "flex gap-1 bg-[#040D21] border border-slate-800 rounded-xl p-1", children: TABS.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.key), className: `flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`, children: [tab.icon, tab.label] }, tab.key))) }), _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2 }, className: "bg-[#040D21] border border-slate-800 rounded-2xl overflow-hidden", children: [activeTab === 'users' && _jsx(UsersPanel, { users: users, loading: usersLoading, onDelete: (id) => deleteUserMutation.mutate(id) }), activeTab === 'audit' && _jsx(AuditPanel, { logs: logs, loading: logsLoading }), activeTab === 'tokens' && (_jsx(TokensPanel, { tokens: tokens, loading: tokensLoading, onGenerate: () => createTokenMutation.mutate(), onRevoke: (id) => revokeTokenMutation.mutate(id), isGenerating: createTokenMutation.isPending, generatedToken: newlyGeneratedToken, clearGeneratedToken: () => setNewlyGeneratedToken(null) }))] }, activeTab) })] }));
}
// ─── Users Panel ────────────────────────────────────────────
function UsersPanel({ users, loading, onDelete }) {
    const [isModalOpen, setModalOpen] = useState(false);
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-bold text-white", children: "Registered Personnel" }), _jsxs("p", { className: "text-[11px] text-slate-500 mt-0.5", children: [users?.length ?? 0, " accounts in system"] })] }), _jsxs("button", { onClick: () => setModalOpen(true), className: "bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), " Invite User"] })] }), loading ? (_jsx(LoadingSpinner, { text: "Loading user database..." })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-800", children: [_jsx("th", { className: "pb-3 pl-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold", children: "Email" }), _jsx("th", { className: "pb-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold", children: "Role" }), _jsx("th", { className: "pb-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold", children: "Joined" }), _jsx("th", { className: "pb-3 text-right pr-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold", children: "Actions" })] }) }), _jsx("tbody", { children: users?.map((u) => {
                                const role = ROLE_STYLES[u.role];
                                return (_jsxs("tr", { className: "border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors group", children: [_jsx("td", { className: "py-3.5 pl-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-700", children: u.email[0].toUpperCase() }), _jsx("span", { className: "text-sm font-medium text-white", children: u.email })] }) }), _jsx("td", { className: "py-3.5", children: _jsxs("span", { className: `inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${role.bg} ${role.text}`, children: [role.icon, " ", u.role] }) }), _jsx("td", { className: "py-3.5 text-xs text-slate-500", children: new Date(u.created_at).toLocaleDateString() }), _jsx("td", { className: "py-3.5 text-right pr-3", children: _jsx("button", { onClick: () => onDelete(u.id), disabled: u.role === 'Admin', className: "p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed", title: u.role === 'Admin' ? 'Cannot revoke admin' : 'Revoke Access', children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) }) })] }, u.id));
                            }) })] }) })), _jsx(InviteUserModal, { isOpen: isModalOpen, onClose: () => setModalOpen(false) })] }));
}
// ─── Audit Log Panel ────────────────────────────────────────
const ACTION_ICONS = {
    Success: { icon: _jsx(CheckCircle2, { className: "w-4 h-4" }), color: 'text-emerald-400' },
    Failed: { icon: _jsx(XCircle, { className: "w-4 h-4" }), color: 'text-red-400' },
    Revoked: { icon: _jsx(AlertTriangle, { className: "w-4 h-4" }), color: 'text-amber-400' },
    Restart: { icon: _jsx(RefreshCw, { className: "w-4 h-4" }), color: 'text-blue-400' },
    Updated: { icon: _jsx(CheckCircle2, { className: "w-4 h-4" }), color: 'text-blue-400' },
    Generated: { icon: _jsx(Key, { className: "w-4 h-4" }), color: 'text-purple-400' },
    Registered: { icon: _jsx(UserCheck, { className: "w-4 h-4" }), color: 'text-emerald-400' },
    Pushed: { icon: _jsx(ExternalLink, { className: "w-4 h-4" }), color: 'text-cyan-400' },
    Offline: { icon: _jsx(XCircle, { className: "w-4 h-4" }), color: 'text-red-400' },
};
function getActionStyle(action) {
    for (const [key, style] of Object.entries(ACTION_ICONS)) {
        if (action.includes(key))
            return style;
    }
    return { icon: _jsx(Activity, { className: "w-4 h-4" }), color: 'text-slate-400' };
}
function AuditPanel({ logs, loading }) {
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-sm font-bold text-white", children: "Recent Security Events" }), _jsx("p", { className: "text-[11px] text-slate-500 mt-0.5", children: "System-wide activity log \u2014 immutable audit trail" })] }), loading ? (_jsx(LoadingSpinner, { text: "Fetching audit trail..." })) : (_jsx("div", { className: "space-y-2", children: logs?.map((log, i) => {
                    const style = getActionStyle(log.action);
                    return (_jsxs(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay: i * 0.03 }, className: "flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-700 transition-colors", children: [_jsx("div", { className: `w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 ${style.color}`, children: style.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white truncate", children: log.action }), _jsxs("p", { className: "text-[10px] text-slate-500 mt-0.5", children: [_jsx("span", { className: "text-slate-400", children: log.actor_email }), _jsx("span", { className: "mx-1.5", children: "\u2022" }), _jsx("span", { className: "font-mono", children: log.ip_address })] })] }), _jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-slate-600 shrink-0", children: [_jsx(Clock, { className: "w-3 h-3" }), timeAgo(log.timestamp)] })] }, log.id));
                }) }))] }));
}
// ─── Tokens Panel ───────────────────────────────────────────
function TokensPanel({ tokens, loading, onGenerate, onRevoke, isGenerating, generatedToken, clearGeneratedToken }) {
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-bold text-white", children: "Edge Device Authentication" }), _jsx("p", { className: "text-[11px] text-slate-500 mt-0.5", children: "API keys used by Jetson Nanos to push inference data" })] }), !generatedToken && (_jsxs("button", { onClick: onGenerate, disabled: isGenerating, className: "bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50", children: [isGenerating ? _jsx(RefreshCw, { className: "w-3.5 h-3.5 animate-spin" }) : _jsx(Plus, { className: "w-3.5 h-3.5" }), "Generate Token"] }))] }), generatedToken && (_jsxs("div", { className: "mb-6 bg-slate-900 border border-emerald-500/30 p-4 rounded-xl shadow-lg shadow-emerald-500/5", children: [_jsx("label", { className: "text-[10px] text-emerald-400 uppercase font-bold tracking-wider mb-2 block", children: "Your Edge Token (Copy this to your Python script)" }), _jsxs("div", { className: "bg-black p-3 rounded-lg border border-slate-700 font-mono text-xs text-emerald-500 break-all mb-3 relative group", children: [generatedToken, _jsx("button", { className: "absolute top-2 right-2 p-1.5 bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700", onClick: () => navigator.clipboard.writeText(generatedToken), children: _jsx(Copy, { className: "w-3.5 h-3.5 text-slate-400" }) })] }), _jsx("button", { onClick: clearGeneratedToken, className: "text-slate-500 text-xs hover:text-white transition-colors underline", children: "Clear view" })] })), loading ? (_jsx(LoadingSpinner, { text: "Loading edge tokens..." })) : (_jsx("div", { className: "space-y-3", children: tokens?.map((token) => (_jsxs("div", { className: `flex items-center gap-4 border rounded-xl px-5 py-4 transition-colors ${token.status === 'revoked'
                        ? 'bg-red-500/5 border-red-500/20 opacity-50'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`, children: [_jsx("div", { className: `w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${token.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`, children: _jsx(Key, { className: "w-4 h-4" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-sm font-bold text-white", children: token.name }), _jsx("span", { className: `text-[9px] font-bold px-1.5 py-0.5 rounded-lg uppercase ${token.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`, children: token.status })] }), _jsxs("div", { className: "flex items-center gap-3 mt-1", children: [_jsx("span", { className: "text-[10px] font-mono text-slate-500", children: token.token_prefix }), _jsxs("span", { className: "text-[10px] text-slate-600", children: ["Scopes: ", token.scopes.join(', ')] })] }), _jsxs("div", { className: "flex items-center gap-3 text-[10px] text-slate-600 mt-0.5", children: [_jsxs("span", { children: ["Created: ", new Date(token.created_at).toLocaleDateString()] }), _jsxs("span", { children: ["Last used: ", token.last_used ? timeAgo(token.last_used) : 'Never'] })] })] }), _jsxs("div", { className: "flex gap-1.5 shrink-0", children: [_jsx("button", { className: "p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors", title: "Copy Token ID", children: _jsx(Copy, { className: "w-3.5 h-3.5" }) }), token.status === 'active' && (_jsx("button", { onClick: () => onRevoke(token.id), className: "p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors", title: "Revoke Token", children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) }))] })] }, token.id))) }))] }));
}
// ─── Shared Helpers ─────────────────────────────────────────
function LoadingSpinner({ text }) {
    return (_jsxs("div", { className: "flex items-center justify-center py-16 gap-3", children: [_jsx("div", { className: "w-5 h-5 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin" }), _jsx("span", { className: "text-sm text-slate-500", children: text })] }));
}
function timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)
        return 'Just now';
    if (mins < 60)
        return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
