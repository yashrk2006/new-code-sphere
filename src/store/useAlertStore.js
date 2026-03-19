import { create } from 'zustand';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
export const useAlertStore = create((set) => ({
    alerts: [],
    // Triggered by Socket.io when the Python AI pushes a new detection
    addLiveAlert: (alert) => set((state) => ({
        alerts: [alert, ...state.alerts].slice(0, 500), // Keep the UI fast by limiting history
    })),
    // Batch set from initial REST load
    setAlerts: (alerts) => set({ alerts }),
    // Triggered by the dashboard operator to update the database
    updateAlertStatus: async (id, newStatus, notes) => {
        try {
            // 1. Optimistically update the UI so the operator sees the change instantly
            set((state) => ({
                alerts: state.alerts.map((alert) => alert.id === id
                    ? { ...alert, status: newStatus, operator_notes: notes }
                    : alert),
            }));
            // 2. Send the update to the backend
            await axios.put(getApiUrl(`/alerts/${id}`), {
                status: newStatus,
                notes,
            });
        }
        catch (error) {
            console.error('Failed to update alert in database', error);
            // Revert could be added here for full production robustness
        }
    },
}));
