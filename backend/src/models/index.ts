import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// ─── Supabase Client ─────────────────────────────────────────
// Replaces all Mongoose/MongoDB usage from the original codebase.
// Tables managed here: security_users, audit_logs, edge_tokens
// (Run supabase/migrations/001_init.sql in your Supabase SQL Editor first)
export const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ─── Type Definitions ────────────────────────────────────────

export interface SecurityUser {
    id?: string;
    email: string;
    role: 'Admin' | 'Operator' | 'Viewer';
    status?: string;
    created_at?: string;
}

export interface AuditLog {
    id?: string;
    action: string;
    actor_email: string;
    ip_address: string;
    timestamp?: string;
}

export interface EdgeToken {
    id?: string;
    name: string;
    token_prefix: string;
    scopes?: string[];
    status?: 'active' | 'revoked';
    created_at?: string;
    last_used?: string | null;
}

// ─── Helper: Write Audit Log ─────────────────────────────────
export async function writeAuditLog(log: AuditLog): Promise<void> {
    const { error } = await supabase.from('audit_logs').insert([log]);
    if (error) {
        console.error('[Audit Log Error]', error.message);
    }
}
