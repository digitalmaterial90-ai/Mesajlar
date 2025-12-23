import WebSocket from 'ws';
import { MessageModel } from '../src/models/message';
import { v4 } from 'uuid';

// Wait for server to start
setTimeout(async () => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.on('open', () => {
        console.log('Connected to WS');
        const payload = {
            type: 'SEND_MESSAGE',
            payload: {
                to: 'user_2',
                content: 'Hello World from E2E Test'
            }
        };
        ws.send(JSON.stringify(payload));
    });

    ws.on('message', async (data) => {
        const msg = JSON.parse(data.toString());
        console.log('Received:', msg);

        if (msg.type === 'ACK' && msg.payload.status === 'SENT') {
            console.log('ACK received. Verifying DB...');
            try {
                // We know the conversation ID logic in server: [clientId, to].sort().join('_')
                // But we need the clientId assigned by server. 
                // Wait, the client doesn't know its ID unless WELCOME message sends it.
                // My server sends WELCOME with clientId.
            } catch (e) {
                console.error(e);
            }
        }

        if (msg.type === 'WELCOME') {
            const clientId = msg.clientId;
            console.log('My Client ID:', clientId);
            // Resend message now that we have ID? 
            // Actually the first message was sent before we knew ID, but the server handles connection-based ID.
            // The conversation logic uses that ID.

            // Let's query DB for conversation: [clientId, 'user_2'].sort().join('_')
            setTimeout(async () => {
                const conversationId = [clientId, 'user_2'].sort().join('_');
                console.log('Checking conversation:', conversationId);
                const msgs = await MessageModel.getMessages(conversationId);
                console.log('Messages in DB:', msgs);
                if (msgs && msgs.length > 0) {
                    console.log('TEST PASSED');
                    process.exit(0);
                } else {
                    console.log('TEST FAILED: No messages found');
                    process.exit(1);
                }
            }, 2000);
        }
    });

}, 2000);
