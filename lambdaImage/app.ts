import { APIGatewayProxyEventV2, Context, Callback } from "aws-lambda";
import axios, { AxiosError, AxiosResponse } from "axios";
import { exec } from 'child_process';

enum HttpMethod { GET = "GET", POST = "POST", PUT = "PUT", DELETE = "DELETE" };
type Event = { delay?: number, cmd?: string, hitUrl?: string, read?: string, write?: string };
const HTTP_API = process.env.HTTP_API!

// starting nodejs http server
exec(`nohup ./bin/grafana-server --homepath="./" --config="./conf/defaults.ini" > /tmp/output.log &`, (error, stdout, stderr) => { //uname -svr kill 20 21 22 32 43 54 | pkill -f server.js
  if (error) { console.log(`error: ${error.message}`); return; }
  if (stderr) { console.log(`stderr: ${stderr}`); return; }
  console.log(`\nstdout-1==>: ${stdout}\n`);
});


export const handler = async (event: APIGatewayProxyEventV2, context: Context, callback: Callback) => {
  console.log("Event==>", event);
  await waitTillGrafanaLive();

  const METHOD = event?.requestContext?.http?.method as HttpMethod;
  const SLASH_PATH = event?.requestContext?.http?.path as string;
  const REFERER_PATH = event?.headers?.referer as string | undefined;
  let REFERER_PATH_SLASH = REFERER_PATH?.substr(HTTP_API.length);
  REFERER_PATH_SLASH = REFERER_PATH_SLASH === '/' ? undefined : REFERER_PATH_SLASH;

  console.log("Method ==>", METHOD);
  console.log("Path ==>", SLASH_PATH);
  REFERER_PATH && console.log("Referer_Path ==>", REFERER_PATH_SLASH);

  // event.cmd && exec(event.cmd || 'pwd', (error, stdout, stderr) => { //uname -svr
  //   if (error) { console.log(`error: ${error.message}`); return; }
  //   if (stderr) { console.log(`stderr: ${stderr}`); return; }
  //   console.log(`\nstdout-2==>: ${stdout}\n`);
  // });

  // await delay(event.delay || 1) // delay
  // // getting response from node server
  // if (event.hitUrl) {
  //   return Responses._200("application/json", "{hello:world}");
  // }


  ///////////////////////   Returning Response //////////////////////////////////
  try {
    //////////////////  Request ////////////////////////////
    let res: AxiosResponse;
    const url = `http://localhost:3000${REFERER_PATH_SLASH || SLASH_PATH || '/'}`;

    if (METHOD === HttpMethod.POST) { res = await axios.post(url, event.body, event.headers) }
    else if (METHOD === HttpMethod.PUT) { res = await axios.put(url) }
    else if (METHOD === HttpMethod.DELETE) { res = await axios.delete(url) }
    else { res = await axios.get(url, { headers: event.headers }) }

    console.log(`AXIOS RESPONSE ${url} ===>`, res?.headers, res?.statusText);

    /////////////////// json response //////////////////////////////
    if (res.headers["content-type"] === "application/json") {
      return Responses.res(res.status, {}, res?.data);
    }

    /////////////////// default response //////////////////////////////
    return Responses._200(res?.headers["content-type"], res?.data);

    ////////////////// error response //////////////////////////////
  } catch (err) {
    const error = err as AxiosError;
    console.log("ERROR", error.response, error.response?.status, error.response?.data);
    return Responses.res(error.response?.status, {}, error.response?.data)

  }


  ////////////////// end handler /////////////////////////////////
};


const Responses = {
  _200(contentType: string = "application/json", data: Object = '{response:nothing received}') {
    return {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*',
      },
      statusCode: 200,
      body: data //JSON.stringify(data),
    };
  },

  _400(contentType: string, data: Object) {
    return {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*',
      },
      statusCode: 400,
      body: JSON.stringify(data),
    };
  },
  res(code: number = 400, headers: object = {}, body: object = { message: "default error ture" }) {
    return {
      headers: {
        'Content-Type': "application/json",
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*', ...headers
      },
      statusCode: code,
      body: JSON.stringify(body),
    };
  },
};

const http = async (url: string, method: HttpMethod = HttpMethod.GET) => {
  let res: AxiosResponse;
  if (method === HttpMethod.POST) { res = await axios.post(url) }
  else if (method === HttpMethod.PUT) { res = await axios.put(url) }
  else if (method === HttpMethod.DELETE) { res = await axios.delete(url) }
  else { res = await axios.get(url) }
  console.log(`AXIOS RESPONSE ${url} ===>`, res?.data);
  return res
}

const waitTillGrafanaLive = async () => {
  while (true) {
    try {
      const msg = await axios.get("http://localhost:3000/api/users");
    } catch (err) {
      if (!err.response) { continue }
      console.log(err.response.data.message);
      return err.response.data.message === 'Unauthorized'
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
// /mnt/lambda/function
// ./grafana/bin/grafana-server --homepath="./grafana" --config="./grafana/conf/defaults.ini"
// nohup node server.js > /tmp/output.log &
// nohup ./bin/grafana-server --homepath="./" --config="./conf/defaults.ini" > /tmp/output.log &
// nohup ./grafana/bin/grafana-server --homepath="./grafana" --config="./grafana/conf/defaults.ini" > /tmp/output.log &
