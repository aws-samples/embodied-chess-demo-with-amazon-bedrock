import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { SessionID, ...values } = ctx.arguments.input;

  const key = { SessionID, SK: "MOVE#LATEST" };
  const condition = { SessionID: { attributeExists: true } };

  return dynamodbUpdateRequest({ key, values, condition });
};

export const response = (ctx) => {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type, result);
  }
  return result;
};

const dynamodbUpdateRequest = ({ key, values, condition }) => {
  const update = {
    ...values,
    TimeStamp: util.time.nowFormatted("yyyy-MM-dd HH:mm:ss"),
  };

  if (!values.SfnExecutionId) {
    update.SfnExecutionId = ddb.operations.remove();
  }

  if (values.TaskToken === "") {
    update.TaskToken = ddb.operations.remove();
  }

  return ddb.update({ key, update, condition });
};
