import { create } from 'zustand';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
export const useEdgeStore = create((set) => ({
    nodes: [],
    setInitialNodes: (nodes) => set({ nodes }),
    // Fired by Socket.IO every time a node heartbeats
    updateNodeTelemetry: (id, telemetry) => set((state) => ({
        nodes: state.nodes.map((node) => node.id === id
            ? {
                ...node,
                status: telemetry.status,
                metrics: telemetry.metrics,
                last_heartbeat: telemetry.timestamp,
            }
            : node),
    })),
    // Send a remote command to the edge device
    sendDeviceCommand: async (id, command) => {
        try {
            // Optimistic status update
            set((state) => ({
                nodes: state.nodes.map((node) => node.id === id
                    ? { ...node, status: (command === 'restart' ? 'restarting' : 'updating') }
                    : node),
            }));
            await axios.post(getApiUrl(`/edge/${id}/command`), { action: command });
        }
        catch (error) {
            console.error(`Failed to execute ${command} on node ${id}`, error);
            // Revert on failure
            set((state) => ({
                nodes: state.nodes.map((node) => node.id === id ? { ...node, status: 'online' } : node),
            }));
        }
    },
}));
