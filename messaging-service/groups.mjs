import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

import { createEntity, getEntity, updateEntity } from './dynamo-utils.mjs';
import { ErrorData } from './errors.mjs';

const dynamoDb = DynamoDBDocument.from(new DynamoDB());
const TABLE_NAME = 'groups';
const MAX_MEMBERS_SIZE = 100;

/* Groups handler methods */
export async function handleGroups(event) {
    const { httpMethod, resource, pathParameters } = event;
    switch (httpMethod) {
        case 'GET': return getEntity(TABLE_NAME, pathParameters.id);
        case 'POST':
            switch (resource) {
                case '/groups':
                    const newGroup = new Group();
                    return createEntity(dynamoDb, TABLE_NAME, newGroup);
                case '/groups/{id}/add/{memberId}': 
                    return addMemberToGroup(pathParameters.id, pathParameters.memberId);
                case '/groups/{id}/remove/{memberId}':
                    return removeMemberFromGroup(pathParameters.id, pathParameters.memberId);
                default: throw new ErrorData(400, "Unsupported resource");
            }
        default: throw new ErrorData(400, "Unsupported HTTP method");
    }
}

async function addMemberToGroup(groupId, memberId) {
    if (!groupId || !memberId) {
        throw new ErrorData(400, "Missing parameters");
    }

    const updateParams = buildUpdateParams(groupId, memberId, "ADD");
    await updateEntity(dynamoDb, updateParams, groupId);

    return memberId;
}

async function removeMemberFromGroup(groupId, memberId) {
    if (!groupId || !memberId) {
        throw new ErrorData(400, "Missing parameters");
    }
    
    const updateParams = buildUpdateParams(groupId, memberId, "DELETE");
    await updateEntity(dynamoDb, updateParams, groupId);

    return memberId;
}

function buildUpdateParams(groupId, memberId, operation) {
    const params = {
        TableName: TABLE_NAME,
        Key: { id: { S: groupId } },
        UpdateExpression: `${operation} memberIds :memberId`,
        ExpressionAttributeValues: {
            ':memberId': { "SS" : [memberId] }
        }
    };
    
    return params;
}

class Group {
    constructor() {
        const uuid = randomUUID();
        this.id = uuid;
        this.memberIds = new Set([uuid]);
        this.dateCreated = Date.now();
    }
}