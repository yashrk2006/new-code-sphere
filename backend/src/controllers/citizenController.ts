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

export const createCitizenControllers = (io: Server) => ({

    // POST /api/citizen/report
    submitReport: async (req: Request, res: Response) => {
        const { citizen_name, citizen_phone, category, description, image_url, location } = req.body;

        if (!category || !location) {
            return res.status(400).json({ error: 'category and location are required' });
        }

        // 1. Run Gemini AI pre-verification FIRST
        const aiResult = await analyzeIncident({
            category,
            description: description || '',
            image_url: image_url || '',
            location,
        });

        // 2. If AI determines the image/report is totally completely fake/irrelevant (score < 40)
        // Reject the submission entirely and don't bother the command center.
        if (aiResult.credibility_score < 40 && aiResult.status !== 'SKIPPED') {
            return res.status(400).json({ 
                error: 'Our AI verification system flagged this report as potentially non-genuine or irrelevant to the selected category.',
                ai_verdict: aiResult.image_verdict 
            });
        }

        // 3. Prepare the incident payload with all AI data pre-populated
        const newIncident = {
            citizen_name: citizen_name || 'Anonymous',
            citizen_phone: citizen_phone || 'Unknown',
            category,
            description: description || '',
            location,
            image_url: image_url || '',
            status: 'REPORTED',
            timestamp: new Date().toISOString(),
            // Embed AI decisions from the start
            ai_priority: aiResult.credibility_score >= 80 && category === 'Violence'
                ? 'CRITICAL'
                : priorityMap[category] || 'NORMAL',
            is_verified_red_flag: aiResult.credibility_score >= 70 && category === 'Violence',
            ai_credibility_score: aiResult.credibility_score,
            ai_summary: aiResult.summary,
            ai_recommended_action: aiResult.recommended_action,
            ai_image_verdict: aiResult.image_verdict,
            ai_location_context: aiResult.location_context,
            ai_analysis_status: aiResult.status,
        };

        // 4. Insert into Supabase
        const { data, error } = await supabaseAdmin
            .from('citizen_incidents')
            .insert(newIncident)
            .select()
            .single();

        if (error) {
            console.error('[citizen/report] Supabase error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        // 5. Instantly broadcast the fully enriched report to the admin screen
        io.emit('citizen_incident_new', data);
        console.log(`[Gemini] ✅ Pre-verified Incident ${data.id} — score: ${aiResult.credibility_score}, status: ${aiResult.status}`);

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
