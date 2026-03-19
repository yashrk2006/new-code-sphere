import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield, Home, Map, MessageSquare, LogOut } from 'lucide-react';

export default function CitizenLayout() {
    const navigate = useNavigate();
    
    return (
        <div className="min-h-screen bg-[#0d1117] text-white font-sans flex flex-col">
            {/* Citizen Navigation Bar */}
            <nav className="h-16 border-b border-gray-800 bg-[#161b22] px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-lg tracking-tighter text-white">CITIZEN<span className="text-blue-500">PORTAL</span></span>
                </div>
                
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/citizen/dashboard" className="text-sm font-medium hover:text-blue-400 transition-colors">Dashboard</Link>
                    <Link to="/citizen/hub" className="text-sm font-medium hover:text-blue-400 transition-colors">Incident Map</Link>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('citizen_session');
                            navigate('/citizen');
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold">
                        CP
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 relative">
                <Outlet />
            </main>

            {/* Bottom Mobile Navigation */}
            <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#161b22] border-t border-gray-800 flex items-center justify-around z-50">
                <Link to="/citizen/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-400">
                    <Home className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">Home</span>
                </Link>
                <Link to="/citizen/hub" className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-400">
                    <Map className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">Hub</span>
                </Link>
                <Link to="/citizen/report" className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-400">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">Report</span>
                </Link>
            </div>
        </div>
    );
}
