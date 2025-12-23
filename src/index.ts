import http from 'http';
import app from './app';
import { WebSocketService } from './services/websocket';

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Initialize WebSocket Service
new WebSocketService(server);

// Initialize DB Tables (only in development with local DynamoDB)
if (process.env.NODE_ENV !== 'production') {
    Promise.all([
        MessageModel.createTable(),
        UserModel.createTable(),
        GroupModel.createTable()
    ]).then(() => {
        console.log("DB Tables Initialized");
    }).catch(err => {
        console.log("DB initialization skipped or failed:", err.message);
    });
} else {
    console.log("Production mode: Skipping local DynamoDB initialization");
}

import authRoutes from './routes/auth';
import groupRoutes from './routes/groups';

// app.post('/test-group', (req, res) => {
//    console.log("Values from test-group");
//    res.json({ status: 'ok' });
// });

// app.post('/groups', async (req: any, res) => {
//     console.log("Index.ts /groups handler");
//     // ...
// });

// import groupRoutes from './routes/groups'; // Already imported
import mediaRoutes from './routes/media';
import notificationRoutes from './routes/notifications';
import searchRoutes from './routes/search';

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/media', mediaRoutes);
app.use('/notifications', notificationRoutes);
app.use('/search', searchRoutes);
// app.use('/groups', groupRoutes);


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket endpoint ready`);
});
