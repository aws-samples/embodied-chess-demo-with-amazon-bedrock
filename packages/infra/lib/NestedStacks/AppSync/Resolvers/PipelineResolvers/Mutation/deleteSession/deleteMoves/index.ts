import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchWriteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({});
const ddbClient = DynamoDBDocumentClient.from(db);
const s3Client = new S3Client({});

const TableName = process.env.TABLE_NAME!;
const Bucket = process.env.S3_BUCKET;

export const handler = async (event) => {
  const { SessionID } = event;

  const allMoves = [];

  // Moves
  let ExclusiveStartKey;
  do {
    const { Items, LastEvaluatedKey } = await ddbClient.send(
      new QueryCommand({
        TableName,
        KeyConditionExpression: "SessionID = :id AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":id": SessionID,
          ":sk": "MOVE#",
        },
        Limit: 25,
      })
    );
    ExclusiveStartKey = LastEvaluatedKey;

    if (Items.length) {
      await ddbClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TableName]: Items.map(({ SessionID, SK }) => {
              return {
                DeleteRequest: {
                  Key: {
                    SessionID,
                    SK,
                  },
                },
              };
            }),
          },
        })
      );

      allMoves.push(...Items);
    }
  } while (ExclusiveStartKey);

  const allComments = [];
  // Comments
  do {
    const { Items, LastEvaluatedKey } = await ddbClient.send(
      new QueryCommand({
        TableName,
        KeyConditionExpression: "SessionID = :id AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":id": SessionID,
          ":sk": "COMMENT#",
        },
        Limit: 25,
      })
    );
    ExclusiveStartKey = LastEvaluatedKey;

    if (Items.length) {
      await ddbClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TableName]: Items.map(({ SessionID, SK }) => {
              return {
                DeleteRequest: {
                  Key: {
                    SessionID,
                    SK,
                  },
                },
              };
            }),
          },
        })
      );

      allComments.push(...Items);
    }
  } while (ExclusiveStartKey);

  const { Item } = await ddbClient.send(
    new GetCommand({
      TableName,
      Key: {
        SessionID,
        SK: "SESSION",
      },
    })
  );

  const todaysDate = new Date().toISOString().split("T")[0];
  const Key = `${todaysDate}/${SessionID}/${Date().split(" ")[4]}.json`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: JSON.stringify({ Session: Item, allMoves, allComments }, null, 2),
    })
  );
};
