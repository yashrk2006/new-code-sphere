import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getApiUrl } from '../utils/api';

// TypeScript definitions for the real data structures expected from the analytics API
export interface TrendData {
    time_bucket: string; // e.g., '2023-10-27T10:00:00Z'
    anomaly_count: number;
}

export interface ZoneData {
    zone_name: string;
    total_alerts: number;
}

export interface AnalyticsPayload {
    trends: TrendData[];
    zoneDistribution: ZoneData[];
    accuracyMetrics: {
        true_positives: number;
        false_positives: number;
        avg_confidence: number;
    };
}

export const useAnalytics = (timeRange: '24h' | '7d' | '30d') => {
    return useQuery<AnalyticsPayload>({
        queryKey: ['analytics', timeRange],
        queryFn: async () => {
            // Use relative URL — Vite proxy forwards /api to backend
            const { data } = await axios.get(getApiUrl('/analytics'), {
                params: { range: timeRange },
            });
            return data;
        },
        refetchInterval: 30000, // Silently refetch every 30s to keep charts fresh
    });
};
