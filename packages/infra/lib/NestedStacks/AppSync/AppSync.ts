import * as cdk from "aws-cdk-lib";

import * as cognito from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3 from "aws-cdk-lib/aws-s3";

import * as path from "path";

import { Construct } from "constructs";
import { UnitResolvers } from "./Resolvers/UnitResolvers/UnitResolvers";
import { PipelineResolvers } from "./Resolvers/PipelineResolvers/PipelineResolvers";

interface AppSyncProps {
  userPool: cognito.UserPool;
  moveQueue: sqs.Queue;
  archiveBucket: s3.Bucket;
  ddbTable: ddb.TableV2;
}

export class AppSync extends Construct {
  public readonly graphqlApi: appsync.GraphqlApi;

  constructor(
    scope: Construct,
    id: string,
    { userPool, moveQueue, ddbTable, archiveBucket }: AppSyncProps
  ) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    /********************************************************************/
    /***************************** AppSync ******************************/
    /********************************************************************/

    this.graphqlApi = new appsync.GraphqlApi(this, "Frontend API", {
      name: stack.stackName,
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "../../../../webapp/schema.graphql")
      ),

      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool },
        },
        additionalAuthorizationModes: [
          { authorizationType: appsync.AuthorizationType.IAM },
        ],
      },

      environmentVariables: { TABLE_NAME: ddbTable.tableName },

      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    /********************************************************************/
    /************************** Data Sources ****************************/
    /********************************************************************/

    const ddbDataSource = new appsync.DynamoDbDataSource(
      this,
      "DDB Table Connection",
      { api: this.graphqlApi, table: ddbTable }
    );

    /********************************************************************/
    /************************** Unit Resolvers **************************/
    /********************************************************************/

    new UnitResolvers(this, "Unit Resolvers", {
      ddbDataSource,
      graphqlApi: this.graphqlApi,
    });

    /********************************************************************/
    /************************ Pipeline Resolvers ************************/
    /********************************************************************/

    new PipelineResolvers(this, "Pipeline Resolvers", {
      graphqlApi: this.graphqlApi,
      ddbDataSource,
      archiveBucket,
      moveQueue,
      ddbTable,
    });
  }
}
