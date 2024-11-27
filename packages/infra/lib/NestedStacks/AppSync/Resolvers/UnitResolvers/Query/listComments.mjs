import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { SessionID } = ctx.arguments;

  return dynamodbQueryRequest({ SessionID });
};

export const response = (ctx) => {
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type, result);
  }

  return result.items;
};

const dynamodbQueryRequest = ({ SessionID }) => {
  return ddb.query({
    query: { SessionID: { eq: SessionID }, SK: { beginsWith: "COMMENT#" } },
  });
};
