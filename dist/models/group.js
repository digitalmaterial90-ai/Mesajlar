"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupModel = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_1 = require("../services/dynamo");
const uuid_1 = require("uuid");
const TABLE_NAME = "Groups";
exports.GroupModel = {
    async createTable() {
        try {
            await dynamo_1.client.send(new client_dynamodb_1.CreateTableCommand({
                TableName: TABLE_NAME,
                KeySchema: [
                    { AttributeName: "PK", KeyType: "HASH" }, // GROUP#<id> or MEMBER#<groupId>
                    { AttributeName: "SK", KeyType: "RANGE" } // METADATA or USER#<userId>
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
                // Table exists
            }
            else {
                console.error("Error creating Groups table:", e);
            }
        }
    },
    async createGroup(name, adminId) {
        console.log("GroupModel: createGroup start", name, adminId);
        try {
            const groupId = `GROUP#${(0, uuid_1.v4)()}`;
            console.log("GroupModel: generated ID", groupId);
            // 1. Save Metadata
            console.log("GroupModel: putting metadata");
            await dynamo_1.docClient.send(new lib_dynamodb_1.PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: groupId,
                    SK: 'METADATA',
                    groupId,
                    name,
                    adminIds: [adminId],
                    createdAt: Date.now()
                }
            }));
            console.log("GroupModel: metadata saved");
            // 2. Add Admin as Member
            console.log("GroupModel: adding admin member");
            await this.addMember(groupId, adminId);
            console.log("GroupModel: admin added");
            return groupId;
        }
        catch (e) {
            console.error("GroupModel Error", e);
            throw e;
        }
    },
    async addMember(groupId, userId) {
        await dynamo_1.docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: groupId,
                SK: `USER#${userId}`,
                groupId,
                userId,
                joinedAt: Date.now()
            }
        }));
    },
    async getMembers(groupId) {
        const result = await dynamo_1.docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues: {
                ":pk": groupId,
                ":prefix": "USER#"
            }
        }));
        return result.Items?.map(item => item.userId) || [];
    },
    async getGroup(groupId) {
        const result = await dynamo_1.docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: groupId, SK: 'METADATA' }
        }));
        return result.Item;
    }
};
//# sourceMappingURL=group.js.map