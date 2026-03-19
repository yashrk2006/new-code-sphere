import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
export const AnomalyTrendChart = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const fetchTrends = async () => {
        try {
            const { data } = await axios.get(getApiUrl('/stats/anomaly-trends'));
            setData(data);
        }
        catch (err) {
            console.error('Failed to fetch anomaly trends', err);
            // Fallback demo data
            const now = new Date().getHours();
            setData(Array.from({ length: 24 }, (_, i) => ({
                hour: `${i.toString().padStart(2, '0')}:00`,
                alerts: i <= now ? Math.floor(Math.random() * 12) + 1 : 0,
            })));
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchTrends();
        const interval = setInterval(fetchTrends, 60000);
        return () => clearInterval(interval);
    }, []);
    const totalAlerts = data.reduce((sum, d) => sum + d.alerts, 0);
    const peakHour = data.reduce((max, d) => d.alerts > max.alerts ? d : max, { hour: '--', alerts: 0 });
    return (_jsxs("div", { className: "bg-[#151923] rounded-xl border border-gray-800 shadow-xl overflow-hidden mt-6", children: [_jsxs("div", { className: "p-4 border-b border-gray-800 flex justify-between items-center bg-[#1A1D27]", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { size: 16, className: "text-red-400" }), _jsx("h3", { className: "font-bold text-white text-sm", children: "Anomaly Frequency (24h)" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-3 text-xs", children: [_jsxs("span", { className: "text-gray-500", children: ["Total: ", _jsx("span", { className: "text-white font-bold", children: totalAlerts })] }), _jsxs("span", { className: "text-gray-500", children: ["Peak: ", _jsx("span", { className: "text-red-400 font-bold", children: peakHour.hour })] })] }), _jsx("button", { onClick: fetchTrends, className: "p-1.5 rounded-lg hover:bg-gray-800 transition text-gray-500 hover:text-white", title: "Refresh trends", children: _jsx(RefreshCw, { size: 14 }) })] })] }), _jsx("div", { className: "p-4 h-56", children: isLoading ? (_jsx("div", { className: "h-full flex items-center justify-center text-gray-600 text-sm", children: "Loading trend data..." })) : (_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: data, margin: { top: 5, right: 10, left: -20, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "alertGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#EF4444", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#EF4444", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#1e2533" }), _jsx(XAxis, { dataKey: "hour", stroke: "#4b5563", fontSize: 10, tickLine: false, interval: 2 }), _jsx(YAxis, { stroke: "#4b5563", fontSize: 10, tickLine: false, axisLine: false }), _jsx(Tooltip, { contentStyle: {
                                    backgroundColor: '#0d0e12',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }, itemStyle: { color: '#ef4444' }, labelStyle: { color: '#9ca3af', fontWeight: 'bold' } }), _jsx(Area, { type: "monotone", dataKey: "alerts", stroke: "#EF4444", strokeWidth: 2, fill: "url(#alertGradient)", dot: { r: 3, fill: '#EF4444', strokeWidth: 0 }, activeDot: { r: 5, fill: '#EF4444', stroke: '#fff', strokeWidth: 2 } })] }) })) })] }));
};
