"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../services/auth");
const group_1 = require("../models/group");
const router = express_1.default.Router();
// Middleware to check token
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
router.use((req, res, next) => {
    console.log(`Groups Router received: ${req.method} ${req.url}`);
    next();
});
router.get('/ping', (req, res) => {
    res.json({ pong: true });
});
router.post('/', authenticate, async (req, res) => {
    try {
        const { name } = req.body;
        const groupId = await group_1.GroupModel.createGroup(name, req.userId);
        res.json({ groupId, name });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.post('/:id/members', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body; // User to add
        // In real app, check if req.userId is admin
        await group_1.GroupModel.addMember(id, userId);
        res.json({ status: 'ok' });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.get('/:id/members', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const members = await group_1.GroupModel.getMembers(id);
        res.json({ members });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
exports.default = router;
//# sourceMappingURL=groups.js.map