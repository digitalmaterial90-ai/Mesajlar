import { CreateTableCommand, ResourceInUseException } from "@aws-sdk/client-dynamodb";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { client, docClient } from "../services/dynamo";

const TABLE_NAME = "Messages";

export interface Message {
    conversationId: string;
    messageId: string;
    content: string;
    senderId: string;
    timestamp: number;
    status: 'SENT' | 'DELIVERED' | 'READ';
    type: 'text' | 'image' | 'video';
    mediaKey?: string;
    mediaType?: string;
}
export const MessageModel = {
    async createTable() {
        try {
            await client.send(new CreateTableCommand({
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
        } catch (e: any) {
            if (e instanceof ResourceInUseException || e.name === 'ResourceInUseException') {
                console.log(`Table ${TABLE_NAME} already exists.`);
            } else {
                console.error("Error creating table:", e);
                throw e;
            }
        }
    },

    async saveMessage(msg: Message) {
        const pk = `CHAT#${msg.conversationId}`;
        const sk = `MSG#${msg.timestamp}#${msg.messageId}`;

        await docClient.send(new PutCommand({
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

    async getMessages(conversationId: string) {
        const pk = `CHAT#${conversationId}`;
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": pk
            }
        }));
        return result.Items;
    },

    async updateMessageStatus(conversationId: string, messageId: string, status: 'DELIVERED' | 'READ') {
        const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
        const pk = `CHAT#${conversationId}`;
        const sk = `MSG#${messageId}`;

        await docClient.send(new UpdateCommand({
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

    async getPendingMessages(userId: string, lastSyncTimestamp: number = 0) {
        // Query all conversations where user is a participant
        // For MVP: we'll use a simple approach - query by user's conversations
        // In production, this would use a GSI or separate table

        // For now, return empty array - full implementation requires Conversations table
        // This is a placeholder for the offline sync mechanism
        return [];
    }
};
