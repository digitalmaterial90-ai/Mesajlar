import { CreateTableCommand, ResourceInUseException } from "@aws-sdk/client-dynamodb";
import { PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { client, docClient } from "../services/dynamo";
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = "Groups";

export interface Group {
    groupId: string;
    name: string;
    adminIds: string[];
    createdAt: number;
}

export interface GroupMember {
    groupId: string;
    userId: string;
    joinedAt: number;
}

export const GroupModel = {
    async createTable() {
        try {
            await client.send(new CreateTableCommand({
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
        } catch (e: any) {
            if (e instanceof ResourceInUseException || e.name === 'ResourceInUseException') {
                // Table exists
            } else {
                console.error("Error creating Groups table:", e);
            }
        }
    },

    async createGroup(name: string, adminId: string) {
        console.log("GroupModel: createGroup start", name, adminId);
        try {
            const groupId = `GROUP#${uuidv4()}`;
            console.log("GroupModel: generated ID", groupId);

            // 1. Save Metadata
            console.log("GroupModel: putting metadata");
            await docClient.send(new PutCommand({
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
        } catch (e) {
            console.error("GroupModel Error", e);
            throw e;
        }
    },

    async addMember(groupId: string, userId: string) {
        await docClient.send(new PutCommand({
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

    async getMembers(groupId: string): Promise<string[]> {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues: {
                ":pk": groupId,
                ":prefix": "USER#"
            }
        }));
        return result.Items?.map(item => item.userId) || [];
    },

    async getGroup(groupId: string) {
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: groupId, SK: 'METADATA' }
        }));
        return result.Item;
    }
};
