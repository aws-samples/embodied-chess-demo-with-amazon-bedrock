import {
  SFNClient,
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
} from "@aws-sdk/client-sfn";

const client = new SFNClient({});

export const handler = async (event, context) => {
  console.log(event);
  const { taskToken, status, reason } = event;

  switch (status) {
    case 200: {
      return await client.send(
        new SendTaskSuccessCommand({
          taskToken,
          output: JSON.stringify({ reason: "SUCCESS" }),
        })
      );
    }
    case 400: {
      return await client.send(
        new SendTaskFailureCommand({
          taskToken,
          error: "Robot Error",
          cause: reason,
        })
      );
    }
    case 500: {
      return await client.send(
        new SendTaskFailureCommand({
          taskToken,
          error: "Robot Error",
          cause: reason,
        })
      );
    }
    default:
      return new SendTaskFailureCommand({
        taskToken,
        error: "Robot Error",
        cause: reason,
      });
  }
};
