import express from 'express';
import { AuthService } from '../services/auth';

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { phoneNumber, username } = req.body;
        if (!phoneNumber || !username) {
            res.status(400).json({ error: 'Missing phone number or username' });
            return;
        }

        const result = await AuthService.registerOrLogin(phoneNumber, username);
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal error' });
    }
});

export default router;
