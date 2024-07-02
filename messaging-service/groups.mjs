import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

import { createEntity, getEntity, updateEntity } from './dynamo-utils.mjs';
import { UnsupportedHTTPMethod, UnsupportedResource, MissingParameters, GroupMaximumSize } from './exceptions.mjs';
import { TABLES } from './tables.mjs';

const dynamoDb = DynamoDBDocument.from(new DynamoDB());
const MAX_MEMBERS_SIZE = '100';

/* Groups handler methods */
export async function handleGroups(event) {
    const { httpMethod, resource, pathParameters } = event;
    switch (httpMethod) {
        case 'GET': return getEntity(TABLES.GROUPS, pathParameters.id);
        case 'POST':
            switch (resource) {
                case '/groups':
                    const newGroup = new Group();
                    return createEntity(dynamoDb, TABLES.GROUPS, newGroup);
                case '/groups/{id}/add/{memberId}': 
                    return addMemberToGroup(pathParameters.id, pathParameters.memberId);
                case '/groups/{id}/remove/{memberId}':
                    return removeMemberFromGroup(pathParameters.id, pathParameters.memberId);
                default: throw new UnsupportedResource();
            }
        default: throw new UnsupportedHTTPMethod();
    }
}

async function addMemberToGroup(groupId, memberId) {
    if (!groupId || !memberId) {
        throw new MissingParameters();
    }

    const updateParams = buildUpdateParams(groupId, memberId, "ADD");
    try {
        await updateEntity(dynamoDb, updateParams, groupId);
    } catch (error) {
        if (error.message.includes('The conditional request failed'))  {
            throw new GroupMaximumSize();
        }
        throw error;
    }

    return memberId;
}

async function removeMemberFromGroup(groupId, memberId) {
    if (!groupId || !memberId) {
        throw new MissingParameters();
    }
    
    const updateParams = buildUpdateParams(groupId, memberId, "DELETE");
    await updateEntity(dynamoDb, updateParams, groupId);

    return memberId;
}

function buildUpdateParams(groupId, memberId, operation) {
    const params = {
        TableName: TABLES.GROUPS,
        Key: { id: { S: groupId } },
        UpdateExpression: `${operation} memberIds :memberId`,
        ConditionExpression: 'size(memberIds) < :maxSize',
        ExpressionAttributeValues: {
            ':memberId': { "SS" : [memberId] },
            ':maxSize': { "N": MAX_MEMBERS_SIZE}
        },
        ReturnValues: 'UPDATED_NEW'
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