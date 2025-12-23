"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const ws_1 = __importDefault(require("ws"));
const API_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';
async function runAuthTest() {
    try {
        console.log('1. Trying to login/register...');
        const loginRes = await axios_1.default.post(`${API_URL}/auth/login`, {
            phoneNumber: '+905551234567',
            username: 'TestUser1'
        });
        console.log('Login Result:', loginRes.data);
        const { token, user } = loginRes.data;
        if (!token || !user) {
            console.error('Login failed, no token returned');
            process.exit(1);
        }
        console.log('2. Trying to connect to WS with Token...');
        const ws = new ws_1.default(`${WS_URL}?token=${token}`);
        ws.on('open', () => {
            console.log('WS Connected with Auth!');
            // Send a message
            ws.send(JSON.stringify({
                type: 'SEND_MESSAGE',
                payload: {
                    to: 'some-other-user',
                    content: 'Hello Authenticated World'
                }
            }));
        });
        ws.on('message', (data) => {
            console.log('WS Message Received:', data.toString());
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'ACK' || parsed.type === 'WELCOME') {
                console.log('Auth Flow Verified!');
                process.exit(0);
            }
        });
        ws.on('error', (err) => {
            console.error('WS Error:', err.message);
            process.exit(1);
        });
        ws.on('close', (code, reason) => {
            console.log(`WS Closed: ${code} - ${reason}`);
        });
    }
    catch (e) {
        console.error('Test Failed:', e.message);
        if (e.response) {
            console.error('Response Data:', e.response.data);
        }
        process.exit(1);
    }
}
async function runUnauthTest() {
    console.log('3. Trying to connect WITHOUT Token (Should fail)...');
    const ws = new ws_1.default(`${WS_URL}`);
    ws.on('open', () => {
        // It might open briefly before server closes it.
        // We wait a bit to see if it closes.
        setTimeout(() => {
            if (ws.readyState === ws_1.default.OPEN) {
                console.error('FAIL: Connection stayed OPEN without token');
                process.exit(1);
            }
        }, 500);
    });
    ws.on('close', (code, reason) => {
        console.log(`PASS: Connection rejected as expected: ${code} - ${reason}`);
        // Now run the auth test
        runAuthTest();
    });
    ws.on('error', (err) => {
        // Some clients might emit error on immediate close
        console.log('WS Error on unauth (Expected):', err.message);
    });
}
// Wait for server to be ready from previous starts or if we need to restart
setTimeout(runUnauthTest, 2000);
//# sourceMappingURL=auth_test.js.map