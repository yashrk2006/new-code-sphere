import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';

export interface CitizenIncident {
    id: string;
    citizen_name: string;
    citizen_phone: string;
    category: 'Violence' | 'Crowd' | 'Municipal';
    description: string;
    location: { lat: number; lng: number };
    image_url: string;
    status: 'REPORTED' | 'UNDER REVIEW' | 'TEAM DISPATCHED' | 'RESOLVED';
    resolution_image_url?: string;
    timestamp: string;
    ai_priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
    is_verified_red_flag: boolean;
    eta?: string;
}

// In-memory store (swap with DB later)
export const citizenIncidents: CitizenIncident[] = [];

const priorityMap: Record<string, 'CRITICAL' | 'HIGH' | 'NORMAL'> = {
    Violence: 'CRITICAL',
    Crowd: 'HIGH',
    Municipal: 'NORMAL',
};

export const createCitizenControllers = (io: Server) => ({

    // POST /api/citizen/report
    submitReport: (req: Request, res: Response) => {
        const { citizen_name, citizen_phone, category, description, image_url, location } = req.body;

        if (!category || !location) {
            return res.status(400).json({ error: 'category and location are required' });
        }

        const incident: CitizenIncident = {
            id: uuid(),
            citizen_name: citizen_name || 'Anonymous',
            citizen_phone: citizen_phone || 'Unknown',
            category,
            description: description || '',
            location,
            image_url: image_url || '',
            status: 'REPORTED',
            timestamp: new Date().toISOString(),
            ai_priority: priorityMap[category] || 'NORMAL',
            is_verified_red_flag: category === 'Violence',
        };

        citizenIncidents.unshift(incident);

        // Emit real-time event to all connected admin dashboards
        io.emit('citizen_incident_new', incident);

        return res.status(201).json(incident);
    },

    // GET /api/citizen/incidents
    getIncidents: (_req: Request, res: Response) => {
        return res.json(citizenIncidents);
    },

    // POST /api/citizen/incidents/:id/dispatch
    dispatchIncident: (req: Request, res: Response) => {
        const { id } = req.params;
        const incident = citizenIncidents.find(i => i.id === id);
        if (!incident) return res.status(404).json({ error: 'Incident not found' });

        incident.status = 'TEAM DISPATCHED';
        incident.eta = `${Math.floor(Math.random() * 10) + 3} min`;

        io.emit('citizen_incident_updated', incident);
        return res.json(incident);
    },

    // POST /api/citizen/incidents/:id/resolve
    resolveIncident: (req: Request, res: Response) => {
        const { id } = req.params;
        const incident = citizenIncidents.find(i => i.id === id);
        if (!incident) return res.status(404).json({ error: 'Incident not found' });

        incident.status = 'RESOLVED';
        incident.resolution_image_url = req.body.image_url || '';

        io.emit('citizen_incident_updated', incident);
        return res.json(incident);
    },
});
