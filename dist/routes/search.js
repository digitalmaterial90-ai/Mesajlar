"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../services/auth");
const search_1 = require("../services/search");
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
// Search messages
router.get('/messages', authenticate, async (req, res) => {
    try {
        const { q, limit } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        const results = await search_1.SearchService.searchMessages(req.userId, q, limit ? parseInt(limit) : 20);
        res.json({ results });
    }
    catch (e) {
        console.error("Search error", e);
        res.status(500).json({ error: 'Failed' });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map