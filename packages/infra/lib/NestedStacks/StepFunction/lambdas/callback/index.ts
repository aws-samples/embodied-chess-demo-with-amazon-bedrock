import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { Chess } from "chess.js";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL;
const TableName = process.env.TableName;
const region = process.env.AWS_REGION;
const endpoint = new URL(GRAPHQL_ENDPOINT!);

const ddbClient = new DynamoDBClient({});

const signer = new SignatureV4({
  credentials: defaultProvider(),
  service: "appsync",
  sha256: Sha256,
  region,
});

const query = /* GraphQL */ `
  mutation UPDATE_LATEST_MOVE($input: UpdateLatestMoveInput!) {
    updateLatestMove(input: $input) {
      SessionID
      SK
      Action
      Move
      MoveCount
      TimeStamp
      SfnExecutionId
    }
  }
`;

export const handler = async (event) => {
  console.log(JSON.stringify(event, null, 2));
  const { SessionID, PlayerOutput, LatestMove, Session } = event.input;
  const { Move, SanList } = PlayerOutput;
  const { Item } = LatestMove;
  const chess = new Chess(Move);

  const checkStatus = () => {
    const lastMove = new Chess(Item.Move.S);
    return chess.isCheckmate() ? lastMove.turn() : "Draw";
  };

  const variables = {
    input: {
      SessionID,
      Action: "MOVE",
      Move,
      SfnExecutionId: "",
      SuggestedMove: "",
      TaskToken: "",
      SanList,
      MoveCount: parseInt(Item.MoveCount.N) + 1,
      GameWinner: chess.isGameOver() ? checkStatus() : "",
    },
  };

  const requestToBeSigned = new HttpRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: endpoint.host,
    },
    hostname: endpoint.host,
    body: JSON.stringify({ query, variables }),
    path: endpoint.pathname,
  });

  const signed = await signer.sign(requestToBeSigned);
  const request = new Request(GRAPHQL_ENDPOINT!, signed);

  const response = await fetch(request);
  const body = await response.json();
  if (body.errors) {
    throw new Error(JSON.stringify(body.errors));
  }

  await ddbClient.send(
    new PutItemCommand({
      TableName,
      Item: {
        ...Item,
        SK: {
          S: `MOVE#${new Date().toISOString()}`,
        },
        SfnExecutionId: {
          S: event.executionId,
        },
      },
    })
  );

  // Trigger the next to move by returning below
  const { Item: Record } = Session;

  return {
    ...event.input,
    TurnActor: chess.turn() ? Record.White.S : Record.Black.S,
    IsGameOver: chess.isGameOver(),
  };
};
