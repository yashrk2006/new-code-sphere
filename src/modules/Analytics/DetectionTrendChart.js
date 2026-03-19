import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
export default function DetectionTrendChart({ rawData }) {
    const formattedData = rawData.map((d) => ({
        time: new Date(d.time_bucket).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        Count: Number(d.anomaly_count),
    }));
    return (_jsx("div", { className: "h-80 w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: formattedData, margin: { top: 5, right: 20, bottom: 5, left: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "trendGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#1e293b", vertical: false }), _jsx(XAxis, { dataKey: "time", stroke: "#334155", tick: { fill: '#64748b', fontSize: 12 }, tickLine: false, axisLine: false, tickMargin: 10 }), _jsx(YAxis, { stroke: "#334155", tick: { fill: '#64748b', fontSize: 12 }, tickLine: false, axisLine: false, allowDecimals: false }), _jsx(Tooltip, { contentStyle: {
                            backgroundColor: '#0f172a',
                            borderColor: '#1e293b',
                            borderRadius: '12px',
                            color: '#fff',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        }, itemStyle: { color: '#60A5FA' } }), _jsx(Area, { type: "monotone", dataKey: "Count", stroke: "transparent", fill: "url(#trendGradient)" }), _jsx(Line, { type: "monotone", dataKey: "Count", stroke: "#3B82F6", strokeWidth: 3, dot: { r: 4, fill: '#3B82F6', strokeWidth: 0 }, activeDot: { r: 6, fill: '#60a5fa', stroke: '#3b82f6', strokeWidth: 2 } })] }) }) }));
}
