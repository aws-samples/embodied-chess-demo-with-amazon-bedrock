import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  return {
    method: "POST",
    resourcePath: "/",
    params: {
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.ListUsers",
      },
      body: { UserPoolId: ctx.env.CONGITO_USER_POOL },
    },
  };
};

export const response = (ctx) => {
  const { body, statusCode } = ctx.result;

  if (statusCode === 200) {
    const response = JSON.parse(body);

    return response.Users.map(
      (user) => user.Attributes.filter((attr) => attr.Name === "email")[0].Value
    );
  }
};
