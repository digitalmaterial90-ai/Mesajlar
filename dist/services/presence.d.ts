interface PresenceData {
    userId: string;
    status: 'online' | 'offline';
    lastSeen: number;
}
declare class PresenceService {
    private presenceMap;
    private typingMap;
    private readonly TYPING_TIMEOUT;
    setOnline(userId: string): void;
    setOffline(userId: string): void;
    getPresence(userId: string): PresenceData | null;
    setTyping(userId: string, conversationId: string): void;
    clearTyping(userId: string, conversationId: string): void;
    getTypingUsers(conversationId: string): string[];
}
export declare const presenceService: PresenceService;
export {};
//# sourceMappingURL=presence.d.ts.map