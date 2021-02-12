export {};
const AWS = require("aws-sdk");
import { Guid } from "guid-typescript";
const grafana = require('/opt/grafana');
import {Base64} from 'js-base64';
const dbclient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
    
    console.log(event);
    const body = JSON.parse(event.body)
    const encoding = Base64.encode(`${process.env.USERNAME}:${process.env.PASSWORD}`)
    console.log(encoding);

    const maintable = process.env.TABLE || ""

    const split_api = body.uid.split(".");


    try{

        const org_id = await get_org(body.uid, maintable);

        console.log(org_id);

        const switch_org = await grafana.instance.post(`/api/user/using/${org_id}`, {}, {
            headers: {'Authorization': `Basic ${encoding}`}
        })

        const get_Dashboards = await grafana.instance.get(`/api/dashboards/uid/LAMBDA-${split_api[1]}`, {
            headers: {'Authorization': `Basic ${encoding}`}
        })

        console.log(get_Dashboards?.data?.dashboard?.panels);

        const data = {
            panels: get_Dashboards?.data?.dashboard?.panels,
            org_id: org_id
        }

        // const data = JSON.parse(get_Dashboards.data);

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        };
    }
    catch(err){
        console.log(err);
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(err)
        };
    }

}

const get_org = async (id: string, table: string) => {
    const res = await dbclient.get({
      TableName: table!,
      Key: { PK: id },
      AttributesToGet: ["org_id"],
    }).promise();
    return Number(res.Item?.org_id)
}