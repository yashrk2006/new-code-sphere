import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../utils/api';

interface BoundingBox {
    id: string;
    label: string;
    confidence: number;
    color: string;
    x: number;      // % from left
    y: number;      // % from top
    width: number;   // % width
    height: number;  // % height
}

interface Props {
    streamUrl: string;
    cameraId: string;
}

export default function LiveInferenceFeed({ streamUrl, cameraId }: Props) {
    const [boxes, setBoxes] = useState<BoundingBox[]>([]);
    const [streamError, setStreamError] = useState(false);
    const [latencyMs, setLatencyMs] = useState(0);
    const socketRef = useRef<Socket | null>(null);
    const lastBoxTime = useRef<number>(Date.now());

    useEffect(() => {
        // Prevent localhost connection errors on Vercel demo
        if (window.location.hostname.includes('vercel.app')) return;

        const SOCKET_URL = getSocketUrl();
        const socket = io(SOCKET_URL);

        socketRef.current = socket;

        // Reset stream error when switching cameras
        setStreamError(false);

        socket.on(`boxes_${cameraId}`, (incoming: BoundingBox[]) => {
            const now = Date.now();
            setLatencyMs(now - lastBoxTime.current);
            lastBoxTime.current = now;
            setBoxes(incoming);
        });

        return () => { socket.disconnect(); };
    }, [cameraId]);

    return (
        <div className="relative w-full h-full min-h-[380px] bg-black overflow-hidden flex items-center justify-center">
            {/* Live Camera Stream or Fallback */}
            <div className="w-full h-full relative">
                {streamError ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 border border-slate-800">
                        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                            <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-400 font-medium">Awaiting camera stream</p>
                        <p className="text-[10px] text-slate-600 mt-1">Connect your IP camera at <span className="font-mono text-slate-500">{streamUrl}</span></p>
                        <button 
                            onClick={() => setStreamError(false)}
                            className="mt-4 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition"
                        >
                            Retry Connection
                        </button>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[9px] text-amber-500/70 uppercase tracking-wider font-medium">Standby</span>
                        </div>
                    </div>
                ) : (
                    <img
                        src={streamUrl}
                        alt={`Live Feed ${cameraId}`}
                        className="object-contain w-full h-full absolute inset-0 z-0"
                        crossOrigin="anonymous"
                        onError={() => setStreamError(true)}
                    />
                )}
            </div>

            {/* Telemetry HUD (always visible) */}
            <div className="absolute top-3 right-3 z-20 font-mono text-[9px] leading-snug bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/5">
                <p className="text-emerald-400">MODEL <span className="text-white/80 ml-1">YOLOv8m-parking</span></p>
                <p className="text-emerald-400">LATENCY <span className="text-white/80 ml-1">{latencyMs > 0 ? `${Math.min(latencyMs, 999)}ms` : '—'}</span></p>
                <p className="text-emerald-400">OBJECTS <span className="text-white/80 ml-1">{boxes.length}</span></p>
                <p className="text-emerald-400">STATUS <span className={`ml-1 ${boxes.length > 0 ? 'text-red-400' : 'text-white/80'}`}>
                    {boxes.length > 0 ? 'ALERT ACTIVE' : 'MONITORING'}
                </span></p>
            </div>

            {/* Camera ID */}
            <div className="absolute top-3 left-3 z-20">
                <span className="font-mono text-[9px] bg-black/50 backdrop-blur-sm text-white/70 px-2 py-1 rounded-md border border-white/5">
                    {cameraId}
                </span>
            </div>

            {/* Recording indicator */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-[9px] text-red-400/80">REC</span>
            </div>

            {/* Bounding Boxes from AI inference */}
            {boxes.map((box) => (
                <div
                    key={box.id}
                    className="absolute border-2 z-10 transition-all duration-100"
                    style={{
                        borderColor: box.color,
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                        backgroundColor: `${box.color}18`,
                    }}
                >
                    <div
                        className="absolute -top-4 left-[-2px] px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap rounded-sm"
                        style={{ backgroundColor: box.color }}
                    >
                        {box.label} {(box.confidence * 100).toFixed(0)}%
                    </div>
                </div>
            ))}
        </div>
    );
}
