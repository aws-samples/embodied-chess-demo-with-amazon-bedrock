import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { SessionID, ...values } = ctx.arguments.input;

  const key = { SessionID, SK: "SESSION" };
  const condition = { SessionID: { attributeExists: true } };

  return dynamodbUpdateRequest({ key, update: values, condition });
};

export const response = (ctx) => {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type, result);
  }
  return result;
};

const dynamodbUpdateRequest = ({ key, update, condition }) => {
  return ddb.update({ key, update, condition });
};
