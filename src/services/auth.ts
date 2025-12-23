import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserModel, User } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

export const AuthService = {
    generateToken(userId: string) {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    },

    verifyToken(token: string) {
        try {
            return jwt.verify(token, JWT_SECRET) as { userId: string };
        } catch (e) {
            return null;
        }
    },

    async registerOrLogin(phoneNumber: string, username: string) {
        // 1. Check if user exists by phone
        let user: any = await UserModel.getUserByPhone(phoneNumber);

        // 2. If not, create new
        if (!user) {
            const newUser: User = {
                userId: uuidv4(),
                phoneNumber,
                username,
                createdAt: Date.now()
            };
            await UserModel.createUser(newUser);
            user = newUser;
        }

        // 3. Generate Token
        // In real app, we would verify SMS code here before issuing token
        const token = this.generateToken(user.userId);

        return { user, token };
    }
};
