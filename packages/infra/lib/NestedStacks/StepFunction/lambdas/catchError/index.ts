import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { sendRequest } from "./appsync";

const client = new DynamoDBClient({});
const ddbClient = DynamoDBDocumentClient.from(client);

const TableName = process.env.TableName;

const updateSessionQuery = /* GraphQL */ `
  mutation UPDATE_SESSION($input: UpdateSessionInput!) {
    updateSession(input: $input) {
      SessionID
      SK
    }
  }
`;

export const handler = async (event) => {
  console.log(event);
  const {
    SessionID,
    ErrorInfo: { Error: ErrorType, Cause },
  } = event;

  await ddbClient.send(
    new UpdateCommand({
      TableName,
      Key: { SessionID, SK: "MOVE#LATEST" },
      UpdateExpression: "REMOVE SfnExecutionId, TaskToken",
    })
  );

  await sendRequest(updateSessionQuery, {
    input: {
      SessionID,
      GameStatus: "ERROR",
      Error: ErrorType,
      Cause,
    },
  });

  throw new Error("Caught Error");
};
