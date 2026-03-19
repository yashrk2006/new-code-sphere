
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
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
import CitizenLanding from './citizen/CitizenLanding';
import CitizenLogin from './citizen/CitizenLogin';
import CitizenDashboard from './citizen/CitizenDashboard';
import CitizenLayout from './citizen/CitizenLayout';
import CitizenIncidentHub from './modules/CitizenHub/CitizenIncidentHub';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useSocket } from './hooks/useSocket';
import { setupAxiosInterceptors } from './store/useAuthStore';

setupAxiosInterceptors();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* Citizen Portal Routes */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<CitizenLanding />} />
          <Route path="login" element={<CitizenLogin />} />
          <Route path="dashboard" element={<CitizenDashboard />} />
        </Route>

        {/* Secure Dashboard Route (Admin) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="cameras" element={<LiveCameras />} />
          <Route path="map" element={<ZoneMap />} />
          <Route path="alerts" element={<AlertDashboard />} />
          <Route path="citizen-hub" element={<CitizenIncidentHub />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="edge" element={<EdgeDashboard />} />
          <Route path="security" element={<SecurityDashboard />} />
          <Route path="storage" element={<StorageDashboard />} />
          <Route path="settings" element={<SettingsDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  useSocket();

  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
