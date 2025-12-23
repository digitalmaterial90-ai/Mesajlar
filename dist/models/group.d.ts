export interface Group {
    groupId: string;
    name: string;
    adminIds: string[];
    createdAt: number;
}
export interface GroupMember {
    groupId: string;
    userId: string;
    joinedAt: number;
}
export declare const GroupModel: {
    createTable(): Promise<void>;
    createGroup(name: string, adminId: string): Promise<string>;
    addMember(groupId: string, userId: string): Promise<void>;
    getMembers(groupId: string): Promise<string[]>;
    getGroup(groupId: string): Promise<Record<string, any> | undefined>;
};
//# sourceMappingURL=group.d.ts.map