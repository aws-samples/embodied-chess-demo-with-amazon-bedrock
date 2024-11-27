import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  const { SessionID, Comment, Author, ModelID } = ctx.args;
  const { text } = ctx.prev.result.output.message.content[0];

  const now = util.time.nowISO8601();
  const before = util.time.epochMilliSecondsToISO8601(
    util.time.parseISO8601ToEpochMilliSeconds(now) - 1000
  );

  return {
    operation: "BatchPutItem",
    tables: {
      [ctx.env.TABLE_NAME]: [
        util.dynamodb.toMapValues({
          SessionID,
          SK: `COMMENT#${before}`,
          Comment,
          Author,
        }),
        util.dynamodb.toMapValues({
          SessionID,
          SK: `COMMENT#${now}`,
          Comment: text,
          Author: ModelID,
        }),
      ],
    },
  };
};

export const response = (ctx) => {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type, result);
  }

  const { SessionID } = ctx.args;
  return { SessionID };
};
