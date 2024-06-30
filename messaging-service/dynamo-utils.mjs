import { PutItemCommand, GetItemCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { ErrorData } from './errors.mjs';

/* Dynamo DB handler methods */
function valueToDynamoSyntax(value) {
    switch (typeof value) {
        case 'boolean': return { BOOL: value };
        case 'string': return { S: value };
        case 'number': return { N: value.toString() };
        case 'object': return value instanceof Set ? { SS: Array.from(value) } : {};
        default: return {};
    }
}

export function convertEntityToDynamoItem(entity) {
    let params = {};
    for (const [key, value] of Object.entries(entity)) {
        params[key] = valueToDynamoSyntax(value);
    }
    return params;
}

export async function getEntity(dynamoDb, tableName, id) {
    const params = {
        TableName: tableName,
        Key: { id: { S: id } },
    };

    try {
        const { Item } = await dynamoDb.send(new GetItemCommand(params));
        if (!Item) throw new ErrorData(404, "Entity Not Found");

        return unmarshall(Item);
    } catch (error) {
        if (error instanceof ErrorData) throw error;
        throw new ErrorData(500, `Error retrieving an item from db: ${error.message}`, error);
    } 
}

export async function createEntity(dynamoDb, tableName, entity) {
    const dynamoItem = convertEntityToDynamoItem(entity);
    const params = {
        TableName: tableName,
        Item: dynamoItem,
    };
    

    try {
        await dynamoDb.send(new PutItemCommand(params));
        return entity.id;
    } catch (error) {
        throw new ErrorData(500, `Error adding an item to db: ${error.message}`, error);
    } 
}

export async function deleteEntity(dynamoDb, tableName, id) {
    const params = {
        TableName: tableName,
        Key: { id: { S: id } },
    };

    try {
        await dynamoDb.send(new DeleteItemCommand(params));
        return {};
    } catch (error) {
        throw new ErrorData(500, `Error deleting an item from db: ${error.message}`, error);
    } 
}

export async function updateEntity(dynamoDb, params, id) {
    try {
        await dynamoDb.send(new UpdateItemCommand(params));
        return id;
    } catch (error) {
        throw new ErrorData(500, `Error updating an item from db: ${error.message}`, error);
    } 
}

