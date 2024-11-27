import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  return {
    operation: "Invoke",
    payload: ctx.arguments.input,
  };
};

export const response = (ctx) => {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type, result);
  }
  return result;
};
