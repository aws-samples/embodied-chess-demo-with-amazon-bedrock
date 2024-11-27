import * as cdk from "aws-cdk-lib";

import * as actions from "@aws-cdk/aws-iot-actions-alpha";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iot from "@aws-cdk/aws-iot-alpha";

import * as path from "path";

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

interface IIoT {
  moveSfn: sfn.StateMachine;
  inputTopic: string;
}

export class IoT extends Construct {
  constructor(scope: Construct, id: string, { moveSfn, inputTopic }: IIoT) {
    super(scope, id);

    const outputTopic = "robo-chess/cloud/response";

    // When sending to the Robot
    new iot.TopicRule(this, "To Robot Arm", {
      sql: iot.IotSql.fromStringAsVer20160323(`SELECT * FROM '${inputTopic}'`),
    });

    // Restart the Step Function with the Task Token
    const RobotCallback = new NodejsFunction(this, "Robot Callback", {
      entry: path.join(__dirname, "robotCallback", "index.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
    });
    new iot.TopicRule(this, "From Robot Arm", {
      sql: iot.IotSql.fromStringAsVer20160323(`SELECT * FROM '${outputTopic}'`),
      actions: [new actions.LambdaFunctionAction(RobotCallback)],
    });

    moveSfn.grantTaskResponse(RobotCallback);
  }
}
