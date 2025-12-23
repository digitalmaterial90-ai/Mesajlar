"use strict";
// Mock Push Notification Service
// In production, this would integrate with FCM (Firebase Cloud Messaging) and APNS (Apple Push Notification Service)
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
class NotificationService {
    constructor() {
        this.deviceTokens = new Map();
    }
    registerDevice(userId, token, platform) {
        const existing = this.deviceTokens.get(userId) || [];
        // Remove old token if exists
        const filtered = existing.filter(d => d.token !== token);
        // Add new token
        filtered.push({ userId, token, platform });
        this.deviceTokens.set(userId, filtered);
        console.log(`Device registered for user ${userId}: ${platform}`);
    }
    async sendPushNotification(notification) {
        const devices = this.deviceTokens.get(notification.userId) || [];
        if (devices.length === 0) {
            console.log(`No devices registered for user ${notification.userId}`);
            return;
        }
        // Mock sending notification
        for (const device of devices) {
            console.log(`[MOCK PUSH] Sending to ${device.platform} device:`, {
                token: device.token.substring(0, 10) + '...',
                title: notification.title,
                body: notification.body
            });
            // In production:
            // if (device.platform === 'android') {
            //     await sendFCM(device.token, notification);
            // } else if (device.platform === 'ios') {
            //     await sendAPNS(device.token, notification);
            // }
        }
    }
    async sendMessageNotification(userId, senderName, messageContent) {
        await this.sendPushNotification({
            userId,
            title: senderName,
            body: messageContent,
            data: {
                type: 'new_message'
            }
        });
    }
}
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.js.map