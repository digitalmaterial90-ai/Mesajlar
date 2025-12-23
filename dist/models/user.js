"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_1 = require("../services/dynamo");
const TABLE_NAME = "Users";
exports.UserModel = {
    async createTable() {
        try {
            await dynamo_1.client.send(new client_dynamodb_1.CreateTableCommand({
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
        }
        catch (e) {
            if (e instanceof client_dynamodb_1.ResourceInUseException || e.name === 'ResourceInUseException') {
                console.log(`Table ${TABLE_NAME} already exists.`);
            }
            else {
                console.error("Error creating Users table:", e);
                // throw e; 
            }
        }
    },
    async createUser(user) {
        const pk = `USER#${user.userId}`;
        const gsi1pk = `PHONE#${user.phoneNumber}`;
        await dynamo_1.docClient.send(new lib_dynamodb_1.PutCommand({
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
    async getUserByPhone(phoneNumber) {
        const gsi1pk = `PHONE#${phoneNumber}`;
        const result = await dynamo_1.docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "PhoneIndex",
            KeyConditionExpression: "GSI1PK = :phone",
            ExpressionAttributeValues: {
                ":phone": gsi1pk
            }
        }));
        return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    },
    async getUserById(userId) {
        const pk = `USER#${userId}`;
        const result = await dynamo_1.docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk }
        }));
        return result.Item;
    }
};
//# sourceMappingURL=user.js.map