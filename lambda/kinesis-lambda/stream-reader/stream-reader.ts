import { KinesisStreamEvent, Context } from 'aws-lambda';
import { TimestreamWrite  } from 'aws-sdk';
import * as https from 'https';

exports.handler = async(event: KinesisStreamEvent, context: Context)=> {
    console.log("Stream Reader Event Data ",JSON.stringify(event));
    for(let i=0;i<event.Records.length;i++){
        let record = event.Records[i];
        console.log("Stream Reader Before Decoding = ",JSON.stringify(record));
    
        // Kinesis data is base64 encoded so decode here
        var payload = JSON.parse(Buffer.from(record.kinesis.data, 'base64').toString('ascii'));
        console.log('Decoded payload:', payload);

        const agent = new https.Agent({
            maxSockets: 5000,
        });
    
        const writeClient = new TimestreamWrite({
            maxRetries: 10,
            httpOptions: {
                timeout: 20000,
                agent: agent,
            },
        });

        const formattedRecords = recordFormatter(payload);
        console.log("After formatting = ",formattedRecords);
        const result = await writeClient.writeRecords({
            DatabaseName: process.env.databaseName!,
            TableName: process.env.tableName!,
            Records: formattedRecords
        }).promise();

        console.log("After writing to timestream database = ",result);
    }
};

/**
 * 
 * @param payload 
 * Expected input 
 * {
        "claims": {
            "apiId": "apiId0.13376174044971245",
            "devId": "4516107a-2637-4247-921f-59d26165d604",
            "iat": 1612672403
        },
        "metrics": {
            "billedDurationMs": 1270,
            "durationMs": 1269.94,
            "initDurationMs": 1300.52,
            "maxMemoryUsedMB": 103,
            "memorySizeMB": 128
        }
    }
 * Expected output 
 * [
        {
            Dimensions: [
                { Name: 'region', Value: 'us-west-2' },
                { Name: 'type', Value: 'API' },
                { Name: 'workload', Value: 'ToDoApplication' },
                { Name: 'context', Value: 'TodoAddService' },
                { Name: 'tenantId', Value: 'tenant-id-'+Math.round(Math.random()*4+1) },
                { Name: 'subTenantId', Value: 'sub-tenant-id-'+Math.round(Math.random()*4+1) },
                { Name: 'user', Value: 'user-'+Math.round(Math.random()*9+1) },
                { Name: 'resource', Value: 'load-balancer' },
                { Name: 'apiId', Value: 'apiId0.13376174044971245' },
                { Name: 'devId', Value: '4516107a-2637-4247-921f-59d26165d604'    },
                { Name: 'iat', Value: '1612672403' },
            ],
            MeasureName: 'billedDurationMs',
            MeasureValue: '1159',
            MeasureValueType: 'DOUBLE',
            Time: '1612024092882'
        },
        {
            Dimensions: [
                Same as above
            ],
            MeasureName: 'durationMs',
            MeasureValue: '1822',
            MeasureValueType: 'DOUBLE',
            Time: '1612024092882'
        },
        {
            Dimensions: [
                Same as above
            ],
            MeasureName: 'initDurationMs',
            MeasureValue: '1648',
            MeasureValueType: 'DOUBLE',
            Time: '1612024092882'
        },
        {
            Dimensions: [
                Same as above
            ],
            MeasureName: 'maxMemoryUsedMB',
            MeasureValue: '122',
            MeasureValueType: 'DOUBLE',
            Time: '1612024092882'
        },
        {
            Dimensions: [
                Same as above
            ],
            MeasureName: 'memorySizeMB',
            MeasureValue: '128',
            MeasureValueType: 'DOUBLE',
            Time: '1612024092882'
        }
    ]
 * 
 * There are many hard coded properties and random numbers which will be changed
 * once we have more clear picture of object receving from extension
 * 
 */
const recordFormatter = (payload: RecordInput)=>{
    console.log("data in formatter = ", payload);
    let defaultDimensions = [
        { Name: 'region', Value: 'us-west-2' },
        { Name: 'type', Value: 'API' },
        { Name: 'workload', Value: 'ToDoApplication' },
        { Name: 'context', Value: 'TodoAddService' },
        { Name: 'user', Value: 'user-'+Math.round(Math.random()*9+1) },
        { Name: 'resource', Value: 'load-balancer' },
        { Name: 'apiId', Value: payload.claims.apiId },
        { Name: 'devId', Value: payload.claims.devId },
        { Name: 'iat', Value: ""+payload.claims.iat },
    ];
    let records: any[] = [];
    let metrics: any = payload.metrics;
    let time = Date.now().toString();
    Object.keys(payload.metrics).forEach((key)=>{
        records.push({
            Dimensions: defaultDimensions,
            MeasureName: key,
            MeasureValue: ""+metrics[key],
            MeasureValueType: 'DOUBLE',
            Time: time,
        })
    })
    return records;
} 

interface RecordInput {
    claims: Dimensions;
    metrics: Metrics;
}

interface Dimensions {
    apiId: string;
    devId: string;
    iat: string;
}

interface Metrics {
    billedDurationMs: string;
    durationMs: string,
    initDurationMs:  string;
    maxMemoryUsedMB:  string;
    memorySizeMB: string;
}