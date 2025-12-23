export declare const AuthService: {
    generateToken(userId: string): string;
    verifyToken(token: string): {
        userId: string;
    } | null;
    registerOrLogin(phoneNumber: string, username: string): Promise<{
        user: any;
        token: string;
    }>;
};
//# sourceMappingURL=auth.d.ts.map