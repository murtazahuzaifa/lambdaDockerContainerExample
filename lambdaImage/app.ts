import { APIGatewayProxyEvent, Context, Callback } from "aws-lambda";
// const randomWords = require("random-words");
// import * as fs from 'fs';
const axios = require('axios');
import { exec } from 'child_process';

type Event = { delay?: number, cmd?: string, hitUrl?: string, killId?: string };

exec(`nohup node server.js > /tmp/output.log &`, (error, stdout, stderr) => { //uname -svr kill 20 21 22 32 43 54 | pkill -f server.js
  if (error) { console.log(`error: ${error.message}`); return; }
  if (stderr) { console.log(`stderr: ${stderr}`); return; }
  console.log(`\nstdout-1==>: ${stdout}\n`);
});

export const handler = async (event: Event, context: Context, callback: Callback) => {
  // starting nodejs http server
  // await delay(event.delay || 1000) // delay
  console.log("Event==>", event);

  exec(event.cmd || 'pwd', (error, stdout, stderr) => { //uname -svr
    if (error) { console.log(`error: ${error.message}`); return; }
    if (stderr) { console.log(`stderr: ${stderr}`); return; }
    console.log(`\nstdout-2==>: ${stdout}\n`);
  });

  // getting response from node server
  if (event.hitUrl) {
    await http('http://localhost:5300');
  }


  return Responses._200({ response: "hello world" });
  // callback(null, Responses._200({ myWord }));

};


const Responses = {
  _200(data: Object) {
    return {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*',
      },
      statusCode: 200,
      body: JSON.stringify(data),
    };
  },

  _400(data: Object) {
    return {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*',
      },
      statusCode: 400,
      body: JSON.stringify(data),
    };
  },
};

const http = async (url: string) => {
  while (true) {
    try {
      const res = await axios.default.get(url);
      console.log("AXIOS RESPONSE ===>", res.data);
      return res
    } catch (err) {
      console.log("AXIOS ERROR ===>", err.response);
      // http(url)
    }
  }
}


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/*
"delay": 1000,
"hitUrl": "yes",
"cmd": "ps -ef",
"killId": "pkill -f server.js",
*/