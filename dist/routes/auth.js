"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../services/auth");
const router = express_1.default.Router();
router.post('/login', async (req, res) => {
    try {
        const { phoneNumber, username } = req.body;
        if (!phoneNumber || !username) {
            res.status(400).json({ error: 'Missing phone number or username' });
            return;
        }
        const result = await auth_1.AuthService.registerOrLogin(phoneNumber, username);
        res.json(result);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map