import * as cdk from "aws-cdk-lib";

import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as pipes from "aws-cdk-lib/aws-pipes";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";

import { Construct } from "constructs";
import { Definition } from "./Definition";
import { IoT } from "../IoT/IoT";

interface IStepFunction {
  moveQueue: sqs.Queue;
  graphqlApi: appsync.GraphqlApi;
  ddbTable: ddb.TableV2;
}

export class StepFunction extends Construct {
  constructor(
    scope: Construct,
    id: string,
    { moveQueue, graphqlApi, ddbTable }: IStepFunction
  ) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    const inputTopic = "robo-chess/cloud/request";

    /******************************************************************/
    /************************* Step Function **************************/
    /******************************************************************/

    const { definition } = new Definition(this, "Definition", {
      moveQueue,
      graphqlApi,
      ddbTable,
      inputTopic,
    });

    const moveSfn = new sfn.StateMachine(this, "Process Moves", {
      stateMachineName: stack.stackName,
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
    });

    /******************************************************************/
    /***************************** IoT ********************************/
    /******************************************************************/

    if (this.node.tryGetContext("iotDevice") === "true") {
      new IoT(this, "IoT", { moveSfn, inputTopic });
    }

    /******************************************************************/
    /*********************** EventBridge Pipes ************************/
    /******************************************************************/

    const pipeRole = new iam.Role(this, "Pipes Role", {
      assumedBy: new iam.ServicePrincipal("pipes.amazonaws.com"),
    });
    moveQueue.grantConsumeMessages(pipeRole);
    moveSfn.grantStartExecution(pipeRole);

    const enrichmentFn = new lambda.Function(this, "Enrichment Lambda", {
      code: lambda.Code.fromInline(
        "exports.handler = async (event) => event[0].Message"
      ),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
    });
    enrichmentFn.grantInvoke(pipeRole);

    new pipes.CfnPipe(this, "Pipe Moves", {
      roleArn: pipeRole.roleArn,

      // Source
      source: moveQueue.queueArn,
      sourceParameters: {
        sqsQueueParameters: {
          batchSize: 1,
        },
      },

      // Enrichment
      enrichment: enrichmentFn.functionArn,
      enrichmentParameters: { inputTemplate: '{"Message": <$.body>}' },

      // Output
      target: moveSfn.stateMachineArn,
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: "FIRE_AND_FORGET",
        },
      },
    });
  }
}
