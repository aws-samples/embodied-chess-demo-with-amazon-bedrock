import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  const { ModelID, Comment, Board } = ctx.args;

  const payload = {
    messages: [
      {
        role: "user",
        content: [
          {
            text: `Your task is to best advise on a chess game denoted by the following Forsyth-Edwards Notation (FEN): ${Board}. Answer the question as best you can.`,
          },
          {
            text: Comment,
          },
        ],
      },
    ],
  };

  return {
    method: "POST",
    resourcePath: `/model/${ModelID}/converse`,
    params: {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: payload,
    },
  };
};

export const response = (ctx) => {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type, result);
  }
  return JSON.parse(result.body);
};
