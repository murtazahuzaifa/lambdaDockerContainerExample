import { APIGatewayProxyEvent, Context, Callback } from "aws-lambda";
// const randomWords = require("random-words");
// import * as fs from 'fs';
const axios = require('axios');
import { exec } from 'child_process';

type Event = { delay?: number, cmd?: string, hitUrl?: string, killId?: string };

export const handler = async (event: Event, context: Context, callback: Callback) => {
  // starting nodejs http server
  exec(`nohup node server.js > /tmp/output.log &`, (error, stdout, stderr) => { //uname -svr kill 20 21 22 32 43 54
    if (error) { console.log(`error: ${error.message}`); return; }
    if (stderr) { console.log(`stderr: ${stderr}`); return; }
    console.log(`\nstdout-1==>: ${stdout}\n`);
  });
  await delay(event.delay || 1000) // delay
  console.log("Event==>", event);

  // reading file form file-system
  // const txt = fs.readFileSync('./file.txt', 'utf-8');
  // console.log(txt);


  // setTimeout(async () => {


  // }, 1000)

  exec(event.cmd || 'pwd', (error, stdout, stderr) => { //uname -svr
    if (error) { console.log(`error: ${error.message}`); return; }
    if (stderr) { console.log(`stderr: ${stderr}`); return; }
    console.log(`\nstdout-2==>: ${stdout}\n`);
  });
  // getting response from node server
  if (event.hitUrl) {
    axios.default.get('http://localhost:5300')
      .then((e: any) => { console.log("AXIOS RESPONSE ===>", e.data); event.killId && exec(event.killId) })
      .catch((e: any) => { console.log("AXIOS ERROR ===>", e.response); event.killId && exec(event.killId) })
  }


  // Generating random word
  const myWord = "hello world" //randomWords();

  console.log("myWord==>", myWord);

  callback(null, Responses._200({
    myWord
  }));


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


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
