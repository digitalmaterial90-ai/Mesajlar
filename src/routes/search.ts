import express from 'express';
import { AuthService } from '../services/auth';
import { SearchService } from '../services/search';

const router = express.Router();

const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Auth required' });

    const decoded = AuthService.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    req.userId = decoded.userId;
    next();
};

// Search messages
router.get('/messages', authenticate, async (req: any, res) => {
    try {
        const { q, limit } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const results = await SearchService.searchMessages(
            req.userId,
            q as string,
            limit ? parseInt(limit as string) : 20
        );

        res.json({ results });
    } catch (e) {
        console.error("Search error", e);
        res.status(500).json({ error: 'Failed' });
    }
});

export default router;
