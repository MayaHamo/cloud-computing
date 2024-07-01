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
_if no specific date was mentioned the response will contain all messages since the beginning with maximum of **200** messages_
#### `POST /messages/user/{recipient}`</br>
`request body { "sender", "content" }`</br>
user (sender) send a message with content to another user (recipient)
#### `POST /messages/group/{groupId}`</br>
`request body { "sender", "content" }`</br> 
user (sender) send a message with content to a group (groupId)

## Scaling & Pricing
### Assumptions
- each user sends 50 direct messages per day.
- each user sends 20 group messages per day.
- each user reads 100 messages per day.
- each group has 10 members.
- Message size = 1KB

### Calculation Example: Monthly cost for 1000 users
In this cost calculation example, we will focus on the costs associated with sending and storing messages, as the costs of creating users and groups are negligible in comparison to message handling.
- each user sends `50 * 30 (days) = 1500` direct messages per month.
- each user sends `20 * 30 (days) = 600` group messages per month.
    - in each group we have 10 members - we store `600 * 10 = 6000` messages.
- each user reads `100 * 30 (days) = 3000` messages per month.



#### DynamoDB
According to DynamoDB Pricing for On-Demand Capacity:</br>
- Write Request Units (WRU)	$1.25 per million write request units
- Read Request Units (RRU)	$0.25 per million read request units
- Storage: 
    - First 25 GB stored per month is free using the DynamoDB Standard table class
    - $0.25 per GB-month thereafter
##### Writes
- direct messages = `1000 (users) * 1500` = 1.5 million
- group messages = `1000 (users) * 6000` = 6 million. 

In total 7.5 million writes per month:
- Write requests cost = $1.25 * 7.5 = $9.375
- Storage: 7.5 million * 1KB = 7.5 GB < 10 GB => $0

##### Reads
- read messages = `1000 (users) * 3000` = 3 million

In each write request for direct message we are also make a read request for checking blocked users.
In total 1.5 million (direct messages) + 3 million = 4.5 million read per month.
</br>
</br>
Read requests cost = $0.25 * 4.5 = $1.125

