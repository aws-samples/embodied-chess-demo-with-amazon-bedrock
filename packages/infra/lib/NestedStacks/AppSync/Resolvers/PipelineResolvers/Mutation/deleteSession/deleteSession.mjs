import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { SessionID } = ctx.args.input;
  return {
    operation: "DeleteItem",
    key: util.dynamodb.toMapValues({ SessionID, SK: "SESSION" }),
  };
}

export function response(ctx) {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type, result);
  }
  return result;
}
