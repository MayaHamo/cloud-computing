import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

import { createEntity, getEntity } from './dynamo-utils.mjs';
import { UnsupportedHTTPMethod, MissingParameters, UserBlocked } from './exceptions.mjs';
import { TABLES } from './tables.mjs';

const dynamoDb = DynamoDBDocument.from(new DynamoDB());
const TABLE_NAME = 'messages';
const MESSAGES_LIMIT = 200;

/* Messages handler methods */
export async function handleMessages(event) {
    const { httpMethod, resource, pathParameters, body } = event;
    switch (httpMethod) {
        case 'GET': 
            return getMessages(event);
        case 'POST': 
            const { sender, content } = JSON.parse(body);
            switch (resource) {
                case '/messages/user/{recipient}': 
                    return storeUserMessage(sender, pathParameters.recipient, content);
                case '/messages/group/{groupId}':
                    return storeGroupMessage(sender, pathParameters.groupId, content);
                default: throw new UnsupportedResource();
            }

        default: throw new UnsupportedHTTPMethod();
    }
};

async function validateSender(sender, recipient) {
    const storedRecipient = await getEntity(dynamoDb, TABLES.USERS, recipient);
    if (storedRecipient.blockedUsers.has(sender)) {
        throw new UserBlocked();
    }
}

async function storeMessage(sender, recipient, content) {
    const newMessage = new Message(sender, recipient, content);
    return createEntity(dynamoDb, TABLE_NAME, newMessage);
}

async function storeUserMessage(sender, recipient, content) {
    if (!sender || !recipient || !content) {
        throw new MissingParameters();
    }

    validateSender(sender, recipient);
    
    return storeMessage(sender, recipient, content);
}

async function storeGroupMessage(sender, groupId, content) {
    if (!sender || !groupId || !content) {
        throw new MissingParameters();
    }
    
    const group = await getEntity(dynamoDb, TABLES.GROUPS, groupId);
    for (const member of group.memberIds) {
        await storeMessage(sender, member, content);
    }
}

async function getMessages(event) {
    const { pathParameters: { recipient }} = event;
    if (!recipient) {
        throw new MissingParameters();
    }
    const fromDate = Number(event.queryStringParameters?.from || 0);

    const result = await dynamoDb.query({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#recipient = :recipient AND #dateCreated > :fromDate",
        ExpressionAttributeNames: {
            "#recipient": "recipient",
            "#dateCreated": "dateCreated",
        },
        ExpressionAttributeValues: {
            ":recipient": recipient,
            ":fromDate": fromDate,
        },
        Limit: MESSAGES_LIMIT,
    });
    
    return {
        messages: result.Items,
        date: {
            from: fromDate,
            to: result.LastEvaluatedKey ? result.LastEvaluatedKey.dateCreated : null,
        }
    };
}



class Message {
    constructor(sender, recipient, content) {
        this.sender = sender;
        this.recipient = recipient;
        this.content = content;
        this.dateCreated = Date.now();
    }
}
