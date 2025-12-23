export interface Message {
    conversationId: string;
    messageId: string;
    content: string;
    senderId: string;
    timestamp: number;
    status: 'SENT' | 'DELIVERED' | 'READ';
    type: 'text' | 'image' | 'video';
    mediaKey?: string;
    mediaType?: string;
}
export declare const MessageModel: {
    createTable(): Promise<void>;
    saveMessage(msg: Message): Promise<Message>;
    getMessages(conversationId: string): Promise<Record<string, any>[] | undefined>;
    updateMessageStatus(conversationId: string, messageId: string, status: "DELIVERED" | "READ"): Promise<void>;
    getPendingMessages(userId: string, lastSyncTimestamp?: number): Promise<never[]>;
};
//# sourceMappingURL=message.d.ts.map