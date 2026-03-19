import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';

// Load env BEFORE importing routes (routes may read env at module level)
dotenv.config();

import authRoutes from './routes/authRoutes';
import alertRoutes from './routes/alertRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import edgeRoutes from './routes/edgeRoutes';
import securityRoutes from './routes/securityRoutes';
import storageRoutes from './routes/storageRoutes';
import settingsRoutes from './routes/settingsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import statsRoutes from './routes/statsRoutes';
import reportRoutes from './routes/reportRoutes';
import cameraRoutes from './routes/cameraRoutes';
import { addNotification, AppNotification as SystemNotification } from './controllers/notificationController';

import { alertStore, AnomalyAlert } from './controllers/alertController';
import { edgeNodes } from './controllers/edgeController';

// ── Event bus: bridges REST → WebSocket broadcasts ──
export const eventBus = new EventEmitter();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/edge', edgeRoutes(io));
app.use('/api/security', securityRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/cameras', cameraRoutes);


// Health check
app.get('/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: String(error) });
    }
});

// ── Socket.IO ──
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Bridge: REST anomaly → broadcast to all WS clients
    const onBroadcastAnomaly = (anomaly: AnomalyAlert) => {
        io.emit('new_anomaly', anomaly);
    };
    eventBus.on('broadcast_anomaly', onBroadcastAnomaly);

    // Send initial cameras list
    const initialCameras = [
        { id: 'CAM-04', name: 'Primary Intelligence', status: 'online', lat: 28.6139, lng: 77.2090 },
        { id: 'CAM-01', name: 'Main Gate', status: 'online', lat: 28.6139, lng: 77.2090 },
        { id: 'CAM-02', name: 'Perimeter Fence A', status: 'online', lat: 28.6186, lng: 77.2153 },
        { id: 'CAM-03', name: 'Parking Structure', status: 'offline', lat: 28.6100, lng: 77.2000 }
    ];
    socket.emit('init_cameras', initialCameras);

    // Mock AI anomaly publisher (simulates Python edge until vision_engine.py is connected)
    const mockImages = [
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
        'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800',
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800',
        'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=800',
    ];

    /*
    const mockAnomalyInterval = setInterval(() => {
        const severities: Array<'Low' | 'Medium' | 'Critical'> = ['Low', 'Medium', 'Critical'];
        const types: Array<AnomalyAlert['type']> = ['PARKING_VIOLATION', 'CAPACITY_EXCEEDED', 'UNAUTHORIZED_VEHICLE', 'SUSPICIOUS_BEHAVIOR'];
        const anomaly: AnomalyAlert = {
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            camera_id: `CAM-0${Math.floor(Math.random() * 3) + 1}`,
            type: types[Math.floor(Math.random() * types.length)],
            severity: severities[Math.floor(Math.random() * 3)],
            confidence: Math.round((Math.random() * 20 + 80) * 100) / 100,
            image_url: mockImages[Math.floor(Math.random() * mockImages.length)],
            status: 'Pending',
            timestamp: new Date().toISOString(),
        };
        alertStore.set(anomaly.id, anomaly);
        if (alertStore.size > 500) {
            const oldest = alertStore.keys().next().value;
            if (oldest) alertStore.delete(oldest);
        }
        io.emit('new_anomaly', anomaly);
    }, 8000);
    */

    // Mock Edge Heartbeat
    const edgeHeartbeatInterval = setInterval(() => {
        for (const node of edgeNodes.values()) {
            if (node.status === 'offline') continue;
            const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
            node.metrics.cpu_usage = clamp(node.metrics.cpu_usage + (Math.random() * 10 - 5), 15, 95);
            node.metrics.ram_usage = clamp(node.metrics.ram_usage + (Math.random() * 6 - 3), 30, 92);
            node.metrics.temperature = clamp(node.metrics.temperature + (Math.random() * 4 - 2), 38, 88);
            node.metrics.uptime += 10;
            node.last_heartbeat = new Date().toISOString();
            node.metrics.cpu_usage = Math.round(node.metrics.cpu_usage * 10) / 10;
            node.metrics.ram_usage = Math.round(node.metrics.ram_usage * 10) / 10;
            node.metrics.temperature = Math.round(node.metrics.temperature * 10) / 10;
            io.emit('edge_heartbeat', { id: node.id, status: node.status, metrics: node.metrics, timestamp: node.last_heartbeat });
        }
    }, 10000);

    // Mock AI Bounding Boxes (simulates vision_engine.py output)
    /*
    const boxLabels = [
        { label: 'Vehicle', color: '#22C55E' },
        { label: 'Person', color: '#3B82F6' },
        { label: 'Missing Safety Gear', color: '#EF4444' },
        { label: 'Parking Violation', color: '#F59E0B' },
        { label: 'Unauthorized Access', color: '#EC4899' },
    ];
    const boxInterval = setInterval(() => {
        const numBoxes = Math.floor(Math.random() * 3) + 1;
        const boxes = Array.from({ length: numBoxes }, (_, i) => {
            const tmpl = boxLabels[Math.floor(Math.random() * boxLabels.length)];
            return {
                id: `box_${Date.now()}_${i}`,
                label: tmpl.label,
                confidence: 0.85 + Math.random() * 0.14,
                color: tmpl.color,
                x: 10 + Math.random() * 40,
                y: 10 + Math.random() * 40,
                width: 12 + Math.random() * 20,
                height: 15 + Math.random() * 25,
            };
        });
        io.emit('boxes_CAM-04', boxes);
    }, 3000);
    */

    // Mock System Notifications
    const systemAlertTemplates: Array<{ title: string; message: string; type: SystemNotification['type'] }> = [
        { title: 'Parking Zone Near Capacity', message: 'Zone C-2 is at 88% capacity. 132/150 slots occupied.', type: 'warning' },
        { title: 'Edge Node Recovered', message: 'edge-jetson-02 reconnected after 2m downtime.', type: 'info' },
        { title: 'Critical: Perimeter Breach', message: 'CAM-02 detected motion in restricted zone after hours.', type: 'critical' },
        { title: 'Storage Warning', message: 'S3 bucket utilization exceeded 80%.', type: 'warning' },
    ];
    const systemAlertInterval = setInterval(() => {
        const tmpl = systemAlertTemplates[Math.floor(Math.random() * systemAlertTemplates.length)];
        const notif: SystemNotification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            ...tmpl,
            is_read: false,
            created_at: new Date().toISOString(),
        };
        addNotification(notif);
        io.emit('system_alert', notif);
    }, 25000);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // clearInterval(mockAnomalyInterval); // Removed since it is commented out
        clearInterval(edgeHeartbeatInterval);
        clearInterval(systemAlertInterval);
        // clearInterval(boxInterval); // Removed since it is commented out
        eventBus.off('broadcast_anomaly', onBroadcastAnomaly);
    });
});

httpServer.listen(PORT, () => {
    console.log(`\n🚀 Vision AIoT Backend running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Supabase:     ${process.env.SUPABASE_URL || '⚠ not set'}\n`);
});
