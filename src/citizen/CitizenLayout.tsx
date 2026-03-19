import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home, Map, PlusCircle, LogOut } from 'lucide-react';

export default function CitizenLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-gray-800 font-sans flex flex-col max-w-[430px] mx-auto relative shadow-2xl">
            {/* Sticky Top Bar */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100 px-5 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-black text-base tracking-tight text-gray-900">
                        CITIZEN<span className="text-blue-600">PORTAL</span>
                    </span>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem('citizen_session');
                        navigate('/citizen');
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 pb-20">
                <Outlet />
            </main>

            {/* Bottom Mobile Navigation */}
            <nav className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto h-[68px] bg-white border-t border-gray-100 flex items-center justify-around z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
                <Link to="/citizen/dashboard" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/citizen/dashboard') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    <div className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${isActive('/citizen/dashboard') ? 'bg-blue-100' : ''}`}>
                        <Home className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
                </Link>
                <Link to="/citizen/report" className="flex flex-col items-center -mt-5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 border-4 border-[#F5F7FA] active:scale-95 transition-transform">
                        <PlusCircle className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mt-0.5">Report</span>
                </Link>
                <Link to="/citizen/hub" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/citizen/hub') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    <div className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${isActive('/citizen/hub') ? 'bg-blue-100' : ''}`}>
                        <Map className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Hub</span>
                </Link>
            </nav>
        </div>
    );
}
