import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { SessionID } = ctx.arguments.input;

  return dynamodbPutRequest({ SessionID });
};

export const response = (ctx) => {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type, result);
  }
  return result;
};

const dynamodbPutRequest = ({ SessionID }) => {
  const item = {
    Action: "INITIALISE_BOARD",
    Move: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    TimeStamp: util.time.nowFormatted("yyyy-MM-dd HH:mm:ss"),
    MoveCount: 0,
  };

  const key = { SessionID, SK: "MOVE#LATEST" };

  return ddb.put({ key, item });
};
