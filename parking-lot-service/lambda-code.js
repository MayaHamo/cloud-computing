const crypto = require("crypto")
          const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');

          const dynamoDb = new DynamoDBClient({ });
          const TABLE_NAME = 'parkingEntries';

          exports.handler = async (event) => {
              const { httpMethod, path, queryStringParameters } = event;

              if (httpMethod === 'POST' && path === '/entry') {
                  return handleEntry(queryStringParameters);
              } else if (httpMethod === 'POST' && path === '/exit') {
                  return handleExit(queryStringParameters);
              } else {
                  return {
                      statusCode: 400,
                      body: JSON.stringify({ message: 'Invalid request' }),
                  };
              }
          };

          const handleEntry = async ({ plate, parkingLot }) => {
              const ticketId = crypto.randomUUID();
              const entryTime = Date.now();

              const params = {
                  TableName: TABLE_NAME,
                  Item: {
                      ticketId: { S: ticketId },
                      plate: { S: plate }
                      parkingLot: { S: parkingLot }
                      entryTime: { N: entryTime.toString() }
                  },
              };

              try {
                  await dynamoDb.send(new PutItemCommand(params));
                  return {
                      statusCode: 200,
                      body: JSON.stringify({ ticketId }),
                  };
              } catch (error) {
                  console.error('Error adding item to DynamoDB:', error);
                  return {
                      statusCode: 500,
                      body: JSON.stringify({ message: 'Error adding item to DynamoDB' }),
                  };
              }
          };

          const handleExit = async ({ ticketId }) => {
              const params = {
                  TableName: TABLE_NAME,
                  Key: { ticketId: { S: ticketId } },
              };

              try {
                  const { Item } = await dynamoDb.send(new GetItemCommand(params));

                  if (!Item) {
                      return {
                          statusCode: 404,
                          body: JSON.stringify({ message: 'Ticket not found' }),
                      };
                  }

                  const exitTime = Date.now();
                  const totalTime = exitTime - parseInt(Item.entryTime.N);
                  const totalMinutes = Math.ceil(totalTime / (1000 * 60));
                  const totalHours = totalMinutes / 60;
                  const charge = (totalHours * 10).toFixed(2);

                  return {
                      statusCode: 200,
                      body: JSON.stringify({
                          plate: Item.plate.S,
                          totalTime: `${Math.floor(totalHours)} hours ${totalMinutes % 60} minutes`,
                          parkingLot: Item.parkingLot.S,
                          charge: `$${charge}`
                      }),
                  };
              } catch (error) {
                  console.error('Error retrieving item from DynamoDB:', error);
                  return {
                      statusCode: 500,
                      body: JSON.stringify({ message: 'Error retrieving item from DynamoDB' }),
                  };
              }
          };
