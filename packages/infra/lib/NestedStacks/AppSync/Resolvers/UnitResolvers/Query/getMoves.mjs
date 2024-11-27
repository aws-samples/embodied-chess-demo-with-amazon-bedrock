import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { SessionID, limit, nextToken } = ctx.arguments;

  return ddb.query({
    index: "SortByMoveCount",
    query: { SessionID: { eq: SessionID } },
    limit,
    nextToken,
    scanIndexForward: false,
  });
};

export const response = (ctx) => {
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type, result);
  }

  return result;
};
