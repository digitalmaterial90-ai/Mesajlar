export interface User {
    userId: string;
    phoneNumber: string;
    username: string;
    createdAt: number;
}
export declare const UserModel: {
    createTable(): Promise<void>;
    createUser(user: User): Promise<User>;
    getUserByPhone(phoneNumber: string): Promise<Record<string, any> | null | undefined>;
    getUserById(userId: string): Promise<Record<string, any> | undefined>;
};
//# sourceMappingURL=user.d.ts.map