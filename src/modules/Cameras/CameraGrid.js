import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Camera as CameraIcon } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
const fetchCameras = async () => {
    // Graceful fallback for demo if real API is down
    try {
        const { data } = await axios.get(getApiUrl('/cameras'));
        return data;
    }
    catch (err) {
        console.warn("Real API offline, falling back to module mock array.");
        return [
            { id: '1', name: 'Main Gate', status: 'online', lat: 28.6139, lng: 77.2090 },
            { id: '2', name: 'Parking Lot B', status: 'online', lat: 28.6150, lng: 77.2100 },
            { id: '3', name: 'Warehouse A', status: 'offline', lat: 28.6120, lng: 77.2080 }
        ];
    }
};
export default function CameraGrid() {
    const { data: cameras, isLoading } = useQuery({ queryKey: ['cameras'], queryFn: fetchCameras });
    if (isLoading)
        return _jsx("div", { className: "text-white p-6 animate-pulse", children: "Establishing secure streams..." });
    return (_jsxs("div", { className: "p-6 bg-[#020617] min-h-screen", children: [_jsxs("div", { className: "flex justify-between items-center mb-6 text-white border-b border-slate-800 pb-4", children: [_jsxs("h2", { className: "text-2xl font-bold flex items-center gap-2", children: [_jsx(CameraIcon, {}), " Live Edge Streams"] }), _jsx("button", { className: "bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-[0_0_15px_rgba(37,99,235,0.3)]", children: "Add Camera" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: cameras?.map((cam) => (_jsxs("div", { className: "relative bg-black rounded-lg overflow-hidden group border border-slate-800 aspect-video flex items-center justify-center", children: [_jsxs("div", { className: "absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center opacity-80 group-hover:opacity-40 transition-opacity", children: [_jsx(CameraIcon, { className: "w-8 h-8 text-slate-500 mb-2" }), _jsx("span", { className: "text-xs font-mono text-slate-500", children: "AWAITING RTSP SIGNAL" })] }), cam.id === '1' && (_jsx("img", { src: "http://192.0.0.4:8080/video", alt: "IP Webcam", className: "w-full h-full object-cover", onError: (e) => { e.currentTarget.style.display = 'none'; } })), _jsx("div", { className: "absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur-sm border border-white/10", children: cam.name }), _jsx("div", { className: `absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cam.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`, children: cam.status }), _jsx("div", { className: "absolute bottom-2 right-2", children: _jsx("span", { className: "text-[10px] text-white/50 bg-black/50 px-1 rounded", children: cam.id }) })] }, cam.id))) })] }));
}
