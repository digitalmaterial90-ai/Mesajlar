"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const websocket_1 = require("./services/websocket");
const PORT = process.env.PORT || 8080;
const server = http_1.default.createServer(app_1.default);
app_1.default.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
// Initialize WebSocket Service
new websocket_1.WebSocketService(server);
// Initialize DB Tables
const message_1 = require("./models/message");
const user_1 = require("./models/user");
const group_1 = require("./models/group");
Promise.all([
    message_1.MessageModel.createTable(),
    user_1.UserModel.createTable(),
    group_1.GroupModel.createTable()
]).then(() => {
    console.log("DB Tables Initialized");
});
const auth_1 = __importDefault(require("./routes/auth"));
const groups_1 = __importDefault(require("./routes/groups"));
// app.post('/test-group', (req, res) => {
//    console.log("Values from test-group");
//    res.json({ status: 'ok' });
// });
// app.post('/groups', async (req: any, res) => {
//     console.log("Index.ts /groups handler");
//     // ...
// });
// import groupRoutes from './routes/groups'; // Already imported
const media_1 = __importDefault(require("./routes/media"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const search_1 = __importDefault(require("./routes/search"));
app_1.default.use('/auth', auth_1.default);
app_1.default.use('/groups', groups_1.default);
app_1.default.use('/media', media_1.default);
app_1.default.use('/notifications', notifications_1.default);
app_1.default.use('/search', search_1.default);
// app.use('/groups', groupRoutes);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket endpoint ready`);
});
//# sourceMappingURL=index.js.map