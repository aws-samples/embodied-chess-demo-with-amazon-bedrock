import * as cdk from "aws-cdk-lib";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as ddb from "aws-cdk-lib/aws-dynamodb";

import { Construct } from "constructs";

export class Storage extends Construct {
  readonly amplifyStagingBucket: s3.Bucket;
  readonly uiStorageBucket: s3.Bucket;
  readonly archiveBucket: s3.Bucket;
  readonly ddbTable: ddb.TableV2;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.archiveBucket = new s3.Bucket(this, "Archive Bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    });

    this.amplifyStagingBucket = new s3.Bucket(this, "Amplify Staging Bucket", {
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    });

    this.uiStorageBucket = new s3.Bucket(this, "Frontend Bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.HEAD,
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    this.ddbTable = new ddb.TableV2(this, "Central Dynamodb Table", {
      partitionKey: {
        name: "SessionID",
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: ddb.AttributeType.STRING,
      },
      billing: ddb.Billing.onDemand(),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      globalSecondaryIndexes: [
        {
          indexName: "ListBySessionType",
          partitionKey: {
            name: "Type",
            type: ddb.AttributeType.STRING,
          },
          sortKey: {
            name: "SessionID",
            type: ddb.AttributeType.STRING,
          },
        },
        {
          indexName: "GamesByMoveCount",
          partitionKey: {
            name: "SK",
            type: ddb.AttributeType.STRING,
          },
          sortKey: {
            name: "MoveCount",
            type: ddb.AttributeType.NUMBER,
          },
        },
      ],
      localSecondaryIndexes: [
        {
          indexName: "SortByMoveCount",
          sortKey: {
            name: "MoveCount",
            type: ddb.AttributeType.NUMBER,
          },
        },
      ],
    });
  }
}
