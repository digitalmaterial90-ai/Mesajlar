"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const ws_1 = require("ws");
const uuid_1 = require("uuid");
class WebSocketService {
    constructor(server) {
        this.clients = new Map(); // userId -> Client[]
        this.wss = new ws_1.WebSocketServer({ server });
        this.init();
    }
    init() {
        this.wss.on('connection', (ws, req) => {
            // 1. Authenticate
            const urlParams = new URLSearchParams(req.url?.split('?')[1]);
            const token = urlParams.get('token');
            const deviceId = urlParams.get('deviceId') || require('uuid').v4(); // Get or generate deviceId
            let clientId;
            const { AuthService } = require('./auth'); // Dynamic import to avoid cycles or pure logic separate
            if (token) {
                const decoded = AuthService.verifyToken(token);
                if (decoded && decoded.userId) {
                    clientId = decoded.userId;
                    console.log(`Authenticated client connected: ${clientId} (device: ${deviceId})`);
                }
                else {
                    console.log('Invalid token, closing connection');
                    ws.close(1008, "Invalid Token");
                    return;
                }
            }
            else {
                // For backward compatibility or testing, maybe allow anonymous?
                // For MVP: REJECT
                console.log('No token provided, closing connection');
                ws.close(1008, "Auth Required");
                return;
            }
            const client = {
                id: clientId,
                deviceId,
                ws,
                lastAlive: Date.now(),
            };
            // Add to user's device list
            const userDevices = this.clients.get(clientId) || [];
            userDevices.push(client);
            this.clients.set(clientId, userDevices);
            // Mark user as online
            const { presenceService } = require('./presence');
            presenceService.setOnline(clientId);
            ws.on('message', (message) => {
                try {
                    const parsed = JSON.parse(message.toString());
                    console.log(`Received message from ${clientId}:`, parsed);
                    this.handleMessage(clientId, parsed);
                }
                catch (e) {
                    console.error('Invalid JSON:', message.toString());
                }
            });
            ws.on('close', () => {
                console.log(`Client disconnected: ${clientId} (device: ${deviceId})`);
                // Remove this specific device
                const userDevices = this.clients.get(clientId) || [];
                const filtered = userDevices.filter(c => c.deviceId !== deviceId);
                if (filtered.length > 0) {
                    this.clients.set(clientId, filtered);
                }
                else {
                    this.clients.delete(clientId);
                    // Mark user as offline only if no devices connected
                    const { presenceService } = require('./presence');
                    presenceService.setOffline(clientId);
                }
            });
            ws.on('pong', () => {
                const userDevices = this.clients.get(clientId) || [];
                const device = userDevices.find(c => c.deviceId === deviceId);
                if (device) {
                    device.lastAlive = Date.now();
                }
            });
            // Send welcome message
            ws.send(JSON.stringify({ type: 'WELCOME', clientId }));
        });
        // Heartbeat
        setInterval(() => {
            this.clients.forEach((devices, userId) => {
                devices.forEach((client, index) => {
                    if (Date.now() - client.lastAlive > 30000) {
                        client.ws.terminate();
                        devices.splice(index, 1);
                    }
                    else {
                        client.ws.ping();
                    }
                });
                // Clean up empty device arrays
                if (devices.length === 0) {
                    this.clients.delete(userId);
                }
            });
        }, 10000);
    }
    async handleMessage(clientId, data) {
        // Get first device for this user (for backward compatibility)
        const devices = this.clients.get(clientId) || [];
        const client = devices[0];
        if (!client)
            return;
        if (data.type === 'SEND_MESSAGE') {
            // Save to DB
            const { to, content, type, mediaKey, mediaType } = data.payload;
            const { MessageModel } = require('../models/message');
            const { GroupModel } = require('../models/group');
            let conversationId = '';
            let reciepients = [];
            if (to.startsWith('GROUP#')) {
                // GROUP MESSAGE (Fan-out)
                conversationId = to;
                // 1. Get Group Members
                try {
                    reciepients = await GroupModel.getMembers(to);
                    // Filter out sender? Or send back as confirmation? Usually filter out sender for push, but save for all.
                    // For PoC logic: Send to everyone except sender
                    reciepients = reciepients.filter((id) => id !== clientId);
                }
                catch (e) {
                    console.error("Error fetching members", e);
                    return;
                }
            }
            else {
                // DIRECT MESSAGE
                conversationId = [clientId, to].sort().join('_');
                reciepients = [to];
            }
            // 2. Save Message
            try {
                const messageId = (0, uuid_1.v4)();
                const savedMsg = await MessageModel.saveMessage({
                    conversationId,
                    messageId,
                    senderId: clientId,
                    content,
                    timestamp: Date.now(),
                    status: 'SENT',
                    type: type || 'text',
                    mediaKey,
                    mediaType
                });
                // 3. Send ACK to Sender
                client.ws.send(JSON.stringify({
                    type: 'ACK_MESSAGE',
                    payload: {
                        status: 'SENT',
                        messageId: savedMsg.messageId,
                        conversationId
                    }
                }));
                // 4. Fan-out to Recipients
                reciepients.forEach((recipientId) => {
                    const recipientDevices = this.clients.get(recipientId) || [];
                    if (recipientDevices.length > 0) {
                        // Send to all connected devices
                        recipientDevices.forEach(device => {
                            if (device.ws.readyState === ws_1.WebSocket.OPEN) {
                                device.ws.send(JSON.stringify({
                                    type: 'NEW_MESSAGE',
                                    payload: savedMsg
                                }));
                            }
                        });
                    }
                    else {
                        // User is offline - send push notification
                        console.log(`User ${recipientId} is offline - sending push notification`);
                        const { notificationService } = require('./notification');
                        notificationService.sendMessageNotification(recipientId, clientId, content);
                    }
                });
            }
            catch (e) {
                console.error(e);
            }
        }
        else if (data.type === 'ACK_MESSAGE') {
            // Handle delivery/read receipts
            const { messageId, conversationId, status } = data.payload;
            if (!messageId || !conversationId || !status) {
                console.error('Invalid ACK_MESSAGE payload');
                return;
            }
            const { MessageModel } = require('../models/message');
            try {
                await MessageModel.updateMessageStatus(conversationId, messageId, status);
                // Notify sender about status update
                // Find the sender from the message (we'd need to query it)
                // For MVP: we'll skip notifying sender, just update DB
                console.log(`Message ${messageId} status updated to ${status}`);
            }
            catch (e) {
                console.error('Error updating message status:', e);
            }
        }
        else if (data.type === 'TYPING') {
            // Handle typing indicator
            const { conversationId } = data.payload;
            if (!conversationId)
                return;
            const { presenceService } = require('./presence');
            presenceService.setTyping(clientId, conversationId);
            // Notify other participants
            // For 1:1: notify the other user
            // For groups: notify all members
            // Simplified: broadcast to conversation (implementation depends on conversation type)
            console.log(`User ${clientId} is typing in ${conversationId}`);
        }
        else if (data.type === 'STOP_TYPING') {
            // Handle stop typing
            const { conversationId } = data.payload;
            if (!conversationId)
                return;
            const { presenceService } = require('./presence');
            presenceService.clearTyping(clientId, conversationId);
            console.log(`User ${clientId} stopped typing in ${conversationId}`);
        }
    }
}
exports.WebSocketService = WebSocketService;
//# sourceMappingURL=websocket.js.map