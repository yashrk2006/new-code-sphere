import { create } from 'zustand';
export const useVisionStore = create((set) => ({
    alerts: [],
    cameras: [],
    detections: [], // Initialize detections as an empty array
    addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 50) })), // Keep last 50, changed from 100
    addDetection: (detection) => set((state) => ({ detections: [detection, ...state.detections].slice(0, 50) })), // Added addDetection logic
    setCameras: (cameras) => set({ cameras }),
    updateCameraStatus: (id, status) => set((state) => ({
        cameras: state.cameras.map(c => c.id === id ? { ...c, status } : c)
    }))
}));
