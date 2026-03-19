import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiUrl, getSocketUrl } from '../../utils/api';
export default function LiveInferenceFeed({ streamUrl, cameraId }) {
    const [boxes, setBoxes] = useState([]);
    const [streamError, setStreamError] = useState(false);
    const [latencyMs, setLatencyMs] = useState(0);
    const socketRef = useRef(null);
    const lastBoxTime = useRef(Date.now());
    useEffect(() => {
        // Prevent localhost connection errors on Vercel demo
        if (window.location.hostname.includes('vercel.app'))
            return;
        const SOCKET_URL = getSocketUrl();
        const socket = io(SOCKET_URL);
        socketRef.current = socket;
        // Reset stream error when switching cameras
        setStreamError(false);
        socket.on(`boxes_${cameraId}`, (incoming) => {
            const now = Date.now();
            setLatencyMs(now - lastBoxTime.current);
            lastBoxTime.current = now;
            setBoxes(incoming);
        });
        return () => { socket.disconnect(); };
    }, [cameraId]);
    return (_jsxs("div", { className: "relative w-full h-full min-h-[380px] bg-black overflow-hidden flex items-center justify-center", children: [_jsx("div", { className: "w-full h-full relative", children: streamError ? (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center bg-slate-900 border border-slate-800", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3", children: _jsx("svg", { className: "w-7 h-7 text-slate-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" }) }) }), _jsx("p", { className: "text-sm text-slate-400 font-medium", children: "Awaiting camera stream" }), _jsxs("p", { className: "text-[10px] text-slate-600 mt-1", children: ["Connect your IP camera at ", _jsx("span", { className: "font-mono text-slate-500", children: streamUrl })] }), _jsx("button", { onClick: () => setStreamError(false), className: "mt-4 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition", children: "Retry Connection" }), _jsxs("div", { className: "flex items-center gap-2 mt-3", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" }), _jsx("span", { className: "text-[9px] text-amber-500/70 uppercase tracking-wider font-medium", children: "Standby" })] })] })) : (_jsx("img", { src: streamUrl, alt: `Live Feed ${cameraId}`, className: "object-contain w-full h-full absolute inset-0 z-0", crossOrigin: "anonymous", onError: () => setStreamError(true) })) }), _jsxs("div", { className: "absolute top-3 right-3 z-20 font-mono text-[9px] leading-snug bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/5", children: [_jsxs("p", { className: "text-emerald-400", children: ["MODEL ", _jsx("span", { className: "text-white/80 ml-1", children: "YOLOv8m-parking" })] }), _jsxs("p", { className: "text-emerald-400", children: ["LATENCY ", _jsx("span", { className: "text-white/80 ml-1", children: latencyMs > 0 ? `${Math.min(latencyMs, 999)}ms` : '—' })] }), _jsxs("p", { className: "text-emerald-400", children: ["OBJECTS ", _jsx("span", { className: "text-white/80 ml-1", children: boxes.length })] }), _jsxs("p", { className: "text-emerald-400", children: ["STATUS ", _jsx("span", { className: `ml-1 ${boxes.length > 0 ? 'text-red-400' : 'text-white/80'}`, children: boxes.length > 0 ? 'ALERT ACTIVE' : 'MONITORING' })] })] }), _jsx("div", { className: "absolute top-3 left-3 z-20", children: _jsx("span", { className: "font-mono text-[9px] bg-black/50 backdrop-blur-sm text-white/70 px-2 py-1 rounded-md border border-white/5", children: cameraId }) }), _jsxs("div", { className: "absolute bottom-3 left-3 z-20 flex items-center gap-1.5", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-red-500 animate-pulse" }), _jsx("span", { className: "font-mono text-[9px] text-red-400/80", children: "REC" })] }), boxes.map((box) => (_jsx("div", { className: "absolute border-2 z-10 transition-all duration-100", style: {
                    borderColor: box.color,
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                    backgroundColor: `${box.color}18`,
                }, children: _jsxs("div", { className: "absolute -top-4 left-[-2px] px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap rounded-sm", style: { backgroundColor: box.color }, children: [box.label, " ", (box.confidence * 100).toFixed(0), "%"] }) }, box.id)))] }));
}
