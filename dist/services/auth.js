"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const user_1 = require("../models/user");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';
exports.AuthService = {
    generateToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    },
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (e) {
            return null;
        }
    },
    async registerOrLogin(phoneNumber, username) {
        // 1. Check if user exists by phone
        let user = await user_1.UserModel.getUserByPhone(phoneNumber);
        // 2. If not, create new
        if (!user) {
            const newUser = {
                userId: (0, uuid_1.v4)(),
                phoneNumber,
                username,
                createdAt: Date.now()
            };
            await user_1.UserModel.createUser(newUser);
            user = newUser;
        }
        // 3. Generate Token
        // In real app, we would verify SMS code here before issuing token
        const token = this.generateToken(user.userId);
        return { user, token };
    }
};
//# sourceMappingURL=auth.js.map