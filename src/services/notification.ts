// Mock Push Notification Service
// In production, this would integrate with FCM (Firebase Cloud Messaging) and APNS (Apple Push Notification Service)

interface PushNotification {
    userId: string;
    title: string;
    body: string;
    data?: any;
}

interface DeviceToken {
    userId: string;
    token: string;
    platform: 'ios' | 'android' | 'web';
}

class NotificationService {
    private deviceTokens: Map<string, DeviceToken[]> = new Map();

    registerDevice(userId: string, token: string, platform: 'ios' | 'android' | 'web') {
        const existing = this.deviceTokens.get(userId) || [];

        // Remove old token if exists
        const filtered = existing.filter(d => d.token !== token);

        // Add new token
        filtered.push({ userId, token, platform });
        this.deviceTokens.set(userId, filtered);

        console.log(`Device registered for user ${userId}: ${platform}`);
    }

    async sendPushNotification(notification: PushNotification) {
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

    async sendMessageNotification(userId: string, senderName: string, messageContent: string) {
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

export const notificationService = new NotificationService();
