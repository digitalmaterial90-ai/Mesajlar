"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../services/auth");
const notification_1 = require("../services/notification");
const router = express_1.default.Router();
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'Auth required' });
    const decoded = auth_1.AuthService.verifyToken(token);
    if (!decoded)
        return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.userId;
    next();
};
// Register device token for push notifications
router.post('/register-device', authenticate, async (req, res) => {
    try {
        const { token, platform } = req.body;
        if (!token || !platform) {
            return res.status(400).json({ error: 'token and platform are required' });
        }
        notification_1.notificationService.registerDevice(req.userId, token, platform);
        res.json({ status: 'ok' });
    }
    catch (e) {
        console.error("Device registration error", e);
        res.status(500).json({ error: 'Failed' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map