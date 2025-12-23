"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../services/auth");
const media_1 = require("../services/media");
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
router.post('/presign', authenticate, async (req, res) => {
    try {
        const { contentType, size } = req.body;
        if (!contentType || !size) {
            return res.status(400).json({ error: 'contentType and size are required' });
        }
        const data = await media_1.MediaService.getPresignedUploadUrl(req.userId, contentType, size);
        res.json(data);
    }
    catch (e) {
        console.error("Presign Error", e);
        res.status(500).json({ error: 'Failed' });
    }
});
exports.default = router;
//# sourceMappingURL=media.js.map