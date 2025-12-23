"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const ws_1 = __importDefault(require("ws"));
const API_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';
async function runGroupTest() {
    try {
        console.log('1. Registering User A (Admin) & User B (Member)...');
        const userA = (await axios_1.default.post(`${API_URL}/auth/login`, { phoneNumber: '+999001', username: 'Alice' })).data;
        const userB = (await axios_1.default.post(`${API_URL}/auth/login`, { phoneNumber: '+999002', username: 'Bob' })).data;
        const userC = (await axios_1.default.post(`${API_URL}/auth/login`, { phoneNumber: '+999003', username: 'Charlie' })).data;
        console.log('2. Creating Group by Alice...');
        // Alice creates group
        const groupRes = await axios_1.default.post(`${API_URL}/groups`, { name: 'Dev Team' }, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        const groupId = groupRes.data.groupId;
        console.log(`Group Created: ${groupId}`);
        console.log('3. Adding Bob and Charlie to Group...');
        // Alice adds Bob
        await axios_1.default.post(`${API_URL}/groups/${groupId}/members`, { userId: userB.user.userId }, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        // Alice adds Charlie
        await axios_1.default.post(`${API_URL}/groups/${groupId}/members`, { userId: userC.user.userId }, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        console.log('4. Connecting Users to WS...');
        const wsAlice = new ws_1.default(`${WS_URL}?token=${userA.token}`);
        const wsBob = new ws_1.default(`${WS_URL}?token=${userB.token}`);
        const wsCharlie = new ws_1.default(`${WS_URL}?token=${userC.token}`);
        const waitForOpen = (ws) => new Promise(resolve => ws.on('open', resolve));
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
    }
    catch (e) {
        console.error('TEST FAILED', e.message);
        if (e.response)
            console.error(e.response.data);
        process.exit(1);
    }
}
// Wait for server restart
setTimeout(runGroupTest, 3000);
//# sourceMappingURL=group_test.js.map