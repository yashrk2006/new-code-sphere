import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuditLogModel } from '../models';

export type AlertStatus = 'Pending' | 'Investigating' | 'Resolved' | 'False Positive';

export interface AnomalyAlert {
    id: string;
    camera_id: string;
    type: 'PARKING_VIOLATION' | 'CAPACITY_EXCEEDED' | 'UNAUTHORIZED_VEHICLE' | 'SUSPICIOUS_BEHAVIOR';
    severity: 'Low' | 'Medium' | 'Critical';
    confidence: number;
    image_url: string;
    status: AlertStatus;
    timestamp: string;
    operator_notes?: string;
}

// In-memory alert store (stands in for PostgreSQL when DB is unavailable)
export const alertStore = new Map<string, AnomalyAlert>();

/** GET /api/alerts — return all alerts, newest first */
export const getAlerts = (_req: Request, res: Response): void => {
    const alerts = Array.from(alertStore.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json(alerts);
};

/** PUT /api/alerts/:id — update status & operator_notes */
export const updateAlert = (req: Request, res: Response): void => {
    const id = req.params.id as string;
    const { status, notes } = req.body as { status?: AlertStatus; notes?: string };

    const alert = alertStore.get(id);

    if (!alert) {
        res.status(404).json({ error: 'Alert not found' });
        return;
    }

    if (status) alert.status = status;
    if (notes !== undefined) alert.operator_notes = notes;

    alertStore.set(id, alert);

    console.log(`[Alert Updated] ${id} → ${status}`);
    res.json(alert);
};

/** POST /api/alerts — receive a new anomaly from Edge Node */
export const createAlert = async (req: Request, res: Response): Promise<void> => {
    // ─── JWT Authentication ───
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: "Missing or invalid Authorization header" });
        return;
    }

    let edgeNodeId = 'Unknown Node';
    try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'hackops-crew-secret-key-2026';
        const decoded = jwt.verify(token, secret) as any;
        edgeNodeId = decoded.edge_node || req.body.location || 'CAM-04';

        // Log Token Usage to Audit Trail
        const log = new AuditLogModel({
            action: `${edgeNodeId} authenticated via Edge Token.`,
            actor_email: 'edge-system',
            ip_address: req.ip || '0.0.0.0'
        });
        await log.save();
    } catch (e) {
        console.log(`[Auth Failed] Invalid Edge Token from ${req.ip}`);
        res.status(401).json({ error: "Unauthorized Edge Node: Invalid Token" });
        return;
    }
    // ──────────────────────────

    const { type, location, confidence, timestamp } = req.body;
    
    // Convert logic from python payload
    const confDec = confidence ? confidence / 100 : 0.85;

    const anomaly: AnomalyAlert = {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        camera_id: location || edgeNodeId,
        type: (type || 'UNKNOWN').replace('-', '_').toUpperCase() as any,
        severity: confDec > 0.85 ? 'Critical' : confDec > 0.6 ? 'Medium' : 'Low',
        confidence: confDec,
        image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
        status: 'Pending',
        timestamp: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString()
    };
    
    alertStore.set(anomaly.id, anomaly);
    if (alertStore.size > 500) {
        const oldestKey = alertStore.keys().next().value;
        if (oldestKey) alertStore.delete(oldestKey);
    }
    
    console.log(`[Edge Anomaly REST] ${anomaly.type} at ${anomaly.camera_id}`);
    
    // Trigger socket broadcast globally
    try {
        const { eventBus } = require('../index');
        eventBus.emit('broadcast_anomaly', anomaly);
    } catch (e) {}

    res.status(201).json(anomaly);
};
