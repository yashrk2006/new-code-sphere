import { create } from 'zustand';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
export const useCameraStore = create((set) => ({
    cameras: [],
    isLoading: false,
    error: null,
    fetchCameras: async () => {
        set({ isLoading: true });
        try {
            const { data } = await axios.get(getApiUrl('/cameras'));
            set({ cameras: data, isLoading: false });
        }
        catch (error) {
            console.error('Failed to fetch cameras:', error);
            set({
                error: 'Could not connect to backend camera service. Using local discovery mode.',
                isLoading: false,
                cameras: [
                    {
                        id: 'CAM-04',
                        name: 'Primary Surveillance',
                        location: 'Main Lobby',
                        streamUrl: 'http://localhost:8080/video',
                        status: 'online',
                        type: 'regular',
                        lastActive: new Date().toISOString(),
                        metrics: { fps: 30, resolution: '1080p', bitrate: '4.2 Mbps', latency: '12ms' },
                        aiFeatures: ['Face Detection', 'Crowd counting', 'Anomaly Detection']
                    }
                ]
            });
        }
    },
    addCamera: async (newCam) => {
        try {
            const { data } = await axios.post(getApiUrl('/cameras'), newCam);
            set((state) => ({ cameras: [...state.cameras, data] }));
        }
        catch (error) {
            console.error('Failed to add camera:', error);
        }
    },
    removeCamera: async (id) => {
        try {
            await axios.delete(getApiUrl(`/cameras/${id}`));
            set((state) => ({
                cameras: state.cameras.filter(c => c.id !== id)
            }));
        }
        catch (error) {
            console.error('Failed to remove camera:', error);
        }
    }
}));
