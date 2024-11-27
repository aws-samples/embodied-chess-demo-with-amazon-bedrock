import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const client = new SQSClient({});

export const handler = async (event, context) => {
  console.log(event);
  const { SessionID, Action, Turn, Move } = event;

  // Place the new move into the moveQueue to be processesd
  await client.send(
    new SendMessageCommand({
      QueueUrl: process.env.MoveQueue,
      MessageBody: JSON.stringify({
        SessionID,
        Action,
        Turn,
        Move,
      }),
      MessageGroupId: SessionID,
      MessageDeduplicationId: context.awsRequestId,
    })
  );

  return event;
};
