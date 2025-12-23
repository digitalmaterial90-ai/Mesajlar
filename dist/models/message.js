"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_1 = require("../services/dynamo");
const TABLE_NAME = "Messages";
exports.MessageModel = {
    async createTable() {
        try {
            await dynamo_1.client.send(new client_dynamodb_1.CreateTableCommand({
                TableName: TABLE_NAME,
                KeySchema: [
                    { AttributeName: "PK", KeyType: "HASH" },
                    { AttributeName: "SK", KeyType: "RANGE" }
                ],
                AttributeDefinitions: [
                    { AttributeName: "PK", AttributeType: "S" },
                    { AttributeName: "SK", AttributeType: "S" }
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }));
            console.log(`Table ${TABLE_NAME} created.`);
        }
        catch (e) {
            if (e instanceof client_dynamodb_1.ResourceInUseException || e.name === 'ResourceInUseException') {
                console.log(`Table ${TABLE_NAME} already exists.`);
            }
            else {
                console.error("Error creating table:", e);
                throw e;
            }
        }
    },
    async saveMessage(msg) {
        const pk = `CHAT#${msg.conversationId}`;
        const sk = `MSG#${msg.timestamp}#${msg.messageId}`;
        await dynamo_1.docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: `CHAT#${msg.conversationId}`,
                SK: `MSG#${msg.messageId}`,
                messageId: msg.messageId,
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                content: msg.content,
                timestamp: msg.timestamp,
                status: msg.status,
                type: msg.type || 'text',
                mediaKey: msg.mediaKey,
                mediaType: msg.mediaType
            }
        }));
        return msg;
    },
    async getMessages(conversationId) {
        const pk = `CHAT#${conversationId}`;
        const result = await dynamo_1.docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": pk
            }
        }));
        return result.Items;
    },
    async updateMessageStatus(conversationId, messageId, status) {
        const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
        const pk = `CHAT#${conversationId}`;
        const sk = `MSG#${messageId}`;
        await dynamo_1.docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk, SK: sk },
            UpdateExpression: 'SET #status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': status
            }
        }));
    },
    async getPendingMessages(userId, lastSyncTimestamp = 0) {
        // Query all conversations where user is a participant
        // For MVP: we'll use a simple approach - query by user's conversations
        // In production, this would use a GSI or separate table
        // For now, return empty array - full implementation requires Conversations table
        // This is a placeholder for the offline sync mechanism
        return [];
    }
};
//# sourceMappingURL=message.js.map