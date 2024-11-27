import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { SessionID, ...item } = ctx.arguments.input;

  return dynamodbPutRequest({ SessionID, item });
};

export const response = (ctx) => {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type, result);
  }
  return result;
};

const dynamodbPutRequest = ({ SessionID, item }) => {
  const datetime = util.time.nowISO8601();
  const key = { SessionID, SK: `COMMENT#${datetime}` };

  return ddb.put({ key, item });
};
