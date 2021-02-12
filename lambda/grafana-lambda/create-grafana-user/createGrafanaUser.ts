export {};
const AWS = require("aws-sdk");
import { Guid } from "guid-typescript";
const grafana = require('/opt/grafana');
import {Base64} from 'js-base64';
const dbclient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
    
    console.log(event)
    console.log(process.env.USERNAME)
    const { email } = event.data.Item;
    // const { email } = event.data
    const encoding = Base64.encode(`${process.env.USERNAME}:${process.env.PASSWORD}`)
    console.log(encoding);

    const password = `${Guid.create()}`;

    try{
        ///Create Tenant
        const create_user = await grafana.instance.post("/api/admin/users", {
            "email": `${email}`,
            "login": `${email}`,
            "password": password
        }, {
            headers: {'Authorization': `Basic ${encoding}`}
        })

        const create_user_data = {
            TableName: process.env.TABLE,
            Item : {
                PK: email,
                password: password
            }
        }

        await dbclient.put(create_user_data).promise();

        console.log('GRAFANA create user', create_user.data);

        return "User Created Successfully"
    }
    catch(err){
        console.log(err);
        return JSON.stringify(err)
    }

}