import { APIGatewayProxyEvent, Context, Callback } from "aws-lambda";
const randomWords = require("random-words");
import * as fs from 'fs';
import axios from 'axios';
import { exec } from 'child_process';

exports.handler = async (event: any, context: Context, callback: Callback) => {
  console.log("Event==>", event);

  // reading file form file-system
  const txt = fs.readFileSync('./file.txt', 'utf-8');
  console.log(txt);

  // exec(`nohup node server.js > output.log &`, (error, stdout, stderr) => { //uname -svr
  //   if (error) { console.log(`error: ${error.message}`); return; }
  //   if (stderr) { console.log(`stderr: ${stderr}`); return; }
  //   console.log(`\nstdout-1==>: ${stdout}\n`);
  // });

  exec(event.cmd||'pwd', (error, stdout, stderr) => { //uname -svr
    if (error) { console.log(`error: ${error.message}`); return; }
    if (stderr) { console.log(`stderr: ${stderr}`); return; }
    console.log(`\nstdout-2==>: ${stdout}\n`);
  });

  // getting response from node server
  // const res = await axios.get('http://localhost:5300');//http://localhost:5300
  // console.log("AXIOS res ===>", res);

  // Generating random word
  const myWord = randomWords();

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
