import { handleUsers } from './users.mjs';
import { handleGroups } from './groups.mjs';
import { handleMessages } from './messages.mjs';
import { ErrorData } from './errors.mjs';


const headers = {
    'Content-Type': 'application/json',
};

export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const { httpMethod, path, resource, pathParameters } = event;

    let body;
    let response;
    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        const resources = resource.split('/');
        switch (resources[1]) {
            case 'users':
                response = await handleUsers(event);
                break;
            case 'groups': 
                response = await handleGroups(event);
                break;
            case 'messages': 
                response = await handleMessages(event);
                break;
            default:
                throw new ErrorData(400, `Unsupported path ${JSON.stringify(path)}`);
        }
    } catch (error) {
        statusCode = error.errorCode || '500';
        response = error.message;
    }

    return {
        statusCode,
        body: JSON.stringify(response),
        headers,
    };
};
