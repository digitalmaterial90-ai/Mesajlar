import axios from 'axios';
import { WebSocket } from 'ws';

const API_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';

async function runTest() {
    try {
        console.log('1. Registering User...');
        const userRes = await axios.post(`${API_URL}/auth/login`, {
            phoneNumber: '+999888',
            username: 'MediaUser'
        });
        const { token, user } = userRes.data;
        console.log(`User logged in: ${user.userId}`);

        console.log('2. Requesting Presigned URL...');
        const mediaRes = await axios.post(`${API_URL}/media/presign`, {
            contentType: 'image/jpeg',
            size: 102400
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { url, key } = mediaRes.data;
        console.log('Presigned URL received:', url);
        console.log('Key:', key);

        if (!url || !key) throw new Error('Failed to get presigned URL');

        // In a real scenario, we would upload to 'url' here.
        // await axios.put(url, fs.readFileSync('test.jpg'), { headers: { 'Content-Type': 'image/jpeg' } });
        console.log('Skipping actual S3 upload (mock/local environment).');

        console.log('3. Sending Message with Media...');
        const ws = new WebSocket(`${WS_URL}?token=${token}`);

        await new Promise(resolve => ws.on('open', resolve));
        console.log('WS Connected');

        const messagePromise = new Promise(resolve => {
            ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'ACK_MESSAGE') {
                    console.log('ACK received');
                    resolve(true);
                }
            });
        });

        ws.send(JSON.stringify({
            type: 'SEND_MESSAGE',
            payload: {
                to: user.userId, // Send to self
                content: 'Check out this photo',
                type: 'image',
                mediaKey: key,
                mediaType: 'image/jpeg'
            }
        }));

        await messagePromise;
        console.log('Message ACK received');

        console.log('TEST PASSED: Presign + Media Message');
        process.exit(0);

    } catch (e: any) {
        console.error('TEST FAILED', e.message);
        if (e.response) console.error(e.response.data);
        process.exit(1);
    }
}

runTest();
