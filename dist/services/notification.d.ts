interface PushNotification {
    userId: string;
    title: string;
    body: string;
    data?: any;
}
declare class NotificationService {
    private deviceTokens;
    registerDevice(userId: string, token: string, platform: 'ios' | 'android' | 'web'): void;
    sendPushNotification(notification: PushNotification): Promise<void>;
    sendMessageNotification(userId: string, senderName: string, messageContent: string): Promise<void>;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notification.d.ts.map