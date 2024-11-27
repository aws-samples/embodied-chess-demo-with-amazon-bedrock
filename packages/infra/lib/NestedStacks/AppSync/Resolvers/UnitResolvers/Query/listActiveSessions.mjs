import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { nextToken } = ctx.arguments;
  return dynamodbQueryRequest(nextToken);
};

export const response = (ctx) => {
  const { error, result } = ctx;
  if (error) {
    return util.appendError(error.message, error.type, result);
  }
  return result;
};

const dynamodbQueryRequest = (nextToken) => {
  return ddb.scan({ index: "ListBySessionType", nextToken });
};
