# Messaging App Service

## Overview

A simple backend for a messaging application which will manage users, groups, and messages. 

## Entities

### User
```
User {
    id: string
    blockedUsers: Set
    dateCreated: string
}
```

### Group
```
Group {
    id: string
    memberIds: Set
    dateCreated: string
}
```

### Message
```
Message {
    id: string
    sender: string
    recipient: string
    content: string
    dateCreated: string
}
```

## Database Tables
Each entity describes a corresponding database table:
- `users`
- `groups`
- `messages`

## API
#### `POST /users` - register a user</br>
#### `GET /users/{id}` - get user</br>
#### `DELETE /users/{id}` - delete user</br>
#### `POST /users/{id}/block/{blockUser}` - user {id} blocks user {blockUser}</br>
#### `DELETE /users/{id}/block/{blockUser}` - user {id} unblock user {blockUser}
***
#### `POST /groups` - creates an empty group
#### `GET /groups/{id}` - get group
#### `POST /groups/{id}/add/{memberId}` - add member to group
#### `POST /groups/{id}/remove/{memberId}` - remove member from group
***
#### `POST /messages/{recipient}?from={timestamp}` 
get all recipient messages from a specific date</br>
response contains: `from`, `to` timestamps.</br></br>
_if no specific date was mentioned the response will contain all messages since the beginning with maximum of 200 messages_
#### `POST /messages/user/{recipient}`</br>
`request body { "sender", "content" }`</br>
user (sender) send a message with content to another user (recipient)
#### `POST /messages/group/{groupId}`</br>
`request body { "sender", "content" }`</br> 
user (sender) send a message with content to a group (groupId)