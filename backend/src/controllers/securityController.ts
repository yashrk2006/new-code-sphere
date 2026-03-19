import { Request, Response } from 'express';
import { supabase, writeAuditLog } from '../models';

// ─── Handlers ───────────────────────────────────────────────

/** GET /api/security/users */
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('security_users')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to fetch users', detail: e.message });
    }
};

/** POST /api/security/users/invite */
export const inviteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, role } = req.body;
        const { data, error } = await supabase
            .from('security_users')
            .insert([{ email, role }])
            .select()
            .single();
        if (error) throw error;

        await writeAuditLog({
            action: `New User Invited (${email})`,
            actor_email: 'admin@visionaiot.dev',
            ip_address: req.ip || '0.0.0.0',
        });

        res.status(201).json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to invite user', detail: err.message });
    }
};

/** DELETE /api/security/users/:id */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { data: existing, error: findErr } = await supabase
            .from('security_users')
            .select('email')
            .eq('id', id)
            .single();
        if (findErr || !existing) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const { error } = await supabase.from('security_users').delete().eq('id', id);
        if (error) throw error;

        await writeAuditLog({
            action: `User Account Revoked (${existing.email})`,
            actor_email: 'admin@visionaiot.dev',
            ip_address: req.ip || '0.0.0.0',
        });

        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to delete user', detail: e.message });
    }
};

/** GET /api/security/logs */
export const getLogs = async (_req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(50);
        if (error) throw error;
        res.json(data || []);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to fetch logs', detail: e.message });
    }
};

/** GET /api/security/tokens */
export const getTokens = async (_req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('edge_tokens')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to fetch tokens', detail: e.message });
    }
};

/** POST /api/security/tokens — Generate new edge token */
export const createToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, scopes } = req.body as { name: string; scopes: string[] };

        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'hackops-crew-secret-key-2026';

        // Generate a REAL JSON Web Token
        const tokenString = jwt.sign({ edge_node: name, scopes }, JWT_SECRET, { expiresIn: '365d' });
        const tokenPrefix = `viot_sk_${tokenString.split('.')[2].substring(0, 10)}...`;

        const { data, error } = await supabase
            .from('edge_tokens')
            .insert([{
                name: name || `key-${Date.now()}`,
                token_prefix: tokenPrefix,
                scopes: scopes || ['inference:push'],
            }])
            .select()
            .single();
        if (error) throw error;

        await writeAuditLog({
            action: `API Token Generated: ${name}`,
            actor_email: 'admin@visionaiot.dev',
            ip_address: req.ip || '0.0.0.0',
        });

        // Return the full token string *only once* in the creation response
        res.json({ ...data, plain_token: tokenString });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to create token', detail: e.message });
    }
};

/** DELETE /api/security/tokens/:id — Revoke token */
export const revokeToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { data: existing, error: findErr } = await supabase
            .from('edge_tokens')
            .select('name')
            .eq('id', id)
            .single();
        if (findErr || !existing) {
            res.status(404).json({ error: 'Token not found' });
            return;
        }

        const { error } = await supabase.from('edge_tokens').update({ status: 'revoked' }).eq('id', id);
        if (error) throw error;

        await writeAuditLog({
            action: `API Token Revoked: ${existing.name}`,
            actor_email: 'admin@visionaiot.dev',
            ip_address: req.ip || '0.0.0.0',
        });

        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to revoke token', detail: e.message });
    }
};
