import { create } from 'zustand';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
export const useNotificationStore = create((set) => ({
    notifications: [],
    unreadCount: 0,
    fetchNotifications: async () => {
        try {
            const { data } = await axios.get(getApiUrl('/notifications'));
            set({
                notifications: data,
                unreadCount: data.filter((n) => !n.is_read).length,
            });
        }
        catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    },
    addLiveNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },
    markAsRead: async (id) => {
        try {
            await axios.put(getApiUrl(`/notifications/${id}/read`));
            set((state) => ({
                notifications: state.notifications.map((n) => n.id === id ? { ...n, is_read: true } : n),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        }
        catch (err) {
            console.error('Failed to mark as read', err);
        }
    },
    markAllAsRead: async () => {
        try {
            await axios.put(getApiUrl('/notifications/read-all'));
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
                unreadCount: 0,
            }));
        }
        catch (err) {
            console.error('Failed to mark all as read', err);
        }
    },
}));
