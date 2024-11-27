import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  return {};
};

export const response = (ctx) => {
  const { error, result } = ctx;
  if (error) {
    return util.appendError(error.message, error.type, result);
  }
  return ctx.prev.result;
};
