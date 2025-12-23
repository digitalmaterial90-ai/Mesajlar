import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const clientConfig: any = {
    region: process.env.AWS_REGION || 'us-east-1',
};

// Only use local endpoint if specified or in non-production
if (process.env.DYNAMODB_ENDPOINT) {
    clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
} else if (!isProduction) {
    clientConfig.endpoint = 'http://localhost:8000';
}

// In development, use fake credentials if not provided
if (!isProduction || process.env.AWS_ACCESS_KEY_ID === 'fake') {
    clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake'
    };
}

const client = new DynamoDBClient(clientConfig);

const docClient = DynamoDBDocumentClient.from(client);

export { client, docClient };
