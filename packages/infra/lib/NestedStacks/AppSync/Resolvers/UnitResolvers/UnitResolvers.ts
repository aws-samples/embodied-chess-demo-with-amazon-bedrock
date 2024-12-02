import * as cdk from "aws-cdk-lib";

import * as iam from "aws-cdk-lib/aws-iam";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";

import { Construct } from "constructs";

interface IUnitResolvers {
  ddbDataSource: appsync.DynamoDbDataSource;
  graphqlApi: appsync.GraphqlApi;
  userPool: cognito.UserPool;
}

export class UnitResolvers extends Construct {
  readonly ddbDataSource: appsync.DynamoDbDataSource;
  readonly graphqlApi: appsync.GraphqlApi;
  readonly cognitoDataSource: appsync.HttpDataSource;

  constructor(
    scope: Construct,
    id: string,
    { ddbDataSource, graphqlApi, userPool }: IUnitResolvers
  ) {
    super(scope, id);

    this.ddbDataSource = ddbDataSource;
    this.graphqlApi = graphqlApi;

    this.cognitoDataSource = this.graphqlApi.addHttpDataSource(
      "Cognito DS",
      `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com`,
      {
        authorizationConfig: {
          signingRegion: cdk.Stack.of(this).region,
          signingServiceName: "cognito-idp",
        },
      }
    );
    this.cognitoDataSource.grantPrincipal.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:ListUsers"],
        resources: [userPool.userPoolArn],
      })
    );

    /*************************************************************/
    /************************** Queries **************************/
    /*************************************************************/

    this.listActiveSessions();
    this.listGamesByMoveCount();
    this.listComments();
    this.listUsers();
    this.getSession();
    this.getMoves();
    this.getLatestMove();

    /*************************************************************/
    /************************** Mutations ************************/
    /*************************************************************/

    this.verifySession();
    this.updateSession();
    this.createComment();
    this.updateLatestMove();
  }

  // Queries
  listActiveSessions = () => {
    const fieldName = "listActiveSessions";
    const typeName = "Query";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.ddbDataSource,
      fieldName,
      typeName,
    });
  };

  listGamesByMoveCount = () => {
    const fieldName = "listGamesByMoveCount";
    const typeName = "Query";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.ddbDataSource,
      fieldName,
      typeName,
    });
  };

  listComments = () => {
    const fieldName = "listComments";
    const typeName = "Query";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.ddbDataSource,
      fieldName,
      typeName,
    });
  };

  listUsers = () => {
    const fieldName = "listUsers";
    const typeName = "Query";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.cognitoDataSource,
      fieldName,
      typeName,
    });
  };

  getSession = () => {
    const fieldName = "getSession";
    const typeName = "Query";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.ddbDataSource,
      fieldName,
      typeName,
    });
  };

  getMoves = () => {
    const fieldName = "getMoves";
    const typeName = "Query";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.ddbDataSource,
      fieldName,
      typeName,
    });
  };

  getLatestMove = () => {
    const fieldName = "getLatestMove";
    const typeName = "Query";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.ddbDataSource,
      fieldName,
      typeName,
    });
  };

  // Mutations
  verifySession = () => {
    const fieldName = "verifySession";
    const typeName = "Mutation";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.ddbDataSource,
      fieldName,
      typeName,
    });
  };

  updateSession = () => {
    const fieldName = "updateSession";
    const typeName = "Mutation";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.ddbDataSource,
      fieldName,
      typeName,
    });
  };

  createComment = () => {
    const fieldName = "createComment";
    const typeName = "Mutation";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.ddbDataSource,
      fieldName,
      typeName,
    });
  };

  updateLatestMove = () => {
    const fieldName = "updateLatestMove";
    const typeName = "Mutation";

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource: this.ddbDataSource,
      fieldName,
      typeName,
    });
  };
}
