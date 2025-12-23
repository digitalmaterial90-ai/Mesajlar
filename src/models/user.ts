import { CreateTableCommand, ResourceInUseException } from "@aws-sdk/client-dynamodb";
import { PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { client, docClient } from "../services/dynamo";

const TABLE_NAME = "Users";

export interface User {
    userId: string;
    phoneNumber: string;
    username: string;
    createdAt: number;
}

export const UserModel = {
    async createTable() {
        try {
            await client.send(new CreateTableCommand({
                TableName: TABLE_NAME,
                KeySchema: [
                    { AttributeName: "PK", KeyType: "HASH" }, // USER#<userId>
                ],
                AttributeDefinitions: [
                    { AttributeName: "PK", AttributeType: "S" }, // PK
                    { AttributeName: "GSI1PK", AttributeType: "S" } // PHONE#<number>
                ],
                GlobalSecondaryIndexes: [
                    {
                        IndexName: "PhoneIndex",
                        KeySchema: [
                            { AttributeName: "GSI1PK", KeyType: "HASH" } // GSI for searching by phone
                        ],
                        Projection: { ProjectionType: "ALL" },
                        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
                    }
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
                console.error("Error creating Users table:", e);
                // throw e; 
            }
        }
    },

    async createUser(user: User) {
        const pk = `USER#${user.userId}`;
        const gsi1pk = `PHONE#${user.phoneNumber}`;

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: pk,
                GSI1PK: gsi1pk,
                ...user
            },
            ConditionExpression: "attribute_not_exists(PK)"
        }));
        return user;
    },

    async getUserByPhone(phoneNumber: string) {
        const gsi1pk = `PHONE#${phoneNumber}`;
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "PhoneIndex",
            KeyConditionExpression: "GSI1PK = :phone",
            ExpressionAttributeValues: {
                ":phone": gsi1pk
            }
        }));
        return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    },

    async getUserById(userId: string) {
        const pk = `USER#${userId}`;
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk }
        }));
        return result.Item;
    }
};
