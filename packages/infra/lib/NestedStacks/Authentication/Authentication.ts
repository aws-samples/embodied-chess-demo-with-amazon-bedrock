import * as cdk from "aws-cdk-lib";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";

import {
  IdentityPool,
  UserPoolAuthenticationProvider,
} from "@aws-cdk/aws-cognito-identitypool-alpha";

import { Construct } from "constructs";

interface IAuthentication {
  uiStorageBucket: s3.Bucket;
}

export class Authentication extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly identityPool: IdentityPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(
    scope: Construct,
    id: string,
    { uiStorageBucket }: IAuthentication
  ) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    /**********************************************************************/
    /**************************** User Pool *******************************/
    /**********************************************************************/

    this.userPool = new cognito.UserPool(this, "UserPool", {
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      signInAliases: { email: true },
      userPoolName: stack.stackName,
      selfSignUpEnabled: false,
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireSymbols: true,
        requireUppercase: true,
      },
    });

    /************************************************************************/
    /*************************** UserPool Group *****************************/
    /************************************************************************/

    new cognito.CfnUserPoolGroup(this, "Admin Group", {
      description: "Admin Group",
      userPoolId: this.userPool.userPoolId,
      groupName: "Admin",
    });

    /**********************************************************************/
    /*************************** User Client ******************************/
    /**********************************************************************/

    this.userPoolClient = new cognito.UserPoolClient(this, "UserPool Client", {
      userPool: this.userPool,
      disableOAuth: true,
    });

    /************************************************************************/
    /*************************** Identity Pool ******************************/
    /************************************************************************/

    this.identityPool = new IdentityPool(this, "Identity Pool", {
      identityPoolName: stack.stackName,
      authenticationProviders: {
        userPools: [
          new UserPoolAuthenticationProvider({
            userPool: this.userPool,
            userPoolClient: this.userPoolClient,
          }),
        ],
      },
    });
    this.identityPool.authenticatedRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:ListFoundationModels", "bedrock:ListImportedModels"],
        resources: ["*"],
      })
    );
    this.identityPool.authenticatedRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["polly:SynthesizeSpeech"],
        resources: ["*"],
      })
    );
    uiStorageBucket.grantReadWrite(this.identityPool.authenticatedRole);
  }
}
