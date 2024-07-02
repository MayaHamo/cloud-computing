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
#### users
Partition key: `id`
#### groups
Partition key: `id`
#### messages
Partition key: `recipient`</br>
Sort key: `dateCreated`

## Implementation Details

#### On sending group message:
- fetch group by id from `groups` table.
- iterate over the group's members and store the message for each member.

_Note #1: Group size is limited to 100 members (Whatsapp limit is 1024 members)._</br>
_Note #2: Blocked user checks are performed only for direct messages, not for group messages._
##### Possible Improvement
The duration of sending a group message depends on the number of members in the group. To support large groups and reduce latency, we can use queues (such as `SQS`) to handle message delivery to each member asynchronously.
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
#### `GET /messages/{recipient}?from={timestamp}` 
get all recipient messages from a specific date</br>
response contains: `from`, `to` timestamps.</br></br>
_if no specific date was mentioned the response will contain all messages since the beginning with maximum of **200** messages_
#### `POST /messages/user/{recipient}`</br>
`request body { "sender", "content" }`</br>
user (sender) send a message with content to another user (recipient)
#### `POST /messages/group/{groupId}`</br>
`request body { "sender", "content" }`</br> 
user (sender) send a message with content to a group (groupId)

## Scaling
### 1000 Users
our current setup is designed to handle traffic efficiently and at a minimal cost. Utilizing on-demand capacity for DynamoDB and Lambda keeps expenses low while allowing the system to scale automatically as needed.
### 10,000 Users
costs will remain relatively low thanks to AWS's pricing model based on millions of requests. However, expenses might start to increase. It's essential to monitor traffic and consider switching to provisioned capacity for DynamoDB to manage costs more effectively.</br>Auto-scaling can be configured to handle traffic spikes.
### Millions of Users
the system will still scale automatically, but there's a risk of throttling - we need to manage throttling errors on the client side by implementing retry mechanisms.
## Pricing
### Assumptions
- each user sends 50 direct messages per day.
- each user sends 20 group messages per day.
- each user reads 100 messages per day.
- each group has 10 members.
- Message size = 1KB
***

### Calculation Example: Monthly cost for 1000 users
In this cost calculation example, we will focus on the costs associated with sending and storing messages, as the costs of creating users and groups are negligible in comparison to message handling.
- each user sends `50 * 30 (days) = 1500` direct messages per month.
- each user sends `20 * 30 (days) = 600` group messages per month.
    - in each group we have 10 members - we store `600 * 10 = 6000` messages.
- each user reads `100 * 30 (days) = 3000` messages per month.

#### DynamoDB
According to [DynamoDB Pricing for On-Demand](https://aws.amazon.com/dynamodb/pricing/on-demand/) Capacity:</br>
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
- Storage: 7.5 million * 1KB = 7.5 GB
    - first 3 months will be because we did not reach the 25GB limit.
    - forth month storage size will be ~30GB and the payment for the extra 5GB is $0.25 * 5 =  $1.25

##### Reads
- read messages = `1000 (users) * 3000` = 3 million

In each write request for direct message we are also make a read request for checking blocked users.
In total 1.5 million (direct messages) + 3 million = 4.5 million read per month.
</br>
</br>
Read requests cost = $0.25 * 4.5 = $1.125

#### Lambda
According to [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/):</br>
on x86 architecture

7.5 million (Write requests) + 4.5 million (Read requests) = 12 million requests</br>
Let's assume that the duration of each request = 100ms</br>
12 million * 100ms = 1.2 million seconds</br>
Current lambda memory is 512MB</br>
=> 512MB * 12 million / 1.2 million = 

#### API Gateway
According to [API Gateway REST APIs pricing](https://aws.amazon.com/api-gateway/pricing/#REST_APIs): "First 333 million requests per month cost $3.5 per million":</br>
7.5 million (Write requests) + 4.5 million (Read requests) = 12 million requests</br></br>
Requests cost = $3.5 * 12 = $42
