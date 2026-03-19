import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import LandingPage from './pages/LandingPage';
import Login from './pages/Login'; // You will need a basic login form here
import DashboardLayout from './pages/Dashboard';
import DashboardOverview from './modules/Dashboard/DashboardOverview';
import LiveCameras from './modules/Cameras/LiveCameras';
import ZoneMap from './modules/Map/ZoneMap';
import AlertDashboard from './modules/Alerts/AlertDashboard';
import AnalyticsDashboard from './modules/Analytics/AnalyticsDashboard';
import EdgeDashboard from './modules/EdgeNodes/EdgeDashboard';
import SecurityDashboard from './modules/Security/SecurityDashboard';
import StorageDashboard from './modules/Storage/StorageDashboard';
import SettingsDashboard from './modules/Settings/SettingsDashboard';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import { setupAxiosInterceptors } from './store/useAuthStore';
// Initialize JWT injection into every Axios request
setupAxiosInterceptors();
// A protective wrapper that kicks out unauthenticated users
const ProtectedRoute = ({ children }) => {
    // const { token } = useAuthStore();
    // if (!token) return <Navigate to="/login" replace />;
    return children;
};
export default function App() {
    useSocket(); // Initialize real-time WebSocket connection to Node.js backend
    return (_jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(DashboardOverview, {}) }), _jsx(Route, { path: "cameras", element: _jsx(LiveCameras, {}) }), _jsx(Route, { path: "map", element: _jsx(ZoneMap, {}) }), _jsx(Route, { path: "alerts", element: _jsx(AlertDashboard, {}) }), _jsx(Route, { path: "analytics", element: _jsx(AnalyticsDashboard, {}) }), _jsx(Route, { path: "edge", element: _jsx(EdgeDashboard, {}) }), _jsx(Route, { path: "security", element: _jsx(SecurityDashboard, {}) }), _jsx(Route, { path: "storage", element: _jsx(StorageDashboard, {}) }), _jsx(Route, { path: "settings", element: _jsx(SettingsDashboard, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
}
