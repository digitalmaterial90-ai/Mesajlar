import axios from 'axios';
import WebSocket from 'ws';

const API_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';

async function runGroupTest() {
    try {
        console.log('1. Registering User A (Admin) & User B (Member)...');
        const userA = (await axios.post(`${API_URL}/auth/login`, { phoneNumber: '+999001', username: 'Alice' })).data;
        const userB = (await axios.post(`${API_URL}/auth/login`, { phoneNumber: '+999002', username: 'Bob' })).data;
        const userC = (await axios.post(`${API_URL}/auth/login`, { phoneNumber: '+999003', username: 'Charlie' })).data;

        console.log('1.5 Testing /test-group route...');
        try {
            await axios.post(`${API_URL}/test-group`, {});
            console.log('/test-group worked');
        } catch (e: any) {
            console.error('/test-group failed', e.message);
        }

        try {
            await axios.get(`${API_URL}/groups/ping`);
            console.log('/groups/ping worked');
        } catch (e: any) {
            console.error('/groups/ping failed', e.message);
        }

        console.log('2. Creating Group by Alice...');
        // Alice creates group
        const groupRes = await axios.post(`${API_URL}/groups`, { name: 'Dev Team' }, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        const groupId = groupRes.data.groupId;
        console.log(`Group Created: ${groupId}`);

        console.log('3. Adding Bob and Charlie to Group...');
        // Alice adds Bob
        await axios.post(`${API_URL}/groups/${encodeURIComponent(groupId)}/members`, { userId: userB.user.userId }, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        // Alice adds Charlie
        await axios.post(`${API_URL}/groups/${encodeURIComponent(groupId)}/members`, { userId: userC.user.userId }, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });

        console.log('4. Connecting Users to WS...');
        const wsAlice = new WebSocket(`${WS_URL}?token=${userA.token}`);
        const wsBob = new WebSocket(`${WS_URL}?token=${userB.token}`);
        const wsCharlie = new WebSocket(`${WS_URL}?token=${userC.token}`);

        const waitForOpen = (ws: WebSocket) => new Promise(resolve => ws.on('open', resolve));
        await Promise.all([waitForOpen(wsAlice), waitForOpen(wsBob), waitForOpen(wsCharlie)]);
        console.log('All users connected');

        // Setup Listeners
        const bobReceivedPromise = new Promise(resolve => {
            wsBob.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'NEW_MESSAGE' && msg.payload.content === 'Hello Team!') {
                    console.log('Bob received message!');
                    resolve(true);
                }
            });
        });

        const charlieReceivedPromise = new Promise(resolve => {
            wsCharlie.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'NEW_MESSAGE' && msg.payload.content === 'Hello Team!') {
                    console.log('Charlie received message!');
                    resolve(true);
                }
            });
        });

        console.log('5. Alice sending Group Message...');
        wsAlice.send(JSON.stringify({
            type: 'SEND_MESSAGE',
            payload: {
                to: groupId,
                content: 'Hello Team!'
            }
        }));

        console.log('6. Waiting for delivery...');
        await Promise.all([bobReceivedPromise, charlieReceivedPromise]);

        console.log('TEST PASSED: Fan-out successful');
        process.exit(0);

    } catch (e: any) {
        console.error('TEST FAILED', e.message);
        if (e.response) console.error(e.response.data);
        process.exit(1);
    }
}

// Wait for server restart
setTimeout(runGroupTest, 3000);
