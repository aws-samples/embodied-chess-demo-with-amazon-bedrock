import * as cdk from "aws-cdk-lib";

import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as python from "@aws-cdk/aws-lambda-python-alpha";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";

import * as path from "path";

import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

interface IDefinition {
  graphqlApi: appsync.GraphqlApi;
  ddbTable: ddb.TableV2;
  inputTopic: string;
  moveQueue: sqs.Queue;
}

export class Definition extends Construct {
  readonly definition: sfn.Chain;

  constructor(
    self: Construct,
    id: string,
    { graphqlApi, ddbTable, inputTopic, moveQueue }: IDefinition
  ) {
    super(self, id);

    const stack = cdk.Stack.of(this);

    const stockfishLayer = new lambda.LayerVersion(self, "Stockfish Layer", {
      code: lambda.Code.fromAsset(
        path.join(__dirname, "lambdas", "moveFunctions", "stockfishLayer")
      ),
    });

    const pythonPowertools = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "Powertools for AWS Lambda (Python)",
      `arn:aws:lambda:${stack.region}:017000801446:layer:AWSLambdaPowertoolsPythonV3-python312-x86_64:4`
    );

    const catchError = new NodejsFunction(self, "Catch Error Func", {
      entry: path.join(__dirname, "lambdas", "catchError", "index.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: {
        GRAPHQL_URL: graphqlApi.graphqlUrl,
        TableName: ddbTable.tableName,
      },
      bundling: {
        externalModules: ["@aws-sdk/*"],
      },
    });
    graphqlApi.grantMutation(catchError);
    ddbTable.grantWriteData(catchError);

