import { Request, Response } from 'express';

export interface CameraNode {
    id: string;
    name: string;
    ip_url: string;
    zone: string;
    status: 'online' | 'offline' | 'connecting';
    fps: number;
}

// In-memory camera registry
export const cameraStore = new Map<string, CameraNode>([
    ['cam-01', { id: 'cam-01', name: 'Main Gate', ip_url: 'http://192.168.1.10:8080', zone: 'Perimeter', status: 'online', fps: 30 }],
    ['cam-02', { id: 'cam-02', name: 'Fenced Area A', ip_url: 'http://192.168.1.11:8080', zone: 'Perimeter', status: 'online', fps: 24 }],
    ['cam-03', { id: 'cam-03', name: 'Parking Entrance', ip_url: 'http://192.168.1.12:8080', zone: 'Parking', status: 'offline', fps: 0 }],
    ['cam-04', { id: 'cam-04', name: 'CAM-04 (Sector 9)', ip_url: 'http://192.168.0.4:8080', zone: 'Sector 9', status: 'online', fps: 30 }],
]);

/** GET /api/cameras — List all registered cameras */
export const getCameras = (_req: Request, res: Response): void => {
    res.json(Array.from(cameraStore.values()));
};

/** POST /api/cameras — Register a new camera */
export const addCamera = (req: Request, res: Response): void => {
    const { name, ip_url, zone } = req.body;
    if (!name || !ip_url) {
        res.status(400).json({ error: 'Name and IP URL are required' });
        return;
    }

    const id = `cam-${Date.now()}`;
    const newCam: CameraNode = {
        id,
        name,
        ip_url,
        zone: zone || 'Default',
        status: 'connecting',
        fps: 0
    };

    cameraStore.set(id, newCam);
    res.status(201).json(newCam);
};

/** DELETE /api/cameras/:id — Remove a camera */
export const removeCamera = (req: Request, res: Response): void => {
    const id = req.params.id as string;
    if (!cameraStore.has(id)) {
        res.status(404).json({ error: 'Camera not found' });
        return;
    }

    cameraStore.delete(id);
    res.json({ success: true });
};

