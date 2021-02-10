import { APIGatewayProxyEventV2, Context, Callback } from "aws-lambda";
import axios, { AxiosError, AxiosResponse } from "axios";
import { exec } from 'child_process';
import { DynamoDB } from 'aws-sdk';

const HTTP_API = process.env.HTTP_API!
const USERS_TABLE = process.env.USERS_TABLE;
const dynamoClient = new DynamoDB.DocumentClient();

// initializing Grafana server
exec(`nohup ./bin/grafana-server --homepath="./" --config="grafana.ini" > /tmp/output.log &`, (error, stdout, stderr) => { //uname -svr kill 20 21 22 32 43 54 | pkill -f server.js
  if (error) { console.log(`error: ${error.message}`); return; }
  if (stderr) { console.log(`stderr: ${stderr}`); return; }
  console.log(`\nstdout-1==>: ${stdout}\n`);
});


export const handler = async (event: Event, context: Context, callback: Callback) => {
  console.log("Event==>", event);

  // filtering lambda event
  const METHOD = event?.requestContext?.http?.method as HttpMethod;
  let SLASH_PATH = event?.requestContext?.http?.path as string;
  const REFERER_PATH = event?.headers?.referer as string | undefined;
  const QueryParm = event?.queryStringParameters as { mode?: string };
  const SLASH_PATH_WITH_QUERY = event.rawQueryString === "" ? SLASH_PATH : `${SLASH_PATH}?${event.rawQueryString}`
  let REFERER_PATH_SLASH = REFERER_PATH?.substr(HTTP_API.length);
  REFERER_PATH_SLASH = REFERER_PATH_SLASH === '/' ? undefined : REFERER_PATH_SLASH;

  console.log("Method ==>", METHOD);
  console.log("Path ==>", SLASH_PATH);
  console.log("Complete Path with query string ==>", SLASH_PATH_WITH_QUERY)
  QueryParm && console.log("QueryParm ==>", QueryParm)
  REFERER_PATH && console.log("Referer_Path ==>", REFERER_PATH_SLASH);


  // lambda container shell handler 
  event.cmd && exec(event.cmd || 'pwd', (error, stdout, stderr) => {
    if (error) { console.log(`error: ${error.message}`); return; }
    if (stderr) { console.log(`stderr: ${stderr}`); return; }
    console.log(`\nstdout-2==>: ${stdout}\n`);
  });

  // Wait uptill grafana local server available
  await waitTillGrafanaLive();

  // delay for testing purpose
  if (event.delay) { await delay(event.delay || 1); return {} } // delay


  ///////////////////////   Returning Response //////////////////////////////////
  try {
    //////////////////  Request ////////////////////////////
    /* if there is a request from Iframes */
    if (SLASH_PATH.substr(0, 7) === "/d-solo") {
      console.log("---Iframe Request---", SLASH_PATH_WITH_QUERY)
      const userId = QueryParm?.mode // getting userId
      if (!userId) { return Responses.res(401, {}, { "message": "Unauthorized" }) }
      const password = await getUserPassword(userId) // getting password by userId
      console.log("IFRAME request ===>", userId, '|', password, "|")
      if (!password) { return Responses.res(401, {}, { "message": "Unauthorized" }) }
      const authToken = base64Parser(`${userId}:${password}`, "Encode");
      event.headers["Authorization"] = `Basic ${authToken}`
    }
    /* other requests */
    else {
      event.headers["Authorization"] = `Basic YWRtaW46YWRtaW4=`
    }

    const url = `http://localhost:3000${SLASH_PATH_WITH_QUERY || '/'}`;
    console.log("local-URL===>", url)

    // getting response from grafana local server
    const res = await http(url, METHOD, event.headers, event.body)

    console.log(`event.header ===>`, res?.headers, res?.statusText, res.request.res.responseUrl);
    console.log(`\nAXIOS RESPONSE ${url} ===>`, res);
    const resp_data = res?.data || "{}";
    // console.log(`AXIOS RESPONSE ${url} ===>`, res?.headers, res?.statusText, res.request.res.responseUrl);
    const _headers = res?.headers as { 'set-cookie': string, Authorization: string };


    /////////////////// json response //////////////////////////////
    // if (_headers['set-cookie'] && _headers['set-cookie'][0]) {
    //   console.log("set-cookie ==>>", _headers['set-cookie'][0])
    //   _headers['set-cookie'] = _headers['set-cookie'][0]
    // }

    if (res.headers["content-type"] === "application/json") {
      console.log(`res.headers["content-type"] === "application/json"`)
      const response = Responses.res(res.status, {
        ..._headers,
      }, resp_data);
      console.log(response);
      return response
    }


    /////////////////// default response //////////////////////////////
    return Responses._200({
      "Content-Type": res?.headers["content-type"],
      ..._headers,
    }, resp_data);


    ////////////////// error response //////////////////////////////
  } catch (err) {
    const error = err as AxiosError;
    console.log("ERROR", error.response, error.response?.status, error.response?.data, error);
    return Responses.res(error.response?.status, {}, error.response?.data)

  }


}; ////////////////// end handler /////////////////////////////////


const Responses = {
  _200(headers: object, data: Object = '{response:nothing received}', code: number = 200) {
    return {
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        "Access-Control-Allow-Credentials": true,
        'Access-Control-Allow-Origin': '*',
        ...headers
      },
      statusCode: 200,
      body: data //JSON.stringify(data),
    };
  },

  _400(contentType: string, data: Object) {
    return {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        "Access-Control-Allow-Credentials": true,
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
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        "Access-Control-Allow-Credentials": true,
        'Access-Control-Allow-Origin': '*', ...headers
      },
      statusCode: code,
      body: JSON.stringify(body),
    };
  },
};

const base64Parser = (str: string, method: "Encode" | "Decode") => {
  if (method === "Encode") { return Buffer.from(str, 'utf-8').toString("base64") }
  else { return Buffer.from(str, "base64").toString("utf-8") }
}

const getUserPassword = async (userId: string) => {
  const res = await dynamoClient.get({
    TableName: USERS_TABLE!,
    Key: { PK: userId },
    AttributesToGet: ["password"],
  }).promise();
  return res.Item?.password
}

const http = async (url: string, method: HttpMethod = HttpMethod.GET, headers?: object, body?: string) => {
  let res: AxiosResponse;
  console.log("local-URL===>", url)

  if (method === HttpMethod.POST) {
    console.log('POST====>req');
    res = await axios.post(url, JSON.parse(body || "{}"), { headers });
  }

  else if (method === HttpMethod.PUT) {
    console.log('PUT====>req');
    res = await axios.put(url, JSON.parse(body || "{}"), { headers });
  }

  else if (method === HttpMethod.DELETE) {
    res = await axios.delete(url, { headers });
  }

  else {
    res = await axios.get(url, { headers });
  }

  return res;
}

const waitTillGrafanaLive = async () => {
  while (true) {
    try {
      const msg = await axios.get("http://localhost:3000");
      return
    } catch (err) {
      continue
    }
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))


enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
};

interface Event extends APIGatewayProxyEventV2 {
  delay?: number,
  cmd?: string,
  hitUrl?: string,
  read?: string,
  write?: string
};

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