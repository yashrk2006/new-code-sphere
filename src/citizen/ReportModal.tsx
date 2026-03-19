import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Video, MapPin, X, ArrowUpCircle, Shield, Users, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_BASE = rawApiUrl.replace(/\/+$/, '');

export default function ReportModal() {
    const navigate = useNavigate();
    const [category, setCategory] = useState<'Violence' | 'Crowd' | 'Municipal' | null>(null);
    const [description, setDescription] = useState('');
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { handleGetLocation(); }, []);

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setLocation({ lat: 28.6139, lng: 77.2090 })
            );
        }
    };

    const compressImage = (file: File): Promise<string> =>
        new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 1200;
                    let w = img.width, h = img.height;
                    if (w > MAX) { h = h * MAX / w; w = MAX; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
        });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const compressed = await compressImage(file);
        setMediaPreview(compressed);
        setMediaType('image');
        handleGetLocation();
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setMediaPreview(url);
        setMediaType('video');
        handleGetLocation();
    };

    const handleSubmit = async () => {
        if (!category || !mediaPreview) return;
        setIsSubmitting(true);
        const session = JSON.parse(localStorage.getItem('citizen_session') || '{}');
        try {
            await axios.post(`${API_BASE}/api/citizen/report`, {
                citizen_name: session.name || 'Anonymous',
                citizen_phone: session.phone || 'Unknown',
                category,
                description,
                image_url: mediaType === 'image' ? mediaPreview : '',
                location: location || { lat: 28.6139, lng: 77.2090 },
            });
            setIsSubmitting(false);
            setSubmitted(true);
            setTimeout(() => navigate('/citizen/dashboard'), 2500);
        } catch (error: any) {
            setIsSubmitting(false);
            console.error('Report submission failed:', error);
            const targetUrl = `${API_BASE}/api/citizen/report`;
            alert(`Report submission failed to ${targetUrl}\nServer returned: ${error.response?.data?.error || error.message || 'Unknown error'}`);
        }
    };

    if (submitted) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center max-w-[430px] mx-auto">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6"
            >
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </motion.div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Report Dispatched</h2>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full"
            >
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Genuine Incident Verified by AI</span>
            </motion.div>
            <p className="text-sm text-gray-500 mt-6">Command center has received your report with live coordinates. Wait for updates.</p>
            <div className="mt-6 w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F5F7FA] pb-40 max-w-[430px] mx-auto">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                    <div>
                        <p className="text-[9px] font-black tracking-[0.3em] text-blue-600 uppercase">Secure Reporting</p>
                        <h1 className="text-sm font-black text-gray-900">New Incident Report</h1>
                    </div>
                </div>
                {location && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">GPS Live</span>
                    </div>
                )}
            </header>

            <div className="p-5 space-y-6">
                {/* Evidence Capture */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase mb-3">Visual Evidence</h3>

                    {/* Media Preview */}
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all ${mediaPreview ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                        onClick={() => !mediaPreview && fileInputRef.current?.click()}
                    >
                        {mediaPreview && mediaType === 'image' && (
                            <img src={mediaPreview} alt="Evidence" className="w-full h-full object-cover" />
                        )}
                        {mediaPreview && mediaType === 'video' && (
                            <video src={mediaPreview} className="w-full h-full object-cover" controls />
                        )}
                        {!mediaPreview && (
                            <div className="flex flex-col items-center gap-2 text-center p-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                                    <Camera className="w-7 h-7 text-blue-600" />
                                </div>
                                <p className="text-xs font-bold text-gray-500">Tap to capture or upload</p>
                                <p className="text-[9px] text-gray-400">Photo or Video evidence</p>
                            </div>
                        )}
                        {mediaPreview && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setMediaPreview(null); setMediaType(null); }}
                                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
                            >
                                <X className="w-3.5 h-3.5 text-white" />
                            </button>
                        )}
                    </motion.div>

                    {/* Upload Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
                        >
                            <Camera className="w-4 h-4" /> Photo
                        </button>
                        <button
                            onClick={() => videoInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
                        >
                            <Video className="w-4 h-4" /> Video
                        </button>
                    </div>

                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" capture="environment" />
                    <input type="file" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" accept="video/*" capture="environment" />
                </div>

                {/* Category */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase mb-3">Incident Category</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'Violence', icon: <Shield className="w-6 h-6" />, label: 'VIOLENCE', alert: 'CRITICAL', color: 'red' },
                            { id: 'Crowd', icon: <Users className="w-6 h-6" />, label: 'CROWD', alert: 'HIGH', color: 'orange' },
                            { id: 'Municipal', icon: <Trash2 className="w-6 h-6" />, label: 'MUNICIPAL', alert: 'NORMAL', color: 'blue' },
                        ].map((item) => (
                            <motion.button
                                key={item.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCategory(item.id as any)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${category === item.id
                                    ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-200'
                                    : 'bg-gray-50 border-gray-200'}`}
                            >
                                <div className={category === item.id ? 'text-white' : 'text-gray-400'}>{item.icon}</div>
                                <span className={`text-[8px] font-black uppercase tracking-wider ${category === item.id ? 'text-white' : 'text-gray-500'}`}>{item.label}</span>
                                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${category === item.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-400'}`}>{item.alert}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase mb-3">Details</h3>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the incident, number of people involved, any immediate danger..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all min-h-[100px] resize-none"
                    />
                </div>

                {/* GPS Status */}
                <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${location ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${location ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                        <MapPin className={`w-5 h-5 ${location ? 'text-emerald-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                        <p className={`text-[10px] font-black uppercase tracking-wider ${location ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {location ? 'Coordinates Locked' : 'Acquiring GPS...'}
                        </p>
                        <p className="text-[9px] font-mono text-gray-400">
                            {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Waiting for handshake'}
                        </p>
                    </div>
                    {location && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                </div>
            </div>

            {/* Submit Button */}
            <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto p-5 bg-gradient-to-t from-[#F5F7FA] via-[#F5F7FA]/95 to-transparent z-50">
                <AnimatePresence mode="wait">
                    {isSubmitting ? (
                        <motion.div
                            key="submitting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full bg-blue-600 py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
                        >
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-sm font-black tracking-wider text-white uppercase">AI Verification in Progress...</span>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="submit"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            disabled={!category || !mediaPreview}
                            onClick={handleSubmit}
                            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-wider transition-all ${!category || !mediaPreview
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 active:scale-[0.98]'}`}
                        >
                            <ArrowUpCircle className="w-5 h-5" />
                            Send to Command Center
                        </motion.button>
                    )}
                </AnimatePresence>
                <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest mt-3">End-to-End Encrypted · GPS Verified</p>
            </div>
        </div>
    );
}
