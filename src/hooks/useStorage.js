import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
/** Fetch bucket stats + distribution */
export const useStorageStats = () => useQuery({
    queryKey: ['storage_stats'],
    queryFn: async () => (await axios.get(getApiUrl('/storage/stats'))).data,
    refetchInterval: 300000,
});
/** Fetch paginated files with optional type filter */
export const useStorageFiles = (page = 1, limit = 50, type = 'all') => useQuery({
    queryKey: ['storage_files', page, type],
    queryFn: async () => (await axios.get(getApiUrl('/storage/files'), { params: { page, limit, type } })).data,
});
/** Delete a file by S3 key */
export const useDeleteFile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (key) => axios.delete(getApiUrl('/storage/files'), { data: { key } }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['storage_files'] });
            qc.invalidateQueries({ queryKey: ['storage_stats'] });
        },
    });
};
/** Update retention policy */
export const useUpdatePolicy = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (days) => axios.put(getApiUrl('/storage/policy'), { days }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['storage_stats'] }),
    });
};
