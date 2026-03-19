import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { Maximize2, ZoomIn, ZoomOut, Zap, ZapOff, WifiOff, Trash2 } from 'lucide-react';
import { useCameraStore } from '../../store/useCameraStore';
export default function IPWebcamPlayer({ camera }) {
    const [hasError, setHasError] = useState(false);
    const [isFlashlightOn, setIsFlashlightOn] = useState(false);
    const containerRef = useRef(null);
    const { removeCamera, updateStatus } = useCameraStore();
    // IP Webcam specific endpoints
    const streamUrl = `${camera.ip_url}/video`;
    // Send HTTP command directly to the IP Webcam
    const sendCommand = async (endpoint) => {
        try {
            // Adding a local proxy bypass or basic fetch with no-cors so we don't trip CORS over raw IP
            await fetch(`${camera.ip_url}${endpoint}`, { mode: 'no-cors' });
        }
        catch (error) {
            console.error(`Command failed on ${camera.name}`, error);
        }
    };
    const toggleFlashlight = () => {
        sendCommand(`/enabletorch?enable=${isFlashlightOn ? 0 : 1}`);
        setIsFlashlightOn(!isFlashlightOn);
    };
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        }
        else {
            document.exitFullscreen();
        }
    };
    return (_jsxs("div", { ref: containerRef, className: "relative bg-[#151923] border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col group h-full min-h-[250px]", children: [_jsxs("div", { className: "absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `w-2 h-2 rounded-full ${hasError ? 'bg-red-500' : 'bg-green-500 animate-pulse'}` }), _jsx("span", { className: "text-white text-xs font-bold drop-shadow-md", children: camera.name }), _jsx("span", { className: "bg-blue-600/80 px-1.5 py-0.5 rounded text-[10px] text-white uppercase", children: camera.zone })] }), _jsx("button", { onClick: () => {
                            if (window.confirm(`Disconnect and remove ${camera.name}?`))
                                removeCamera(camera.id);
                        }, className: "text-red-400 hover:text-red-300 p-1 bg-black/50 rounded transition cursor-pointer z-50 pointer-events-auto", children: _jsx(Trash2, { size: 14 }) })] }), _jsx("div", { className: "flex-grow bg-black relative flex items-center justify-center pointer-events-none", children: hasError ? (_jsxs("div", { className: "flex flex-col items-center text-gray-500 pointer-events-auto", children: [_jsx(WifiOff, { size: 32, className: "mb-2 text-red-900" }), _jsx("p", { className: "text-sm font-semibold", children: "Connection Lost" }), _jsx("p", { className: "text-xs", children: camera.ip_url }), _jsx("button", { onClick: () => setHasError(false), className: "mt-3 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-white transition cursor-pointer", children: "Attempt Reconnect" })] })) : (_jsx("img", { src: streamUrl, alt: camera.name, className: "w-full h-full object-cover", crossOrigin: "anonymous", onError: () => {
                        setHasError(true);
                        updateStatus(camera.id, 'offline');
                    }, onLoad: () => updateStatus(camera.id, 'online') })) }), _jsxs("div", { className: "absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/90 to-transparent z-10 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0", children: [_jsx("button", { onClick: () => sendCommand('/ptz?action=zoomin'), className: "p-1.5 bg-gray-800/80 hover:bg-gray-700 rounded text-white backdrop-blur-sm transition tooltip-trigger cursor-pointer", title: "Zoom In", children: _jsx(ZoomIn, { size: 16 }) }), _jsx("button", { onClick: () => sendCommand('/ptz?action=zoomout'), className: "p-1.5 bg-gray-800/80 hover:bg-gray-700 rounded text-white backdrop-blur-sm transition tooltip-trigger cursor-pointer", title: "Zoom Out", children: _jsx(ZoomOut, { size: 16 }) }), _jsx("button", { onClick: toggleFlashlight, className: `p-1.5 rounded backdrop-blur-sm transition cursor-pointer ${isFlashlightOn ? 'bg-yellow-500/80 text-black' : 'bg-gray-800/80 hover:bg-gray-700 text-white'}`, title: "Toggle Node LED", children: isFlashlightOn ? _jsx(Zap, { size: 16 }) : _jsx(ZapOff, { size: 16 }) }), _jsx("div", { className: "w-px h-6 bg-gray-600 mx-1" }), _jsx("button", { onClick: toggleFullscreen, className: "p-1.5 bg-gray-800/80 hover:bg-gray-700 rounded text-white backdrop-blur-sm transition tooltip-trigger cursor-pointer", title: "Fullscreen Node", children: _jsx(Maximize2, { size: 16 }) })] })] }));
}
