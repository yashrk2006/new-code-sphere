import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '../utils/api';
export default function InviteUserModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({ email: '', role: 'Operator' });
    const queryClient = useQueryClient();
    const inviteUserMutation = useMutation({
        mutationFn: (data) => axios.post(getApiUrl('/security/users/invite'), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security_users'] });
            queryClient.invalidateQueries({ queryKey: ['security_logs'] });
            setFormData({ email: '', role: 'Operator' }); // reset
            onClose();
        },
    });
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-[#040D21] border border-slate-800 p-6 rounded-xl w-96 shadow-2xl", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Invite New Personnel" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-slate-400 uppercase font-semibold", children: "Email Address" }), _jsx("input", { type: "email", className: "mt-1.5 w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all", placeholder: "user@organization.com", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-slate-400 uppercase font-semibold", children: "Assign Role" }), _jsxs("select", { className: "mt-1.5 w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all", value: formData.role, onChange: (e) => setFormData({ ...formData, role: e.target.value }), children: [_jsx("option", { value: "Operator", children: "Operator" }), _jsx("option", { value: "Viewer", children: "Viewer" }), _jsx("option", { value: "Admin", children: "Admin" })] })] })] }), _jsxs("div", { className: "flex gap-3 mt-8", children: [_jsx("button", { onClick: onClose, className: "flex-1 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-medium transition-colors", children: "Cancel" }), _jsx("button", { onClick: () => inviteUserMutation.mutate(formData), disabled: inviteUserMutation.isPending || !formData.email, className: "flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 disabled:opacity-50 transition-colors", children: inviteUserMutation.isPending ? 'Sending...' : 'Send Invite' })] })] }) }));
}
