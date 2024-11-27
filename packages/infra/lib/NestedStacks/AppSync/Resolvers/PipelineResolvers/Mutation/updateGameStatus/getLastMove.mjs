import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { SessionID } = ctx.arguments.input;

  return dynamodbGetRequest({ SessionID });
};

export const response = (ctx) => {
  const { error, result } = ctx;

  if (!result) {
    return util.error(
      `There should be a LATEST MOVE record attached to this session: ${ctx.args.input.SessionID}`,
      "NO_LATEST_MOVE_RECORD"
    );
  }

  if (error) {
    return util.error(error.message, error.type, result);
  }

  return result;
};

const dynamodbGetRequest = ({ SessionID }) => {
  return ddb.get({ key: { SessionID, SK: "MOVE#LATEST" } });
};
