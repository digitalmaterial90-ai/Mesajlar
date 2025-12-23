import express from 'express';
import { AuthService } from '../services/auth';
import { notificationService } from '../services/notification';

const router = express.Router();

const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Auth required' });

    const decoded = AuthService.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    req.userId = decoded.userId;
    next();
};

// Register device token for push notifications
router.post('/register-device', authenticate, async (req: any, res) => {
    try {
        const { token, platform } = req.body;

        if (!token || !platform) {
            return res.status(400).json({ error: 'token and platform are required' });
        }

        notificationService.registerDevice(req.userId, token, platform);
        res.json({ status: 'ok' });
    } catch (e) {
        console.error("Device registration error", e);
        res.status(500).json({ error: 'Failed' });
    }
});

export default router;
