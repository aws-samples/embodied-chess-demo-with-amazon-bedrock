import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  return ddb.query({
    index: "GamesByMoveCount",
    query: { SK: { eq: "MOVE#LATEST" } },
  });
};

export const response = (ctx) => {
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type, result);
  }

  return result.items;
};
