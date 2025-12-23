import express from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

export default app;
