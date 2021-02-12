import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'
import { KinesisStreamToTimestream } from './kinesis-constructs/kinesis-stream-to-lambda'
import { GrafanaApi } from './grafana-api-constructs/grafana-api';
import { GrafanaContainerLambda } from './grafana-container-constructs/grafana-container-lambda';
import * as ddb from '@aws-cdk/aws-dynamodb';

export class MonitoringAsAServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const table = new ddb.Table(this, "GrafanaRecord", {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'PK',
        type: ddb.AttributeType.STRING
      }
    });

    const grafanaContainerLambda = new GrafanaContainerLambda(this, "GrafanaContainerLambda", {
      userTableName: table.tableName,
    });

    // // Grafana API Construct
    // const grafanaApi = new GrafanaApi(this, "GrafanaAPI", {
    //   table: table
    // });



    // Kinesis Construct
    // Comment code below to test Grafana API
    /*
    const kinesisLambdaReader = new KinesisStreamToTimestream(this,"StreamToLambda",{
      streamName: "unicorn-kinesis-stream",
      lambdaCodeFolderName: "lambda/kinesis-lambda/stream-reader",
      lambdaCodeHandlerName: "stream-reader.handler",
      timestreamDBName: "demo-timestream-db",
      timestreamTableName: "timestream-table"
    });

    // Code below will only be activeted to test data sending on kinesis stream
    const lambdaStreamWriter = new lambda.Function(this,"LambdaStreamWriter", {
      code: lambda.Code.fromAsset("lambda/kinesis-lambda/stream-writer"),
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "stream-writer.handler",
      environment: {
          STREAM_NAME: "unicorn-kinesis-stream"
      }
    })
    kinesisLambdaReader.kinesisStream.grantWrite(lambdaStreamWriter);
    */
  }
}
