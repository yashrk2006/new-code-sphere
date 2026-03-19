import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';
import { getApiUrl } from '../utils/api';
// Strict Zod validation schema
export const settingsSchema = z.object({
    systemName: z.string().min(3, 'System name must be at least 3 characters.'),
    aiConfidenceThreshold: z.number().min(10, 'Min 10%').max(99, 'Max 99%'),
    activeModel: z.enum(['yolov8n-general', 'yolov8m-municipal-parking', 'yolov8s-campus-attendance']),
    enableEmailAlerts: z.boolean(),
    enablePushNotifications: z.boolean(),
    autoAcknowledgeLowSeverity: z.boolean(),
});
/** Fetch current live settings */
export const useGetSettings = () => useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => (await axios.get(getApiUrl('/settings'))).data,
    refetchOnWindowFocus: false,
});
/** Persist updated settings */
export const useUpdateSettings = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (newSettings) => axios.put(getApiUrl('/settings'), newSettings),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['system_settings'] }),
    });
};
