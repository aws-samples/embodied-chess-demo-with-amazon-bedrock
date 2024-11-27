import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { Ic } from "isepic-chess";
import { Chess } from "chess.js";

import {
  IoTDataPlaneClient,
  PublishCommand,
} from "@aws-sdk/client-iot-data-plane";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL;
const region = process.env.AWS_REGION;
const endpoint = new URL(GRAPHQL_ENDPOINT!);

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
      TaskToken
      SuggestedMove
    }
  }
`;

const client = new IoTDataPlaneClient({});

export const handler = async (event) => {
  const { SessionID, LatestMove, PlayerOutput } = event.input;
  const { taskToken } = event;

  const isepic = Ic.initBoard({ fen: LatestMove.Item.Move.S });
  const isepicMove = isepic.playMove(PlayerOutput.Move);

  const chessjs = new Chess(LatestMove.Item.Move.S);
  const chessjsMove = chessjs.move(isepicMove.san);

  const iotPayload = {
    ...chessjsMove,
    action: "move",
    sessionId: SessionID,
    taskToken,
  };

  await client.send(
    new PublishCommand({
      topic: process.env.topicRule,
      contentType: "application/json",
      payload: JSON.stringify(iotPayload),
      qos: 1,
    })
  );

  const variables = {
    input: {
      SessionID,
      TaskToken: taskToken,
      SuggestedMove: PlayerOutput.Move,
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
  if (body.errors) throw new Error(JSON.stringify(body.errors, null, 2));

  return iotPayload;
};
