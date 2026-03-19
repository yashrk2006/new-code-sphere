import { Request, Response } from 'express';

export const register = async (req: Request, res: Response) => {
    res.json({ token: 'mock-token', user: { id: 1, name: req.body.name, email: req.body.email, role: 'ADMIN' } });
};

export const login = async (req: Request, res: Response) => {
    res.json({ token: 'mock-token', user: { id: 1, name: 'Admin', email: req.body.email, role: 'ADMIN' } });
};
