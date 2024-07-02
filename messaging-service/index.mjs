import { handleUsers } from './users.mjs';
import { handleGroups } from './groups.mjs';
import { handleMessages } from './messages.mjs';
import { UnsupportedResource } from './exceptions.mjs';

const headers = {
    'Content-Type': 'application/json',
};

export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const { resource } = event;

    let response;
    let statusCode = '200';

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
                throw new UnsupportedResource();
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
