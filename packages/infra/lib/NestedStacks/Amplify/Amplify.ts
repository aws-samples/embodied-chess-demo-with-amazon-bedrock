import * as cdk from "aws-cdk-lib";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cb from "aws-cdk-lib/aws-codebuild";
import * as cp from "aws-cdk-lib/aws-codepipeline";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as s3Assets from "aws-cdk-lib/aws-s3-assets";
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import * as actions from "aws-cdk-lib/aws-codepipeline-actions";

import { IdentityPool } from "@aws-cdk/aws-cognito-identitypool-alpha";
import { Construct } from "constructs";

interface AmplifyProps {
  userPoolClient: cognito.UserPoolClient;
  amplifyStagingBucket: s3.Bucket;
  graphqlApi: appsync.GraphqlApi;
  uiStorageBucket: s3.Bucket;
  identityPool: IdentityPool;
  userPool: cognito.UserPool;
}

export class Amplify extends Construct {
  public readonly newBranch: amplify.Branch;

  constructor(
    scope: Construct,
    id: string,
    {
      amplifyStagingBucket,
      uiStorageBucket,
      userPoolClient,
      identityPool,
      graphqlApi,
      userPool,
    }: AmplifyProps
  ) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    /***********************************************************************/
    /**************************** Amplify App ******************************/
    /***********************************************************************/

    const mimeTypes = [
      "css",
      "ico",
      "jpg",
      "js",
      "png",
      "gif",
      "txt",
      "svg",
      "woff",
      "woff2",
      "ttf",
      "json",
      "wasm",
      "mp4",
      "gltf",
      "hdr",
    ];

    const amplifyApp = new amplify.App(this, stack.stackName, {
      customRules: [
        new amplify.CustomRule({
          source: `</^[^.]+$|\\.(?!(${mimeTypes.join("|")})$)([^.]+$)/>`,
          target: "/index.html",
          status: amplify.RedirectStatus.REWRITE,
        }),
      ],
    });

    const project = new cb.PipelineProject(this, "Build App", {
      projectName: stack.stackName,
      environment: {
        buildImage: cb.LinuxLambdaBuildImage.AMAZON_LINUX_2023_NODE_20,
        computeType: cb.ComputeType.LAMBDA_2GB,
      },
    });
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject", "s3:GetObjectAcl", "s3:PutObjectAcl"],
        resources: [`${amplifyStagingBucket.arnForObjects("*")}`],
      })
    );
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["amplify:StartDeployment"],
        resources: [`${amplifyApp.arn}/branches/main/deployments/start`],
      })
    );

    const webappAsset = new s3Assets.Asset(this, "WebApp Code Asset", {
      path: "../../packages/webapp",
      exclude: ["node_modules", ".env", "dist", ".git", ".DS_Store"],
    });

    const webappArtifact = new cp.Artifact();

    const pipeline = new cp.Pipeline(this, "Build and Deploy Amplify App", {
      pipelineName: stack.stackName,
      stages: [
        {
          stageName: "Source",
          actions: [
            new actions.S3SourceAction({
              actionName: "react-webapp-code",
              bucket: webappAsset.bucket,
              bucketKey: webappAsset.s3ObjectKey,
              output: webappArtifact,
            }),
          ],
        },
        {
          stageName: "BuildApp",
          actions: [
            new actions.CodeBuildAction({
              actionName: "deploy-to-amplify",
              input: webappArtifact,
              project,
              environmentVariables: {
                BUILD_BUCKET: {
                  value: amplifyStagingBucket.s3UrlForObject(),
                },
                BRANCH_NAME: { value: "main" },
                REGION: { value: stack.region },
                APP_ID: { value: amplifyApp.appId },
                APPSYNC_API: { value: graphqlApi.graphqlUrl },
                USER_POOL_ID: { value: userPool.userPoolId },
                STORAGE_BUCKET: { value: uiStorageBucket.bucketName },
                IDENTITY_POOL_ID: { value: identityPool.identityPoolId },
                USER_POOL_CLIENT_ID: { value: userPoolClient.userPoolClientId },
              },
            }),
          ],
        },
      ],
    });
    webappAsset.grantRead(pipeline.role);

    this.newBranch = amplifyApp.addBranch("main");
  }
}
