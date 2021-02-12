import * as cdk from '@aws-cdk/core';
import * as kinesis from '@aws-cdk/aws-kinesis';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as timestream from '@aws-cdk/aws-timestream';

export interface KinesisStreamToTimestreamProps {
    readonly streamName : string;
    readonly lambdaCodeFolderName: string;
    readonly lambdaCodeHandlerName: string;
    readonly streamReadStartingPosition?: lambda.StartingPosition;
    readonly streamReadBatchSize?: number; 
    readonly kinesisStreamActions?: string[];
    readonly timestreamDBName: string;
    readonly timestreamTableName: string;
}

export class KinesisStreamToTimestream extends cdk.Construct {
    
    public readonly kinesisStream: kinesis.Stream;

    constructor(scope: cdk.Construct, id: string, props: KinesisStreamToTimestreamProps) {
        super(scope, id);

        this.kinesisStream = new kinesis.Stream(this, "MyFirstStream", {
            streamName: props.streamName
        });

        const timeStreamDB = new timestream.CfnDatabase(this, 'TimeStreamDatabase', {
            databaseName: props.timestreamDBName
        });
        
        const timeStreamTable = new timestream.CfnTable(timeStreamDB, 'TSTable', {
          tableName: props.timestreamTableName,
          databaseName: props.timestreamDBName,
        });
        
        timeStreamTable.addDependsOn(timeStreamDB);

        const kinesisStreamReaderRole = new iam.Role(this,"KinesisStreamReaderRole",{
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        });
      
        const kinesisStreamLambdaExecutionPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: props.kinesisStreamActions? 
                props.kinesisStreamActions:
                ["kinesis:GetRecords","kinesis:GetShardIterator",
                "kinesis:DescribeStream","kinesis:ListShards","kinesis:ListStreams", "logs:*"],
            resources: [this.kinesisStream.streamArn]
        });
      
        const kinesisStreamLambdaLogsPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["logs:*"],
            resources: ["*"]
        });

        const timeStreamWritePolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["timestream:WriteRecords",'timestream:DescribeEndpoints',],
            resources: ["*"]
        });
      
        kinesisStreamReaderRole.addToPolicy(kinesisStreamLambdaExecutionPolicy);
        kinesisStreamReaderRole.addToPolicy(kinesisStreamLambdaLogsPolicy);
        kinesisStreamReaderRole.addToPolicy(timeStreamWritePolicy);
          
        const lambdaStreamReader = new lambda.Function(this, "LambdaStreamReader",{
            code: lambda.Code.fromAsset(props.lambdaCodeFolderName),
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: props.lambdaCodeHandlerName,
            role: kinesisStreamReaderRole,
            environment: {
                databaseName: props.timestreamDBName,
                tableName: props.timestreamTableName
            }
        })
      
        lambdaStreamReader.addEventSourceMapping("StreamReaderEventSource",{
            eventSourceArn: this.kinesisStream.streamArn,
            batchSize: props.streamReadBatchSize? props.streamReadBatchSize: 1,
            startingPosition: props.streamReadStartingPosition?props.streamReadStartingPosition: lambda.StartingPosition.LATEST,
            retryAttempts:5
        });
    }
}