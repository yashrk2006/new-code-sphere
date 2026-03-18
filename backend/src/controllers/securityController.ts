import { Request, Response } from 'express';
import { UserModel, AuditLogModel, TokenModel } from '../models';

// ─── Handlers ───────────────────────────────────────────────

/** GET /api/security/users */
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const users = await UserModel.find().sort({ created_at: -1 });
        // Map _id to id for frontend compatibility
        res.json(users.map(u => ({ ...u.toObject(), id: u._id })));
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/** POST /api/security/users/invite */
export const inviteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, role } = req.body;
        const newUser = new UserModel({ email, role });
        await newUser.save();

        const log = new AuditLogModel({
            action: `New User Invited (${email})`,
            actor_email: 'admin@visionaiot.dev',
            ip_address: req.ip || '0.0.0.0',
        });
        await log.save();

        res.status(201).json({ ...newUser.toObject(), id: newUser._id });
    } catch (err) {
        res.status(500).json({ error: "Failed to invite user" });
    }
};

/** DELETE /api/security/users/:id */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const result = await UserModel.findByIdAndDelete(id);
        
        if (!result) { res.status(404).json({ error: 'User not found' }); return; }
        
        const log = new AuditLogModel({
            action: `User Account Revoked (${result.email})`,
            actor_email: 'admin@visionaiot.dev',
            ip_address: req.ip || '0.0.0.0',
        });
        await log.save();

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

/** GET /api/security/logs */
export const getLogs = async (_req: Request, res: Response): Promise<void> => {
    try {
        const logs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs.map(l => ({ ...l.toObject(), id: l._id })));
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

/** GET /api/security/tokens */
export const getTokens = async (_req: Request, res: Response): Promise<void> => {
    try {
        const tokens = await TokenModel.find().sort({ created_at: -1 });
        res.json(tokens.map(t => ({ ...t.toObject(), id: t._id })));
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch tokens' });
    }
};

/** POST /api/security/tokens — Generate new token */
export const createToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, scopes } = req.body as { name: string; scopes: string[] };
        
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'hackops-crew-secret-key-2026';
        
        // Generate a REAL JSON Web Token
        const tokenString = jwt.sign({ edge_node: name, scopes }, JWT_SECRET, { expiresIn: '365d' });
        const tokenPrefix = `viot_sk_${tokenString.split('.')[2].substring(0, 10)}...`;

        const newToken = new TokenModel({
            name: name || `key-${Date.now()}`,
            token_prefix: tokenPrefix,
            scopes: scopes || ['inference:push'],
        });
        await newToken.save();

        const log = new AuditLogModel({
            action: `API Token Generated: ${newToken.name}`,
            actor_email: 'admin@visionaiot.dev',
            ip_address: req.ip || '0.0.0.0',
        });
        await log.save();

        // Return the full token string *only once* in the creation response
        res.json({ ...newToken.toObject(), id: newToken._id, plain_token: tokenString });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create token' });
    }
};

/** DELETE /api/security/tokens/:id — Revoke token */
export const revokeToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const token = await TokenModel.findById(id);
        
        if (!token) { res.status(404).json({ error: 'Token not found' }); return; }
        
        token.status = 'revoked';
        await token.save();

        const log = new AuditLogModel({
            action: `API Token Revoked: ${token.name}`,
            actor_email: 'admin@visionaiot.dev',
            ip_address: req.ip || '0.0.0.0',
        });
        await log.save();

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to revoke token' });
    }
};
