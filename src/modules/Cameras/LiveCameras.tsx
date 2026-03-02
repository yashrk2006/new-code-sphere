import { useState, useEffect } from 'react';
import { useCameraStore } from '../../store/useCameraStore';
import IPWebcamPlayer from './IPWebcamPlayer';
import { Grid, LayoutGrid, Maximize, Plus, X, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveCameras() {
    const { cameras, gridLayout, setGridLayout, fetchCameras, addCamera } = useCameraStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Add Camera Form State
    const [newCam, setNewCam] = useState({ name: '', ip_url: 'http://', zone: 'Sector 1' });

    useEffect(() => {
        fetchCameras();
    }, [fetchCameras]);

    const handleAddCamera = (e: React.FormEvent) => {
        e.preventDefault();
        addCamera(newCam);
        setIsModalOpen(false);
        setNewCam({ name: '', ip_url: 'http://', zone: 'Sector 1' });
    };

    // Dynamic Grid CSS based on selected layout
    const gridClasses = {
        1: 'grid-cols-1 md:grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
    };

    return (
        <div className="p-6 bg-[#0B0F19] min-h-screen text-white flex flex-col">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-[#1A1D27] p-4 rounded-xl border border-gray-800 shadow-md">
                <div className="flex items-center gap-3 mb-4 md:mb-0">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Video size={24} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Live Edge Streams</h1>
                        <p className="text-xs text-gray-400">{cameras.length} Active Nodes Monitored</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Grid Layout Toggles */}
                    <div className="flex items-center bg-[#0B0F19] p-1 rounded-lg border border-gray-700">
                        <button onClick={() => setGridLayout(1)} className={`p-1.5 rounded transition cursor-pointer ${gridLayout === 1 ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>
                            <Maximize size={18} />
                        </button>
                        <button onClick={() => setGridLayout(2)} className={`p-1.5 rounded transition cursor-pointer ${gridLayout === 2 ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>
                            <Grid size={18} />
                        </button>
                        <button onClick={() => setGridLayout(3)} className={`p-1.5 rounded transition cursor-pointer ${gridLayout === 3 ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>
                            <LayoutGrid size={18} />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition cursor-pointer"
                    >
                        <Plus size={18} /> Add Camera
                    </button>
                </div>
            </div>

            {/* Video Grid */}
            {cameras.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-xl bg-[#151923]">
                    <Video size={48} className="text-gray-600 mb-4" />
                    <h2 className="text-xl font-bold text-gray-400">No Edge Streams Connected</h2>
                    <p className="text-gray-500 mt-2 max-w-md text-center">Register an IP Webcam to begin streaming and enable the HackOps Crew AI detection pipeline.</p>
                </div>
            ) : (
                <div className={`grid gap-4 flex-grow ${gridClasses[gridLayout]}`}>
                    {cameras.map((camera) => (
                        <IPWebcamPlayer key={camera.id} camera={camera} />
                    ))}
                </div>
            )}

            {/* Add Camera Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1A1D27] p-6 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Register IP Node</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleAddCamera} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Node Identifier</label>
                                    <input
                                        required type="text" placeholder="e.g., CAM-05 (Sector 9)"
                                        value={newCam.name} onChange={e => setNewCam({ ...newCam, name: e.target.value })}
                                        className="w-full bg-[#0B0F19] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Local IPv4 Address & Port</label>
                                    <input
                                        required type="url" placeholder="http://192.168.0.x:8080"
                                        value={newCam.ip_url} onChange={e => setNewCam({ ...newCam, ip_url: e.target.value })}
                                        className="w-full bg-[#0B0F19] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Ensure the device is connected to the same local network.</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Monitoring Zone</label>
                                    <select
                                        value={newCam.zone} onChange={e => setNewCam({ ...newCam, zone: e.target.value })}
                                        className="w-full bg-[#0B0F19] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="Perimeter">Perimeter Security</option>
                                        <option value="Parking">Parking Capacity Enforcement</option>
                                        <option value="Lobby">Main Lobby</option>
                                        <option value="Server Room">Server Room</option>
                                    </select>
                                </div>

                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition mt-4 cursor-pointer">
                                    Initialize Stream
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
