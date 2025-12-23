import axios from 'axios';
import { WebSocket } from 'ws';

const API_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';

async function runTest() {
    try {
        console.log('1. Registering Users...');
        const userA = (await axios.post(`${API_URL}/auth/login`, { phoneNumber: '+111', username: 'Alice' })).data;
        const userB = (await axios.post(`${API_URL}/auth/login`, { phoneNumber: '+222', username: 'Bob' })).data;

        console.log('2. Connecting to WebSocket...');
        const wsA = new WebSocket(`${WS_URL}?token=${userA.token}`);
        const wsB = new WebSocket(`${WS_URL}?token=${userB.token}`);

        await Promise.all([
            new Promise(resolve => wsA.on('open', resolve)),
            new Promise(resolve => wsB.on('open', resolve))
        ]);
        console.log('Both users connected');

        let messageId = '';
        let conversationId = '';

        // Bob waits for message and sends DELIVERED receipt
        const bobReceivedPromise = new Promise((resolve) => {
            wsB.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'NEW_MESSAGE') {
                    console.log('Bob received message:', msg.payload.content);
                    messageId = msg.payload.messageId;
                    conversationId = msg.payload.conversationId;

                    // Send DELIVERED receipt
                    wsB.send(JSON.stringify({
                        type: 'ACK_MESSAGE',
                        payload: {
                            messageId,
                            conversationId,
                            status: 'DELIVERED'
                        }
                    }));
                    console.log('Bob sent DELIVERED receipt');

                    // Wait a bit, then send READ receipt
                    setTimeout(() => {
                        wsB.send(JSON.stringify({
                            type: 'ACK_MESSAGE',
                            payload: {
                                messageId,
                                conversationId,
                                status: 'READ'
                            }
                        }));
                        console.log('Bob sent READ receipt');
                        resolve(true);
                    }, 500);
                }
            });
        });

        console.log('3. Alice sends message to Bob...');
        wsA.send(JSON.stringify({
            type: 'SEND_MESSAGE',
            payload: {
                to: userB.user.userId,
                content: 'Hello Bob!'
            }
        }));

        await bobReceivedPromise;

        // Wait a bit for DB updates
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('TEST PASSED: Delivery reports working');
        process.exit(0);

    } catch (e: any) {
        console.error('TEST FAILED', e.message);
        if (e.response) console.error(e.response.data);
        process.exit(1);
    }
}

runTest();