    const lockMove = new NodejsFunction(self, "Lock Move Func", {
      entry: path.join(__dirname, "lambdas", "lockMove", "index.ts"),
      environment: { GRAPHQL_URL: graphqlApi.graphqlUrl },
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        externalModules: ["@aws-sdk/*"],
      },
    });
    graphqlApi.grantMutation(lockMove);

    let startIoTSessionTask;
    let sendMoveToRobotArmTask;
    if (self.node.tryGetContext("iotDevice") === "true") {
      // Step 1b: Call only on the initialisation of the board
      const startIoTSession = new NodejsFunction(self, "Initialise IoT", {
        entry: path.join(__dirname, "lambdas", "initialiseIoT", "index.ts"),
        environment: { topicRule: inputTopic },
        timeout: cdk.Duration.seconds(30),
        bundling: {
          externalModules: ["@aws-sdk/*"],
        },
        initialPolicy: [
          new iam.PolicyStatement({
            actions: ["iot:Publish", "iot:Connect"],
            resources: ["*"],
          }),
        ],
      });
      startIoTSessionTask = new tasks.LambdaInvoke(
        self,
        "Send Initialise IoT",
        {
          lambdaFunction: startIoTSession,
          integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
          resultPath: sfn.JsonPath.DISCARD,
          payload: sfn.TaskInput.fromObject({
            input: sfn.JsonPath.objectAt("$"),
            taskToken: sfn.JsonPath.taskToken,
          }),
        }
      );

      // Step 3b: Send this move to the RobotArm
      const sendMoveToRobotArm = new NodejsFunction(
        self,
        "Send Move to Device",
        {
          entry: path.join(__dirname, "lambdas", "toRobotArm", "index.ts"),
          bundling: {
            externalModules: ["@aws-sdk/*"],
          },
          environment: {
            topicRule: inputTopic,
            GRAPHQL_URL: graphqlApi.graphqlUrl,
          },
          timeout: cdk.Duration.seconds(30),
          initialPolicy: [
            new iam.PolicyStatement({
              actions: ["iot:Publish", "iot:Connect"],
              resources: ["*"],
            }),
          ],
        }
      );
      graphqlApi.grantMutation(sendMoveToRobotArm);
      sendMoveToRobotArmTask = new tasks.LambdaInvoke(self, "Send Move IoT", {
        lambdaFunction: sendMoveToRobotArm,
        integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        resultPath: sfn.JsonPath.DISCARD,
        payload: sfn.TaskInput.fromObject({
          input: sfn.JsonPath.objectAt("$"),
          taskToken: sfn.JsonPath.taskToken,
        }),
      });
    }

    const findTurnActor = new tasks.EvaluateExpression(
      self,
      "Extract Next Player",
      {
        expression:
          '($.LatestMove.Item.Move.S).split(" ")[1] === "w" ? $.Session.Item.White.S : $.Session.Item.Black.S',
        runtime: lambda.Runtime.NODEJS_18_X,
        resultPath: "$.TurnActor",
      }
    );

    const isGameOver = new NodejsFunction(self, "Game Over Function", {
      entry: path.join(__dirname, "lambdas", "gameOver", "index.ts"),
      environment: { GRAPHQL_URL: graphqlApi.graphqlUrl },
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        externalModules: ["@aws-sdk/*"],
      },
    });
    graphqlApi.grantMutation(isGameOver);

    const callback = new NodejsFunction(self, "Callback Func", {
      entry: path.join(__dirname, "lambdas", "callback", "index.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(20),
      environment: {
        TableName: ddbTable.tableName,
        GRAPHQL_URL: graphqlApi.graphqlUrl,
      },
      bundling: {
        externalModules: ["@aws-sdk/*"],
      },
    });
    const CallbackTask = new tasks.LambdaInvoke(
      self,
      "Callback (Write to Ddb)",
      {
        lambdaFunction: callback,
        payloadResponseOnly: true,
        payload: sfn.TaskInput.fromObject({
          input: sfn.JsonPath.objectAt("$"),
          executionId: sfn.JsonPath.executionId,
        }),
      }
    );
    ddbTable.grantWriteData(callback);
    graphqlApi.grantMutation(callback);

    /********************************************************************/
    /************************* Move Functions ***************************/
    /********************************************************************/

    const bedrockMove = new python.PythonFunction(this, "Bedrock Move", {
      entry: path.join(__dirname, "lambdas", "moveFunctions", "bedrock"),
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: cdk.Duration.minutes(1),
      memorySize: 1024,
      environment: {
        GRAPHQL_URL: graphqlApi.graphqlUrl,
      },
      layers: [stockfishLayer, pythonPowertools],
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["bedrock:InvokeModel"],
          resources: ["*"],
        }),
      ],
    });
    graphqlApi.grantMutation(bedrockMove);

    const importModelsMove = new python.PythonFunction(
      self,
      "Imported Models Move",
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        timeout: cdk.Duration.minutes(3),
        memorySize: 1024,
        entry: path.join(
          __dirname,
          "lambdas",
          "moveFunctions",
          "importedModels"
        ),
        environment: {
          GRAPHQL_URL: graphqlApi.graphqlUrl,
        },
        layers: [stockfishLayer, pythonPowertools],
        initialPolicy: [
          new iam.PolicyStatement({
            actions: ["bedrock:*"],
            resources: ["*"],
          }),
        ],
      }
    );
    graphqlApi.grantMutation(importModelsMove);

    const chessEngineMove = new NodejsFunction(self, "Chess Engine Move", {
      entry: path.join(
        __dirname,
        "lambdas",
        "moveFunctions",
        "chessEngine",
        "index.ts"
      ),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(1),
      bundling: {
        nodeModules: ["js-chess-engine"],
      },
    });

    this.definition = new sfn.Pass(self, "Clean Up Input", {
      inputPath: "$.[0]",
    }).next(
      new sfn.Parallel(self, "Execute Move")
        .branch(
          new tasks.DynamoGetItem(self, "Get Session", {
            table: ddbTable,
            key: {
              SessionID: tasks.DynamoAttributeValue.fromString(
                sfn.JsonPath.stringAt("$.SessionID")
              ),
              SK: tasks.DynamoAttributeValue.fromString("SESSION"),
            },
            resultSelector: { Item: sfn.JsonPath.stringAt("$.Item") },
            resultPath: "$.Session",
          })
            .next(
              new tasks.DynamoGetItem(self, "Get Latest Move", {
                table: ddbTable,
                key: {
                  SessionID: tasks.DynamoAttributeValue.fromString(
                    sfn.JsonPath.stringAt("$.SessionID")
                  ),
                  SK: tasks.DynamoAttributeValue.fromString("MOVE#LATEST"),
                },
                resultSelector: { Item: sfn.JsonPath.stringAt("$.Item") },
                resultPath: "$.LatestMove",
              })
            )
            .next(
              new sfn.Choice(self, "Is GamePlay Valid?", {
                comment: "Is the call for a move allowed to proceed",
              })
                .when(
                  sfn.Condition.not(
                    sfn.Condition.stringEquals(
                      "$.Session.Item.GameStatus.S",
                      "PLAYING"
                    )
                  ),
                  new sfn.Fail(self, "GameStatus !== PLAYING", {
                    error: "GAMESTATUS_NOT_PLAYING",
                    cause: JSON.stringify({
                      message:
                        "Game is inactive. Click start to make it active.",
                    }),
                  })
                )
                .when(
                  sfn.Condition.isPresent("$.LatestMove.Item.SfnExecutionId.S"),
                  new sfn.Fail(self, "Move Already In Progress", {
                    error: "MOVE_ALREADY_IN_PROGRESS",
                    cause: JSON.stringify({
                      message:
                        "Another State Machine is currently handling this move, please refer to the move record to see which state machine this is",
                    }),
                  })
                )
                .otherwise(
                  (startIoTSessionTask
                    ? new sfn.Choice(self, "Initialise Board?", {
                        comment: "Only perform this once to init the board",
                      })
                        .when(
                          sfn.Condition.stringEquals(
                            "$.LatestMove.Item.Action.S",
                            "INITIALISE_BOARD"
                          ),
                          startIoTSessionTask.next(findTurnActor)
                        )
                        .otherwise(findTurnActor)
                        .afterwards()
                    : findTurnActor
                  )
                    .next(
                      new sfn.Choice(self, "Await Human?", {
                        comment:
                          "If the next player is human and they have not inputted a move, wait",
                      })
                        .when(
                          sfn.Condition.and(
                            sfn.Condition.stringEquals("$.TurnActor", "player"),
                            sfn.Condition.isNotPresent("$.Move")
                          ),
                          new sfn.Succeed(self, "Wait for Human", {
                            comment: "Wait for the human to make a move",
                          })
                        )
                        .otherwise(
                          new tasks.LambdaInvoke(self, "Lock Move", {
                            lambdaFunction: lockMove,
                            payload: sfn.TaskInput.fromObject({
                              input: sfn.JsonPath.objectAt("$"),
                              executionId: sfn.JsonPath.executionId,
                            }),
                            resultPath: sfn.JsonPath.DISCARD,
                          })
                        )
                        .afterwards()
                    )
                    .next(
                      new sfn.Choice(
                        self,
                        "Player, Bedrock, Imported Model, Chess Engine or Random?",
                        {
                          comment: "Who's turn is it to play",
                        }
                      )
                        .when(
                          sfn.Condition.stringEquals("$.TurnActor", "player"),
                          new tasks.LambdaInvoke(self, "Human", {
                            lambdaFunction: new NodejsFunction(
                              self,
                              "Human Move",
                              {
                                entry: path.join(
                                  __dirname,
                                  "lambdas",
                                  "moveFunctions",
                                  "human",
                                  "index.ts"
                                ),
                                runtime: lambda.Runtime.NODEJS_20_X,
                              }
                            ),
                            payloadResponseOnly: true,
                            resultPath: "$.PlayerOutput",
                          })
                        )
                        .when(
                          sfn.Condition.stringEquals("$.TurnActor", "bedrock"),
                          new tasks.LambdaInvoke(self, "Bedrock", {
                            lambdaFunction: bedrockMove,
                            payloadResponseOnly: true,
                            resultPath: "$.PlayerOutput",
                          })
                        )
                        .when(
                          sfn.Condition.stringEquals("$.TurnActor", "imported"),
                          new tasks.LambdaInvoke(self, "Imported Models", {
                            lambdaFunction: importModelsMove,
                            payloadResponseOnly: true,
                            resultPath: "$.PlayerOutput",
                          })
                        )
                        .when(
                          sfn.Condition.stringEquals(
                            "$.TurnActor",
                            "chessengine"
                          ),
                          new tasks.LambdaInvoke(self, "Chess Engine", {
                            lambdaFunction: chessEngineMove,
                            payloadResponseOnly: true,
                          })
                        )
                        .when(
                          sfn.Condition.stringEquals("$.TurnActor", "random"),
                          new tasks.LambdaInvoke(self, "Random", {
                            lambdaFunction: new NodejsFunction(
                              self,
                              "Random Move",
                              {
                                entry: path.join(
                                  __dirname,
                                  "lambdas",
                                  "moveFunctions",
                                  "random",
                                  "index.ts"
                                ),
                                runtime: lambda.Runtime.NODEJS_20_X,
                              }
                            ),
                            payloadResponseOnly: true,
                          })
                        )
                        .afterwards()
                    )
                    .next(
                      sendMoveToRobotArmTask
                        ? sendMoveToRobotArmTask.next(CallbackTask)
                        : CallbackTask
                    )
                    .next(
                      new sfn.Choice(self, "Is Game Over?")
                        .when(
                          sfn.Condition.booleanEquals("$.IsGameOver", false),
                          new tasks.SqsSendMessage(self, "Send Next Move", {
                            queue: moveQueue,
                            messageBody: sfn.TaskInput.fromObject([
                              {
                                SessionID: sfn.JsonPath.stringAt("$.SessionID"),
                              },
                            ]),
                            messageGroupId:
                              sfn.JsonPath.stringAt("$.SessionID"),
                            messageDeduplicationId:
                              sfn.JsonPath.stringAt("$$.Execution.Id"),
                          })
                        )
                        .otherwise(
                          new tasks.LambdaInvoke(self, "Game Over", {
                            lambdaFunction: isGameOver,
                            payloadResponseOnly: true,
                          })
                        )
                    )
                )
            )
        )
        .addCatch(
          new tasks.LambdaInvoke(self, "Catch Error", {
            lambdaFunction: catchError,
          }),
          {
            resultPath: sfn.JsonPath.stringAt("$.ErrorInfo"),
          }
        )
    );
  }
}
