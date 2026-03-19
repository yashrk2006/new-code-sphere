/**
 * Standardizes the Backend API URL by removing trailing slashes and ensuring
 * it doesn't double up on the '/api' prefix if the environment variable already includes it.
 */
export const getBaseApiUrl = () => {
    const rawUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
    // Remove trailing slash and /api if present at the end
    return rawUrl.replace(/\/$/, '').replace(/\/api$/, '');
};
/**
 * Returns the full API URL for a given path, ensuring single '/api' prefix.
 */
export const getApiUrl = (path) => {
    const base = getBaseApiUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}/api${cleanPath}`;
};
/**
 * Standardizes the WebSocket URL.
 */
export const getSocketUrl = () => {
    const rawUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
    return rawUrl.replace(/\/$/, '').replace(/\/api$/, '');
};
