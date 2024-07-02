import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

import { createEntity, getEntity, deleteEntity, updateEntity } from './dynamo-utils.mjs';
import { UnsupportedHTTPMethod, UnsupportedResource } from './exceptions.mjs';
import { TABLES } from './tables.mjs';

const dynamoDb = DynamoDBDocument.from(new DynamoDB());

/* Users handler methods */
export async function handleUsers(event) {
    const { pathParameters } = event;
    switch (event.httpMethod) {
        case 'GET': 
            return getEntity(dynamoDb, TABLES.USERS, pathParameters.id);
        case 'POST':
            switch (event.resource) {
                case '/users': 
                    const newUser = new User();
                    return createEntity(dynamoDb, TABLES.USERS, newUser);
                case '/users/{id}/block/{blockUser}':
                    const { id, blockUser } = pathParameters;
                    const updateParams = buildUpdateParams(id, blockUser, "ADD");
                    return updateEntity(dynamoDb, updateParams, id);
                default: throw new UnsupportedResource();
            }
        case 'DELETE':
            switch (event.resource) {
                case '/users/{id}': 
                    return deleteEntity(dynamoDb, TABLES.USERS, pathParameters.id);
                case '/users/{id}/block/{blockUser}':
                    const { id, blockUser } = pathParameters;
                    const updateParams = buildUpdateParams(id, blockUser, "DELETE");
                    return updateEntity(dynamoDb, updateParams, id);
                default: throw new UnsupportedResource();
            }

        default: throw new UnsupportedHTTPMethod();
    }
}

function buildUpdateParams(id, userId, operation) {
    const params = {
        TableName: TABLES.USERS,
        Key: { id: { S: id } },
        UpdateExpression: `${operation} blockedUsers :userId`,
        ExpressionAttributeValues: {
            ':userId': { "SS" : [userId] }
        }
    };
    
    return params;
}

class User {
    constructor() {
        const id = randomUUID();
        this.id = id;
        this.blockedUsers = new Set([id]);
        this.dateCreated = Date.now();
    }
}
