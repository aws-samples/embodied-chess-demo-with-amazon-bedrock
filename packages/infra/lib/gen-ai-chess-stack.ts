import * as cdk from "aws-cdk-lib";

import * as sqs from "aws-cdk-lib/aws-sqs";

import { Construct } from "constructs";

import { Amplify } from "./NestedStacks/Amplify/Amplify";
import { Storage } from "./NestedStacks/Storage/Storage";
import { AppSync } from "./NestedStacks/AppSync/AppSync";
import { StepFunction } from "./NestedStacks/StepFunction/StepFunction";
import { Authentication } from "./NestedStacks/Authentication/Authentication";

export class GenAiChessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const moveQueue = new sqs.Queue(this, "Move Queue", {
      fifo: true,
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: new sqs.Queue(this, "DLQ", { fifo: true }),
      },
    });

    /********************************************************************/
    /***************************** Storage ******************************/
    /********************************************************************/

    const { amplifyStagingBucket, uiStorageBucket, archiveBucket, ddbTable } =
      new Storage(this, "Storage");

    /********************************************************************/
    /************************** Authentication **************************/
    /********************************************************************/

    const { userPool, userPoolClient, identityPool } = new Authentication(
      this,
      "Authentication",
      {
        uiStorageBucket,
      }
    );

    /********************************************************************/
    /***************************** AppSync ******************************/
    /********************************************************************/

    const { graphqlApi } = new AppSync(this, "AppSync", {
      userPool,
      moveQueue,
      archiveBucket,
      ddbTable,
    });

    /********************************************************************/
    /***************************** Amplify ******************************/
    /********************************************************************/

    new Amplify(this, "Amplify", {
      amplifyStagingBucket,
      uiStorageBucket,
      userPool,
      userPoolClient,
      identityPool,
      graphqlApi,
    });

    /********************************************************************/
    /************************** Step Function ***************************/
    /********************************************************************/

    new StepFunction(this, "Step Function", {
      graphqlApi,
      ddbTable,
      moveQueue,
    });

    /********************************************************************/
    /***************************** Outputs ******************************/
    /********************************************************************/

    new cdk.CfnOutput(this, "VITE_USERPOOLID", {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "VITE_USERPOOLCLIENTID", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "VITE_IDENTITYPOOLID", {
      value: identityPool.identityPoolId,
    });
    new cdk.CfnOutput(this, "VITE_APPSYNCAPI", {
      value: graphqlApi.graphqlUrl,
    });
    new cdk.CfnOutput(this, "VITE_REGION", {
      value: this.region,
    });
    new cdk.CfnOutput(this, "VITE_UISTORAGEBUCKET", {
      value: uiStorageBucket.bucketName,
    });
  }
}
