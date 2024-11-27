import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const client = new SQSClient({});

export const handler = async (event, context) => {
  console.log(event);
  const { SessionID, GameStatus } = event;

  if (GameStatus === "PLAYING") {
    // Place the new move into the moveQueue to be processesd
    await client.send(
      new SendMessageCommand({
        QueueUrl: process.env.MoveQueue,
        MessageBody: JSON.stringify({
          SessionID,
          Action: "START",
        }),
        MessageGroupId: SessionID,
        MessageDeduplicationId: context.awsRequestId,
      })
    );
  }

  return event;
};
