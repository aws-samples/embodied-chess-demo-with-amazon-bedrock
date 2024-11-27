import { ResourcesConfig } from "aws-amplify";

export const awsconfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USERPOOLID,
      userPoolClientId: import.meta.env.VITE_USERPOOLCLIENTID,
      identityPoolId: import.meta.env.VITE_IDENTITYPOOLID,
    },
  },

  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNCAPI,
      defaultAuthMode: "userPool",
    },
  },

  Predictions: {
    convert: {
      speechGenerator: {
        region: import.meta.env.VITE_REGION,
        proxy: false,
        defaults: {
          voiceId: "Amy",
        },
      },
    },
  },

  Storage: {
    S3: {
      bucket: import.meta.env.VITE_UISTORAGEBUCKET,
      region: import.meta.env.VITE_REGION,
    },
  },
};
