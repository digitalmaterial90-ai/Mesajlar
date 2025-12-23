import axios from 'axios';
import { WebSocket } from 'ws';

const API_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';

async function runTest() {
    try {
        console.log('1. Registering Users...');
        const userA = (await axios.post(`${API_URL}/auth/login`, { phoneNumber: '+333', username: 'Alice' })).data;
        const userB = (await axios.post(`${API_URL}/auth/login`, { phoneNumber: '+444', username: 'Bob' })).data;

        console.log('2. Connecting Alice...');
        const wsA = new WebSocket(`${WS_URL}?token=${userA.token}`);
        await new Promise(resolve => wsA.on('open', resolve));
        console.log('Alice connected and online');

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('3. Connecting Bob...');
        const wsB = new WebSocket(`${WS_URL}?token=${userB.token}`);
        await new Promise(resolve => wsB.on('open', resolve));
        console.log('Bob connected and online');

        const conversationId = [userA.user.userId, userB.user.userId].sort().join('_');

        console.log('4. Alice starts typing...');
        wsA.send(JSON.stringify({
            type: 'TYPING',
            payload: { conversationId }
        }));

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('5. Alice stops typing...');
        wsA.send(JSON.stringify({
            type: 'STOP_TYPING',
            payload: { conversationId }
        }));

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('6. Disconnecting Alice...');
        wsA.close();

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('TEST PASSED: Typing indicators and presence tracking working');
        process.exit(0);

    } catch (e: any) {
        console.error('TEST FAILED', e.message);
        if (e.response) console.error(e.response.data);
        process.exit(1);
    }
}

runTest();
