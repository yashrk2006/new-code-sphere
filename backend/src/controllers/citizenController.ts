import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { supabaseAdmin } from '../lib/supabase';
import { analyzeIncident } from '../services/geminiAnalysisService';

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
    // AI fields
    ai_credibility_score?: number;
    ai_summary?: string;
    ai_recommended_action?: string;
    ai_image_verdict?: string;
    ai_location_context?: string;
    ai_analysis_status?: 'PENDING' | 'PROCESSING' | 'DONE' | 'SKIPPED' | 'FAILED';
}

const priorityMap: Record<string, 'CRITICAL' | 'HIGH' | 'NORMAL'> = {
    Violence: 'CRITICAL',
    Crowd: 'HIGH',
    Municipal: 'NORMAL',
};

// ─── Async AI enrichment — runs AFTER responding to the citizen ──────────────
async function runGeminiAnalysis(incident: CitizenIncident, io: Server): Promise<void> {
    // Mark as processing
    await supabaseAdmin
        .from('citizen_incidents')
        .update({ ai_analysis_status: 'PROCESSING' })
        .eq('id', incident.id);

    const result = await analyzeIncident({
        category: incident.category,
        description: incident.description,
        image_url: incident.image_url,
        location: incident.location,
    });

    // Persist results
    const { data: updated } = await supabaseAdmin
        .from('citizen_incidents')
        .update({
            ai_credibility_score: result.credibility_score,
            ai_summary: result.summary,
            ai_recommended_action: result.recommended_action,
            ai_image_verdict: result.image_verdict,
            ai_location_context: result.location_context,
            ai_analysis_status: result.status,
            // Upgrade priority if AI gives high credibility + critical category
            ai_priority: result.credibility_score >= 80 && incident.category === 'Violence'
                ? 'CRITICAL'
                : priorityMap[incident.category] || 'NORMAL',
            is_verified_red_flag: result.credibility_score >= 70 && incident.category === 'Violence',
        })
        .eq('id', incident.id)
        .select()
        .single();

    if (updated) {
        // Push enriched incident to admin dashboard in real-time
        io.emit('citizen_incident_updated', updated);
        console.log(`[Gemini] ✅ Incident ${incident.id} analyzed — score: ${result.credibility_score}, status: ${result.status}`);
    }
}

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
            ai_analysis_status: 'PENDING',
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

        // 1. Immediately notify admin of the raw report
        io.emit('citizen_incident_new', data);

        // 2. Run Gemini analysis in background (non-blocking)
        setImmediate(() => {
            runGeminiAnalysis(data as CitizenIncident, io).catch(err =>
                console.error('[Gemini] Background analysis failed:', err)
            );
        });

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

    // GET /api/citizen/incidents/:id  — full detail view with history
    getIncident: async (req: Request, res: Response) => {
        const { id } = req.params;
        const { data, error } = await supabaseAdmin
            .from('citizen_incidents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return res.status(404).json({ error: 'Incident not found' });
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
