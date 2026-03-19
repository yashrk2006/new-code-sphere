import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useVisionStore } from '../../store/useVisionStore';
import { useAlertStore } from '../../store/useAlertStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, ExternalLink, ShieldAlert, Radio, Clock, Route, X, Camera, AlertTriangle, Shield, Crosshair, } from 'lucide-react';
const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '0' };
// Default Dispatch/Base Location (New Delhi campus)
const DISPATCH_BASE = { lat: 28.6139, lng: 77.2090 };
// Google Maps libraries to load
const LIBRARIES = ['places'];
// Comprehensive dark mode map style
const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#0c1021' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0c1021' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2332' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f1923' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0f1923' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#141e2e' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
];
const TYPE_LABELS = {
    PARKING_VIOLATION: 'Parking Violation',
    CAPACITY_EXCEEDED: 'Capacity Exceeded',
    UNAUTHORIZED_VEHICLE: 'Unauthorized Vehicle',
    SUSPICIOUS_BEHAVIOR: 'Suspicious Behavior',
};
export default function ZoneMap() {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
        libraries: LIBRARIES,
    });
    const cameras = useVisionStore((s) => s.cameras);
    const alerts = useAlertStore((s) => s.alerts);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [directions, setDirections] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    // Get camera details for a given alert
    const getCameraForAlert = useCallback((cameraId) => cameras.find((c) => c.id === cameraId), [cameras]);
    // Build a map of camera_id -> latest alert for marker rendering
    const alertsByCameraId = useMemo(() => {
        const map = new Map();
        for (const alert of alerts) {
            if (!map.has(alert.camera_id) || alert.severity === 'Critical') {
                map.set(alert.camera_id, alert);
            }
        }
        return map;
    }, [alerts]);
    // Pending alerts for sidebar list
    const pendingAlerts = useMemo(() => alerts.filter((a) => a.status === 'Pending').slice(0, 20), [alerts]);
    // Calculate route via Google Maps DirectionsService
    const fetchDirections = useCallback((destLat, destLng) => {
        if (!window.google)
            return;
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route({
            origin: DISPATCH_BASE,
            destination: { lat: destLat, lng: destLng },
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: false,
        }, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result) {
                setDirections(result);
                const leg = result.routes[0].legs[0];
                setRouteInfo({
                    distance: leg.distance?.text || '',
                    duration: leg.duration?.text || '',
                });
            }
            else {
                console.error(`Directions API error: ${status}`);
                setDirections(null);
                setRouteInfo(null);
            }
        });
    }, []);
    // Trigger route on alert selection
    useEffect(() => {
        if (selectedAlert) {
            const cam = getCameraForAlert(selectedAlert.camera_id);
            if (cam?.lat && cam?.lng) {
                fetchDirections(cam.lat, cam.lng);
                // Pan map to show both dispatch base and destination
                if (mapInstance) {
                    const bounds = new window.google.maps.LatLngBounds();
                    bounds.extend(DISPATCH_BASE);
                    bounds.extend({ lat: cam.lat, lng: cam.lng });
                    mapInstance.fitBounds(bounds, { top: 50, right: 400, bottom: 50, left: 50 });
                }
            }
        }
        else {
            setDirections(null);
            setRouteInfo(null);
            if (mapInstance) {
                mapInstance.panTo(DISPATCH_BASE);
                mapInstance.setZoom(14);
            }
        }
    }, [selectedAlert, getCameraForAlert, fetchDirections, mapInstance]);
    // Open shareable Google Maps link for field agent
    const openInGoogleMaps = () => {
        if (!selectedAlert)
            return;
        const cam = getCameraForAlert(selectedAlert.camera_id);
        if (!cam)
            return;
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${DISPATCH_BASE.lat},${DISPATCH_BASE.lng}&destination=${cam.lat},${cam.lng}&travelmode=driving`, '_blank');
    };
    // ─── Loading / Error States ──────────────────────────────
    if (loadError) {
        return (_jsx("div", { className: "flex items-center justify-center h-full bg-[#020617]", children: _jsxs("div", { className: "text-center space-y-3 p-8 bg-[#040D21] border border-slate-800 rounded-2xl max-w-md", children: [_jsx(AlertTriangle, { className: "w-10 h-10 text-red-400 mx-auto" }), _jsx("h3", { className: "text-lg font-bold text-white", children: "Map Load Error" }), _jsxs("p", { className: "text-sm text-slate-400", children: ["Failed to load Google Maps. Verify your ", _jsx("code", { className: "text-blue-400", children: "VITE_GOOGLE_MAPS_KEY" }), " in ", _jsx("code", { className: "text-blue-400", children: ".env" }), " and ensure the Maps JavaScript API and Directions API are enabled."] })] }) }));
    }
    if (!isLoaded) {
        return (_jsx("div", { className: "flex items-center justify-center h-full bg-[#020617] text-white", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsxs("div", { className: "relative w-14 h-14", children: [_jsx("div", { className: "absolute inset-0 rounded-full border-2 border-slate-800" }), _jsx("div", { className: "absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm font-medium text-white", children: "Initializing Geospatial Data" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Loading Google Maps infrastructure..." })] })] }) }));
    }
    return (_jsxs("div", { className: "flex h-full bg-[#020617] overflow-hidden", children: [_jsxs("div", { className: "w-80 border-r border-slate-800 bg-[#040D21] flex flex-col shrink-0", children: [_jsxs("div", { className: "p-4 border-b border-slate-800", children: [_jsxs("h2", { className: "text-sm font-bold text-white flex items-center gap-2", children: [_jsx(Radio, { className: "w-4 h-4 text-red-400" }), "Active Incidents"] }), _jsx("p", { className: "text-[11px] text-slate-500 mt-1", children: "Click to route dispatch" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-3 space-y-2", children: [pendingAlerts.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center h-40 text-slate-500", children: [_jsx(Shield, { className: "w-8 h-8 opacity-20 mb-2" }), _jsx("p", { className: "text-xs", children: "No active incidents" })] })), pendingAlerts.map((alert) => {
                                const cam = getCameraForAlert(alert.camera_id);
                                const isSelected = selectedAlert?.id === alert.id;
                                return (_jsxs("button", { onClick: () => setSelectedAlert(isSelected ? null : alert), className: `w-full text-left p-3 rounded-xl border transition-all duration-200
                  ${isSelected
                                        ? 'bg-blue-600/10 border-blue-500/40 shadow-[0_0_15px_rgba(37,99,235,0.08)]'
                                        : alert.severity === 'Critical'
                                            ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}
                `, children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: `w-2 h-2 rounded-full shrink-0 ${alert.severity === 'Critical' ? 'bg-red-500 animate-pulse'
                                                        : alert.severity === 'Medium' ? 'bg-orange-500'
                                                            : 'bg-yellow-500'}` }), _jsx("span", { className: "text-xs font-bold text-white truncate", children: TYPE_LABELS[alert.type] || alert.type }), _jsx("span", { className: `text-[9px] font-bold px-1.5 py-0.5 rounded ml-auto shrink-0 ${alert.severity === 'Critical' ? 'bg-red-500/20 text-red-400'
                                                        : alert.severity === 'Medium' ? 'bg-orange-500/20 text-orange-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'}`, children: alert.severity })] }), _jsxs("div", { className: "flex items-center gap-2 text-[10px] text-slate-500", children: [_jsx(Camera, { className: "w-3 h-3" }), _jsx("span", { children: cam?.name || alert.camera_id }), _jsx("span", { className: "ml-auto font-mono", children: new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] })] }, alert.id));
                            })] }), _jsx("div", { className: "p-4 border-t border-slate-800 bg-slate-900/30", children: _jsxs("div", { className: "flex items-center gap-2 text-[11px] text-slate-400", children: [_jsx(Crosshair, { className: "w-3.5 h-3.5 text-blue-400" }), _jsxs("span", { children: ["Dispatch HQ: ", DISPATCH_BASE.lat.toFixed(4), ", ", DISPATCH_BASE.lng.toFixed(4)] })] }) })] }), _jsxs("div", { className: "flex-1 relative", children: [_jsxs(GoogleMap, { mapContainerStyle: mapContainerStyle, zoom: 14, center: DISPATCH_BASE, onLoad: (map) => setMapInstance(map), options: {
                            styles: darkMapStyle,
                            disableDefaultUI: true,
                            zoomControl: true,
                            zoomControlOptions: { position: window.google.maps.ControlPosition.LEFT_BOTTOM },
                            mapTypeControl: false,
                            fullscreenControl: false,
                        }, children: [_jsx(Marker, { position: DISPATCH_BASE, icon: {
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    fillColor: '#3b82f6',
                                    fillOpacity: 1,
                                    strokeWeight: 3,
                                    strokeColor: '#1d4ed8',
                                    scale: 10,
                                }, title: "Dispatch Headquarters" }), cameras.map((camera) => {
                                const alert = alertsByCameraId.get(camera.id);
                                const isSelected = selectedAlert?.camera_id === camera.id;
                                return (_jsx(Marker, { position: { lat: camera.lat, lng: camera.lng }, onClick: () => {
                                        if (alert)
                                            setSelectedAlert(alert);
                                    }, icon: {
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        fillColor: alert
                                            ? alert.severity === 'Critical' ? '#ef4444' : alert.severity === 'Medium' ? '#f97316' : '#eab308'
                                            : camera.status === 'online' ? '#22c55e' : '#64748b',
                                        fillOpacity: 0.9,
                                        strokeWeight: isSelected ? 4 : 2,
                                        strokeColor: isSelected ? '#3b82f6' : '#ffffff',
                                        scale: isSelected ? 14 : alert ? 10 : 8,
                                    }, animation: alert?.severity === 'Critical' ? window.google.maps.Animation.BOUNCE : undefined, title: `${camera.name} (${camera.id})` }, camera.id));
                            }), directions && (_jsx(DirectionsRenderer, { directions: directions, options: {
                                    polylineOptions: {
                                        strokeColor: '#3b82f6',
                                        strokeWeight: 5,
                                        strokeOpacity: 0.85,
                                    },
                                    suppressMarkers: true,
                                } }))] }), _jsx("div", { className: "absolute bottom-6 left-6 bg-[#040D21]/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-3 z-10", children: _jsxs("div", { className: "flex items-center gap-4 text-[10px] font-medium", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" }), " ", _jsx("span", { className: "text-slate-400", children: "HQ" })] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" }), " ", _jsx("span", { className: "text-slate-400", children: "Online" })] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-red-500 inline-block" }), " ", _jsx("span", { className: "text-slate-400", children: "Critical" })] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" }), " ", _jsx("span", { className: "text-slate-400", children: "Medium" })] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" }), " ", _jsx("span", { className: "text-slate-400", children: "Low" })] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" }), " ", _jsx("span", { className: "text-slate-400", children: "Offline" })] })] }) }), _jsx(AnimatePresence, { children: selectedAlert && (_jsxs(motion.div, { initial: { opacity: 0, x: 30, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: 30, scale: 0.95 }, transition: { type: 'spring', damping: 25, stiffness: 300 }, className: "absolute top-6 right-6 w-80 bg-[#040D21]/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl text-white z-10 overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-red-500/5", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx(ShieldAlert, { className: "w-5 h-5 text-red-400" }), _jsx("h3", { className: "text-sm font-bold", children: "Dispatch Control" })] }), _jsx("button", { onClick: () => setSelectedAlert(null), className: "p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "p-5 space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-semibold", children: "Target Anomaly" }), _jsx("p", { className: "text-sm font-bold text-red-400 mt-1", children: TYPE_LABELS[selectedAlert.type] || selectedAlert.type }), _jsxs("p", { className: "text-xs text-slate-400 flex items-center gap-1 mt-0.5", children: [_jsx(Camera, { className: "w-3 h-3" }), getCameraForAlert(selectedAlert.camera_id)?.name || selectedAlert.camera_id] })] }), routeInfo ? (_jsxs("div", { className: "bg-slate-900/80 rounded-xl border border-slate-800 p-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), " ETA"] }), _jsx("p", { className: "text-xl font-bold text-emerald-400 mt-1", children: routeInfo.duration })] }), _jsx("div", { className: "w-px h-10 bg-slate-800" }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1 justify-end", children: [_jsx(Route, { className: "w-3 h-3" }), " Distance"] }), _jsx("p", { className: "text-xl font-bold text-blue-400 mt-1", children: routeInfo.distance })] })] })) : (_jsxs("div", { className: "bg-slate-900/80 rounded-xl border border-slate-800 p-4 flex items-center justify-center gap-2", children: [_jsx("div", { className: "w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" }), _jsx("span", { className: "text-xs text-blue-400", children: "Calculating optimal route..." })] })), _jsxs("div", { className: "relative rounded-xl overflow-hidden border border-slate-800", children: [_jsx("img", { src: selectedAlert.image_url, alt: "Threat Snapshot", className: "w-full h-32 object-cover" }), _jsx("div", { className: "absolute top-2 left-2", children: _jsx("span", { className: `text-[9px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-md ${selectedAlert.severity === 'Critical' ? 'bg-red-500/80 text-white' : 'bg-orange-500/80 text-white'}`, children: selectedAlert.severity.toUpperCase() }) }), _jsx("div", { className: "absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg", children: _jsxs("span", { className: "text-[10px] font-mono text-emerald-400", children: [selectedAlert.confidence.toFixed(1), "%"] }) })] }), _jsxs("div", { className: "space-y-2 pt-2", children: [_jsxs("button", { onClick: openInGoogleMaps, className: "w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.25)]", children: [_jsx(Navigation, { className: "w-4 h-4" }), "Send Route to Agent", _jsx(ExternalLink, { className: "w-3 h-3 opacity-60" })] }), _jsx("button", { onClick: () => setSelectedAlert(null), className: "w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors border border-slate-700", children: "Cancel Dispatch" })] })] })] }, "dispatch-panel")) })] })] }));
}
