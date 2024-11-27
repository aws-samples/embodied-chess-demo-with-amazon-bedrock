import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { SessionID } = ctx.args.input;

  return ddb.query({
    query: {
      SessionID: { eq: SessionID },
      SK: { beginsWith: "MOVE#" },
    },
    scanIndexForward: false,
  });
};

export const response = (ctx) => {
  const { error, result } = ctx;

  if (!result.items.length) {
    return util.error(
      `There should be at least one MOVE record attached to this session: ${result}`,
      "NO_MOVE_RECORD"
    );
  }

  // DO SOME LOGIC HERE TO MAKE SURE ITS A VALID MOVE
  // ...

  if (error) {
    return util.error(error.message, error.type, result);
  }

  return result;
};
