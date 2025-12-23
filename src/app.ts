import express from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`
        <html>
            <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5;">
                <h1 style="color: #075e54;">WhatsApp Clone API is LIVE! 🚀</h1>
                <p>Uygulama başarıyla çalışıyor. WebService ve WebSocket hazır.</p>
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <strong>API Durumu:</strong> <a href="/health">Sağlıklı ✅</a>
                </div>
            </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

export default app;
