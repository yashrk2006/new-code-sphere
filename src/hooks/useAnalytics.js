import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
export const useAnalytics = (timeRange) => {
    return useQuery({
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
