import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as sdk from 'aws-sdk';

// This stream writer lambda is for initial testing and will not be part of production app
// because in production some other process will be sending data to kinesis
exports.handler = async(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> =>{
  console.log("Lambda Writer Request: ", JSON.stringify(event));

  const kn = new sdk.Kinesis({
      apiVersion: "2013-12-02"
  })
  const streamName = process.env.STREAM_NAME || "";
  /*
  kn.putRecord({
      Data: "Hello World",
      PartitionKey: "demo1",
      StreamName: "my-demo-stream",      
  })
  */
  
  const response = await kn.putRecords({
      Records:[{
        Data: JSON.stringify(dummyData()),
        PartitionKey: "demo1",
      }],
      StreamName: streamName,
  }).promise();
  console.log("After writing to stream: ", JSON.stringify(response));

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Hello, CDK! You've hit ${event.path}\n`
  };
}

const dummyData = ()=>{
  
  return {
    "claims": {
      "apiId": "apiId0.13376174044971245",
      "devId": "4516107a-2637-4247-921f-59d26165d604",
      "iat": 1612672403
    },
    "metrics": {
        "billedDurationMs": Math.round(Math.random()*1000+1000),
        "durationMs": Math.round(Math.random()*1000+1000),
        "initDurationMs": Math.round(Math.random()*1000+1000),
        "maxMemoryUsedMB": Math.round(Math.random()*127+1),
        "memorySizeMB": 128
    }
  }
}