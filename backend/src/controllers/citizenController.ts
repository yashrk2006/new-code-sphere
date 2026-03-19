import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { supabaseAdmin } from '../lib/supabase';

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

const priorityMap: Record<string, 'CRITICAL' | 'HIGH' | 'NORMAL'> = {
    Violence: 'CRITICAL',
    Crowd: 'HIGH',
    Municipal: 'NORMAL',
};

export const createCitizenControllers = (io: Server) => ({

    // POST /api/citizen/report
    submitReport: async (req: Request, res: Response) => {
        const { citizen_name, citizen_phone, category, description, image_url, location } = req.body;

        if (!category || !location) {
            return res.status(400).json({ error: 'category and location are required' });
        }

        const newIncident = {
            citizen_name: citizen_name || 'Anonymous',
            citizen_phone: citizen_phone || 'Unknown',
            category,
            description: description || '',
            location,
            image_url: image_url || '',
            status: 'REPORTED',
            ai_priority: priorityMap[category] || 'NORMAL',
            is_verified_red_flag: category === 'Violence',
            timestamp: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
            .from('citizen_incidents')
            .insert(newIncident)
            .select()
            .single();

        if (error) {
            console.error('[citizen/report] Supabase error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        // Emit real-time event to all connected admin dashboards
        io.emit('citizen_incident_new', data);

        return res.status(201).json(data);
    },

    // GET /api/citizen/incidents
    getIncidents: async (_req: Request, res: Response) => {
        const { data, error } = await supabaseAdmin
            .from('citizen_incidents')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('[citizen/incidents] Supabase error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        return res.json(data);
    },

    // POST /api/citizen/incidents/:id/dispatch
    dispatchIncident: async (req: Request, res: Response) => {
        const { id } = req.params;
        const eta = `${Math.floor(Math.random() * 10) + 3} min`;

        const { data, error } = await supabaseAdmin
            .from('citizen_incidents')
            .update({ status: 'TEAM DISPATCHED', eta })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[citizen/dispatch] Supabase error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        io.emit('citizen_incident_updated', data);
        return res.json(data);
    },

    // POST /api/citizen/incidents/:id/resolve
    resolveIncident: async (req: Request, res: Response) => {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('citizen_incidents')
            .update({
                status: 'RESOLVED',
                resolution_image_url: req.body.image_url || '',
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[citizen/resolve] Supabase error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        io.emit('citizen_incident_updated', data);
        return res.json(data);
    },
});
