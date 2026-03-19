import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
// Simple mock login for the demo
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        // Simulate network delay
        setTimeout(() => {
            // Very basic validation for the demo
            if (email === 'admin@visionaiot.com' && password === 'admin') {
                const mockUser = { id: 'usr_1', email: 'admin@visionaiot.com', role: 'Admin' };
                // In a real app, this token would come from your backend
                const mockToken = 'mock_jwt_token_for_demo';
                setAuth(mockUser, mockToken);
                navigate('/dashboard');
            }
            else {
                setError('Invalid credentials. Use admin@visionaiot.com / admin');
                setIsLoading(false);
            }
        }, 800);
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#0B0F19] text-white flex flex-col md:flex-row font-sans selection:bg-blue-500/30 selection:text-white", children: [_jsxs("div", { className: "hidden md:flex flex-col justify-between w-1/2 bg-[#060A12] border-r border-slate-800 p-12 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" }), _jsx("div", { className: "absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-center gap-3 mb-16", children: [_jsx("div", { className: "p-2 bg-blue-600 rounded-lg", children: _jsx(Video, { size: 24, className: "text-white" }) }), _jsx("span", { className: "text-2xl font-bold tracking-tight", children: "VisionAIoT" })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, children: [_jsxs("h1", { className: "text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6", children: ["Command Core ", _jsx("br", {}), _jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400", children: "Access Gateway" })] }), _jsx("p", { className: "text-slate-400 text-lg max-w-md", children: "Secure authentication portal for the city-scale intelligence and anomaly detection infrastructure." })] })] }), _jsxs("div", { className: "relative z-10 flex items-center gap-4 text-sm text-slate-500", children: [_jsx(ShieldCheck, { size: 20, className: "text-emerald-500" }), _jsx("span", { children: "AES-256 Encrypted Connection" })] })] }), _jsx("div", { className: "flex-1 flex items-center justify-center p-6 md:p-12 relative", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "flex md:hidden items-center gap-3 mb-10 justify-center", children: [_jsx("div", { className: "p-2 bg-blue-600 rounded-lg", children: _jsx(Video, { size: 20, className: "text-white" }) }), _jsx("span", { className: "text-xl font-bold tracking-tight", children: "VisionAIoT" })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 }, className: "bg-[#111623] border border-slate-800 rounded-2xl p-8 shadow-2xl", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: "Operator Login" }), _jsx("p", { className: "text-sm text-slate-400", children: "Enter your credentials to access the command center." })] }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-6", children: [error && (_jsxs("div", { className: "bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3", children: [_jsx(AlertCircle, { size: 18, className: "text-red-400 shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-red-400 font-medium leading-tight", children: error })] })), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider block", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "admin@visionaiot.com", className: "w-full bg-[#0B0F19] text-white text-sm border border-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider block flex justify-between", children: [_jsx("span", { children: "Password" }), _jsx("a", { href: "#", className: "text-blue-400 hover:text-blue-300 transition-colors", children: "Forgot?" })] }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "w-full bg-[#0B0F19] text-white text-sm border border-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors", required: true })] })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-70 disabled:cursor-not-allowed group", children: isLoading ? (_jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: ["Initialize Session", _jsx(ArrowRight, { size: 18, className: "group-hover:translate-x-1 transition-transform" })] })) })] }), _jsxs("div", { className: "mt-8 pt-6 border-t border-slate-800 text-center", children: [_jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Demo Access" }), _jsx("p", { className: "text-xs text-slate-600 mt-1 font-mono", children: "admin@visionaiot.com / admin" })] })] })] }) })] }));
}
