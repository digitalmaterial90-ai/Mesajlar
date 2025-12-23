import express from 'express';
import { AuthService } from '../services/auth';
import { MediaService } from '../services/media';

const router = express.Router();

const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Auth required' });

    const decoded = AuthService.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    req.userId = decoded.userId;
    next();
};

router.post('/presign', authenticate, async (req: any, res) => {
    try {
        const { contentType, size } = req.body;

        if (!contentType || !size) {
            return res.status(400).json({ error: 'contentType and size are required' });
        }

        const data = await MediaService.getPresignedUploadUrl(req.userId, contentType, size);
        res.json(data);
    } catch (e) {
        console.error("Presign Error", e);
        res.status(500).json({ error: 'Failed' });
    }
});

export default router;
