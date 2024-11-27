import {
  IoTDataPlaneClient,
  PublishCommand,
} from "@aws-sdk/client-iot-data-plane";

const client = new IoTDataPlaneClient({});

export const handler = async (event) => {
  const { SessionID } = event.input;
  const { taskToken } = event;

  const request = {
    sessionId: SessionID,
    action: "start",
    before: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    after: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    color: "w",
    piece: "",
    from: "",
    to: "",
    san: "",
    lan: "",
    flags: "b",
    taskToken,
  };

  return await client.send(
    new PublishCommand({
      topic: process.env.topicRule,
      contentType: "application/json",
      payload: JSON.stringify(request),
      qos: 1,
    })
  );
};
