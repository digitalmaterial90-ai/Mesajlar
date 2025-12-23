"use strict";
// In-memory presence tracking (Redis alternative for local dev)
// In production, this would use Redis with TTL
Object.defineProperty(exports, "__esModule", { value: true });
exports.presenceService = void 0;
class PresenceService {
    constructor() {
        this.presenceMap = new Map();
        this.typingMap = new Map();
        this.TYPING_TIMEOUT = 3000; // 3 seconds
    }
    setOnline(userId) {
        this.presenceMap.set(userId, {
            userId,
            status: 'online',
            lastSeen: Date.now()
        });
    }
    setOffline(userId) {
        const presence = this.presenceMap.get(userId);
        if (presence) {
            presence.status = 'offline';
            presence.lastSeen = Date.now();
        }
    }
    getPresence(userId) {
        return this.presenceMap.get(userId) || null;
    }
    setTyping(userId, conversationId) {
        const key = conversationId;
        const existing = this.typingMap.get(key) || [];
        // Remove old entry for this user
        const filtered = existing.filter(t => t.userId !== userId);
        // Add new entry
        filtered.push({
            userId,
            conversationId,
            timestamp: Date.now()
        });
        this.typingMap.set(key, filtered);
        // Auto-clear after timeout
        setTimeout(() => {
            this.clearTyping(userId, conversationId);
        }, this.TYPING_TIMEOUT);
    }
    clearTyping(userId, conversationId) {
        const key = conversationId;
        const existing = this.typingMap.get(key) || [];
        const filtered = existing.filter(t => t.userId !== userId);
        if (filtered.length > 0) {
            this.typingMap.set(key, filtered);
        }
        else {
            this.typingMap.delete(key);
        }
    }
    getTypingUsers(conversationId) {
        const typing = this.typingMap.get(conversationId) || [];
        const now = Date.now();
        // Filter out expired typing indicators
        const active = typing.filter(t => now - t.timestamp < this.TYPING_TIMEOUT);
        return active.map(t => t.userId);
    }
}
exports.presenceService = new PresenceService();
//# sourceMappingURL=presence.js.map