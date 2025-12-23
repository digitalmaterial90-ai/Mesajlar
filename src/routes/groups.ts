import express from 'express';
import { AuthService } from '../services/auth';
import { GroupModel } from '../models/group';

const router = express.Router();

// Middleware to check token
const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Auth required' });

    const decoded = AuthService.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    req.userId = decoded.userId;
    next();
};

router.use((req, res, next) => {
    console.log(`Groups Router received: ${req.method} ${req.url}`);
    next();
});

router.get('/ping', (req, res) => {
    res.json({ pong: true });
});

router.post('/', authenticate, async (req: any, res) => {
    try {
        const { name } = req.body;
        const groupId = await GroupModel.createGroup(name, req.userId);
        res.json({ groupId, name });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/:id/members', authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body; // User to add

        // In real app, check if req.userId is admin
        await GroupModel.addMember(id, userId);
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.get('/:id/members', authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const members = await GroupModel.getMembers(id);
        res.json({ members });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

export default router;
