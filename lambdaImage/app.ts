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
    const url = `http://localhost:3000${SLASH_PATH || '/'}`;
    console.log("body====>", url, JSON.parse(event.body || "{}"));
    if (METHOD === HttpMethod.POST) { console.log('POST====>req'); res = await axios.post(url, JSON.parse(event.body || "{}"), { headers: event.headers }) }
    else if (METHOD === HttpMethod.PUT) { console.log('PUT====>req'); res = await axios.put(url, JSON.parse(event.body || "{}"), { headers: event.headers }) }
    else if (METHOD === HttpMethod.DELETE) { res = await axios.delete(url, { headers: event.headers }) }
    else { res = await axios.get(url, { headers: event.headers }) }

    console.log(`AXIOS RESPONSE ${url} ===>`, res?.headers, res?.statusText, res.request.res.responseUrl);
    const _headers = res?.headers as { 'set-cookie': string }

    // /////////////////////////// redirect ////////////////////////////
    // const cookie = parseCookie(event.headers.Cookie)
    // console.log("cookie===>", cookie);
    // // if (res.request.res.responseUrl === "http://localhost:3000/login") {
    // if (!cookie?.grafana_session && res.request.path === '/') {
    //   console.log(`!event.headers.Cookie`)
    //   return Responses.res(302, {
    //     Location: "/login", //"Set-Cookie": "grafana_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
    //   }, {});
    // }

    /////////////////  /login response //////////////////////////////
    // if (METHOD === HttpMethod.POST && SLASH_PATH === "/login") {
    //   // console.log(`res.headers["content-type"] === "application/json"`)
    //   return Responses._200({
    //     // "Content-Type": res?.headers["content-type"],
    //     ...res.headers,
    //     "Set-Cookie": _headers['set-cookie'] ? _headers['set-cookie'][0] : "grafana_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
    //   }, loginHtml());
    // }

    /////////////////// json response //////////////////////////////
    if (_headers['set-cookie'] && _headers['set-cookie'][0]) {
      console.log("set-cookie ==>>", _headers['set-cookie'][0])
      _headers['set-cookie'] = _headers['set-cookie'][0]
    }
    if (res.headers["content-type"] === "application/json") {
      console.log(`res.headers["content-type"] === "application/json"`)
      const response = Responses.res(res.status, {
        ..._headers,
        // "Set-Cookie": _headers['set-cookie'] ? _headers['set-cookie'][0] : "grafana_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
      }, res?.data);
      console.log(response);
      return response
    }


    /////////////////// default response //////////////////////////////
    return Responses._200({
      "Content-Type": res?.headers["content-type"],
      // "Set-Cookie": _headers['set-cookie'] ? _headers['set-cookie'][0] : "grafana_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
      ..._headers,
    }, res?.data);


    ////////////////// error response //////////////////////////////
  } catch (err) {
    const error = err as AxiosError;
    console.log("ERROR", error.response, error.response?.status, error.response?.data);
    return Responses.res(error.response?.status, {}, error.response?.data)

  }


  ////////////////// end handler /////////////////////////////////
};


const Responses = {
  _200(headers: object, data: Object = '{response:nothing received}', code: number = 200) {
    return {
      headers: {
        'Access-Control-Allow-Methods': '*',
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

const parseCookie = (cookie?: string): CookieType | undefined => {
  if (!cookie) return //
  const splitedCookie = cookie.split('; ');
  let cookieObj: { [key: string]: string } = {};
  for (let val of splitedCookie) {
    cookieObj[val.split('=')[0]] = val.split('=')[1]
  }
  return cookieObj
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



type CookieType = {
  grafana_session?: string,
  Path?: string,
  'Max-Age'?: string,
  HttpOnly?: string,
  SameSite?: string
}


const loginHtml = () => (`<!DOCTYPE html>
<html lang="en">
  <head>
    <script>
      
      !(function() {
        if ('PerformanceLongTaskTiming' in window) {
          var g = (window.__tti = { e: [] });
          g.o = new PerformanceObserver(function(l) {
            g.e = g.e.concat(l.getEntries());
          });
          g.o.observe({ entryTypes: ['longtask'] });
        }
      })();

    </script>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <meta name="viewport" content="width=device-width" />
    <meta name="theme-color" content="#000" />

    <title>Grafana</title>

    <base href="/" />

    <link
      rel="preload"
      href="public/fonts/roboto/RxZJdnzeo3R5zSexge8UUVtXRa8TVwTICgirnJhmVJw.woff2"
      as="font"
      crossorigin
    />

    <link rel="icon" type="image/png" href="public/img/fav32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="public/img/apple-touch-icon.png" />
    <link rel="mask-icon" href="public/img/grafana_mask_icon.svg" color="#F05A28" />

    <link rel="stylesheet" href="public/build/grafana.dark.8fac2dc1d47d6c3fc6b7.css" />

    <script>
      performance.mark('css done blocking');
    </script>
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="msapplication-TileColor" content="#2b5797" />
    <meta name="msapplication-config" content="public/img/browserconfig.xml" />
  </head>

  <body class="theme-dark app-grafana">
    <style>
      .preloader {
        height: 100%;
        flex-direction: column;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .preloader__enter {
        opacity: 0;
        animation-name: preloader-fade-in;
        animation-iteration-count: 1;
        animation-duration: 0.9s;
        animation-delay: 1.35s;
        animation-fill-mode: forwards;
      }

      .preloader__bounce {
        text-align: center;
        animation-name: preloader-bounce;
        animation-duration: 0.9s;
        animation-iteration-count: infinite;
      }

      .preloader__logo {
        display: inline-block;
        animation-name: preloader-squash;
        animation-duration: 0.9s;
        animation-iteration-count: infinite;
        width: 60px;
        height: 60px;
        background-repeat: no-repeat;
        background-size: contain;
        background-image: url("data:image/svg+xml,%3csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='351px' height='365px' viewBox='0 0 351 365' style='enable-background:new 0 0 351 365%3b' xml:space='preserve'%3e %3cstyle type='text/css'%3e .st0%7bfill:url(%23SVGID_1_)%3b%7d %3c/style%3e %3cg id='Layer_1_1_'%3e %3c/g%3e %3clinearGradient id='SVGID_1_' gradientUnits='userSpaceOnUse' x1='175.5' y1='445.4948' x2='175.5' y2='114.0346'%3e %3cstop offset='0' style='stop-color:%23FFF100'/%3e %3cstop offset='1' style='stop-color:%23F05A28'/%3e %3c/linearGradient%3e %3cpath class='st0' d='M342%2c161.2c-0.6-6.1-1.6-13.1-3.6-20.9c-2-7.7-5-16.2-9.4-25c-4.4-8.8-10.1-17.9-17.5-26.8 c-2.9-3.5-6.1-6.9-9.5-10.2c5.1-20.3-6.2-37.9-6.2-37.9c-19.5-1.2-31.9%2c6.1-36.5%2c9.4c-0.8-0.3-1.5-0.7-2.3-1 c-3.3-1.3-6.7-2.6-10.3-3.7c-3.5-1.1-7.1-2.1-10.8-3c-3.7-0.9-7.4-1.6-11.2-2.2c-0.7-0.1-1.3-0.2-2-0.3 c-8.5-27.2-32.9-38.6-32.9-38.6c-27.3%2c17.3-32.4%2c41.5-32.4%2c41.5s-0.1%2c0.5-0.3%2c1.4c-1.5%2c0.4-3%2c0.9-4.5%2c1.3c-2.1%2c0.6-4.2%2c1.4-6.2%2c2.2 c-2.1%2c0.8-4.1%2c1.6-6.2%2c2.5c-4.1%2c1.8-8.2%2c3.8-12.2%2c6c-3.9%2c2.2-7.7%2c4.6-11.4%2c7.1c-0.5-0.2-1-0.4-1-0.4c-37.8-14.4-71.3%2c2.9-71.3%2c2.9 c-3.1%2c40.2%2c15.1%2c65.5%2c18.7%2c70.1c-0.9%2c2.5-1.7%2c5-2.5%2c7.5c-2.8%2c9.1-4.9%2c18.4-6.2%2c28.1c-0.2%2c1.4-0.4%2c2.8-0.5%2c4.2 C18.8%2c192.7%2c8.5%2c228%2c8.5%2c228c29.1%2c33.5%2c63.1%2c35.6%2c63.1%2c35.6c0%2c0%2c0.1-0.1%2c0.1-0.1c4.3%2c7.7%2c9.3%2c15%2c14.9%2c21.9c2.4%2c2.9%2c4.8%2c5.6%2c7.4%2c8.3 c-10.6%2c30.4%2c1.5%2c55.6%2c1.5%2c55.6c32.4%2c1.2%2c53.7-14.2%2c58.2-17.7c3.2%2c1.1%2c6.5%2c2.1%2c9.8%2c2.9c10%2c2.6%2c20.2%2c4.1%2c30.4%2c4.5 c2.5%2c0.1%2c5.1%2c0.2%2c7.6%2c0.1l1.2%2c0l0.8%2c0l1.6%2c0l1.6-0.1l0%2c0.1c15.3%2c21.8%2c42.1%2c24.9%2c42.1%2c24.9c19.1-20.1%2c20.2-40.1%2c20.2-44.4l0%2c0 c0%2c0%2c0-0.1%2c0-0.3c0-0.4%2c0-0.6%2c0-0.6l0%2c0c0-0.3%2c0-0.6%2c0-0.9c4-2.8%2c7.8-5.8%2c11.4-9.1c7.6-6.9%2c14.3-14.8%2c19.9-23.3 c0.5-0.8%2c1-1.6%2c1.5-2.4c21.6%2c1.2%2c36.9-13.4%2c36.9-13.4c-3.6-22.5-16.4-33.5-19.1-35.6l0%2c0c0%2c0-0.1-0.1-0.3-0.2 c-0.2-0.1-0.2-0.2-0.2-0.2c0%2c0%2c0%2c0%2c0%2c0c-0.1-0.1-0.3-0.2-0.5-0.3c0.1-1.4%2c0.2-2.7%2c0.3-4.1c0.2-2.4%2c0.2-4.9%2c0.2-7.3l0-1.8l0-0.9 l0-0.5c0-0.6%2c0-0.4%2c0-0.6l-0.1-1.5l-0.1-2c0-0.7-0.1-1.3-0.2-1.9c-0.1-0.6-0.1-1.3-0.2-1.9l-0.2-1.9l-0.3-1.9 c-0.4-2.5-0.8-4.9-1.4-7.4c-2.3-9.7-6.1-18.9-11-27.2c-5-8.3-11.2-15.6-18.3-21.8c-7-6.2-14.9-11.2-23.1-14.9 c-8.3-3.7-16.9-6.1-25.5-7.2c-4.3-0.6-8.6-0.8-12.9-0.7l-1.6%2c0l-0.4%2c0c-0.1%2c0-0.6%2c0-0.5%2c0l-0.7%2c0l-1.6%2c0.1c-0.6%2c0-1.2%2c0.1-1.7%2c0.1 c-2.2%2c0.2-4.4%2c0.5-6.5%2c0.9c-8.6%2c1.6-16.7%2c4.7-23.8%2c9c-7.1%2c4.3-13.3%2c9.6-18.3%2c15.6c-5%2c6-8.9%2c12.7-11.6%2c19.6c-2.7%2c6.9-4.2%2c14.1-4.6%2c21 c-0.1%2c1.7-0.1%2c3.5-0.1%2c5.2c0%2c0.4%2c0%2c0.9%2c0%2c1.3l0.1%2c1.4c0.1%2c0.8%2c0.1%2c1.7%2c0.2%2c2.5c0.3%2c3.5%2c1%2c6.9%2c1.9%2c10.1c1.9%2c6.5%2c4.9%2c12.4%2c8.6%2c17.4 c3.7%2c5%2c8.2%2c9.1%2c12.9%2c12.4c4.7%2c3.2%2c9.8%2c5.5%2c14.8%2c7c5%2c1.5%2c10%2c2.1%2c14.7%2c2.1c0.6%2c0%2c1.2%2c0%2c1.7%2c0c0.3%2c0%2c0.6%2c0%2c0.9%2c0c0.3%2c0%2c0.6%2c0%2c0.9-0.1 c0.5%2c0%2c1-0.1%2c1.5-0.1c0.1%2c0%2c0.3%2c0%2c0.4-0.1l0.5-0.1c0.3%2c0%2c0.6-0.1%2c0.9-0.1c0.6-0.1%2c1.1-0.2%2c1.7-0.3c0.6-0.1%2c1.1-0.2%2c1.6-0.4 c1.1-0.2%2c2.1-0.6%2c3.1-0.9c2-0.7%2c4-1.5%2c5.7-2.4c1.8-0.9%2c3.4-2%2c5-3c0.4-0.3%2c0.9-0.6%2c1.3-1c1.6-1.3%2c1.9-3.7%2c0.6-5.3 c-1.1-1.4-3.1-1.8-4.7-0.9c-0.4%2c0.2-0.8%2c0.4-1.2%2c0.6c-1.4%2c0.7-2.8%2c1.3-4.3%2c1.8c-1.5%2c0.5-3.1%2c0.9-4.7%2c1.2c-0.8%2c0.1-1.6%2c0.2-2.5%2c0.3 c-0.4%2c0-0.8%2c0.1-1.3%2c0.1c-0.4%2c0-0.9%2c0-1.2%2c0c-0.4%2c0-0.8%2c0-1.2%2c0c-0.5%2c0-1%2c0-1.5-0.1c0%2c0-0.3%2c0-0.1%2c0l-0.2%2c0l-0.3%2c0 c-0.2%2c0-0.5%2c0-0.7-0.1c-0.5-0.1-0.9-0.1-1.4-0.2c-3.7-0.5-7.4-1.6-10.9-3.2c-3.6-1.6-7-3.8-10.1-6.6c-3.1-2.8-5.8-6.1-7.9-9.9 c-2.1-3.8-3.6-8-4.3-12.4c-0.3-2.2-0.5-4.5-0.4-6.7c0-0.6%2c0.1-1.2%2c0.1-1.8c0%2c0.2%2c0-0.1%2c0-0.1l0-0.2l0-0.5c0-0.3%2c0.1-0.6%2c0.1-0.9 c0.1-1.2%2c0.3-2.4%2c0.5-3.6c1.7-9.6%2c6.5-19%2c13.9-26.1c1.9-1.8%2c3.9-3.4%2c6-4.9c2.1-1.5%2c4.4-2.8%2c6.8-3.9c2.4-1.1%2c4.8-2%2c7.4-2.7 c2.5-0.7%2c5.1-1.1%2c7.8-1.4c1.3-0.1%2c2.6-0.2%2c4-0.2c0.4%2c0%2c0.6%2c0%2c0.9%2c0l1.1%2c0l0.7%2c0c0.3%2c0%2c0%2c0%2c0.1%2c0l0.3%2c0l1.1%2c0.1 c2.9%2c0.2%2c5.7%2c0.6%2c8.5%2c1.3c5.6%2c1.2%2c11.1%2c3.3%2c16.2%2c6.1c10.2%2c5.7%2c18.9%2c14.5%2c24.2%2c25.1c2.7%2c5.3%2c4.6%2c11%2c5.5%2c16.9c0.2%2c1.5%2c0.4%2c3%2c0.5%2c4.5 l0.1%2c1.1l0.1%2c1.1c0%2c0.4%2c0%2c0.8%2c0%2c1.1c0%2c0.4%2c0%2c0.8%2c0%2c1.1l0%2c1l0%2c1.1c0%2c0.7-0.1%2c1.9-0.1%2c2.6c-0.1%2c1.6-0.3%2c3.3-0.5%2c4.9 c-0.2%2c1.6-0.5%2c3.2-0.8%2c4.8c-0.3%2c1.6-0.7%2c3.2-1.1%2c4.7c-0.8%2c3.1-1.8%2c6.2-3%2c9.3c-2.4%2c6-5.6%2c11.8-9.4%2c17.1 c-7.7%2c10.6-18.2%2c19.2-30.2%2c24.7c-6%2c2.7-12.3%2c4.7-18.8%2c5.7c-3.2%2c0.6-6.5%2c0.9-9.8%2c1l-0.6%2c0l-0.5%2c0l-1.1%2c0l-1.6%2c0l-0.8%2c0 c0.4%2c0-0.1%2c0-0.1%2c0l-0.3%2c0c-1.8%2c0-3.5-0.1-5.3-0.3c-7-0.5-13.9-1.8-20.7-3.7c-6.7-1.9-13.2-4.6-19.4-7.8 c-12.3-6.6-23.4-15.6-32-26.5c-4.3-5.4-8.1-11.3-11.2-17.4c-3.1-6.1-5.6-12.6-7.4-19.1c-1.8-6.6-2.9-13.3-3.4-20.1l-0.1-1.3l0-0.3 l0-0.3l0-0.6l0-1.1l0-0.3l0-0.4l0-0.8l0-1.6l0-0.3c0%2c0%2c0%2c0.1%2c0-0.1l0-0.6c0-0.8%2c0-1.7%2c0-2.5c0.1-3.3%2c0.4-6.8%2c0.8-10.2 c0.4-3.4%2c1-6.9%2c1.7-10.3c0.7-3.4%2c1.5-6.8%2c2.5-10.2c1.9-6.7%2c4.3-13.2%2c7.1-19.3c5.7-12.2%2c13.1-23.1%2c22-31.8c2.2-2.2%2c4.5-4.2%2c6.9-6.2 c2.4-1.9%2c4.9-3.7%2c7.5-5.4c2.5-1.7%2c5.2-3.2%2c7.9-4.6c1.3-0.7%2c2.7-1.4%2c4.1-2c0.7-0.3%2c1.4-0.6%2c2.1-0.9c0.7-0.3%2c1.4-0.6%2c2.1-0.9 c2.8-1.2%2c5.7-2.2%2c8.7-3.1c0.7-0.2%2c1.5-0.4%2c2.2-0.7c0.7-0.2%2c1.5-0.4%2c2.2-0.6c1.5-0.4%2c3-0.8%2c4.5-1.1c0.7-0.2%2c1.5-0.3%2c2.3-0.5 c0.8-0.2%2c1.5-0.3%2c2.3-0.5c0.8-0.1%2c1.5-0.3%2c2.3-0.4l1.1-0.2l1.2-0.2c0.8-0.1%2c1.5-0.2%2c2.3-0.3c0.9-0.1%2c1.7-0.2%2c2.6-0.3 c0.7-0.1%2c1.9-0.2%2c2.6-0.3c0.5-0.1%2c1.1-0.1%2c1.6-0.2l1.1-0.1l0.5-0.1l0.6%2c0c0.9-0.1%2c1.7-0.1%2c2.6-0.2l1.3-0.1c0%2c0%2c0.5%2c0%2c0.1%2c0l0.3%2c0 l0.6%2c0c0.7%2c0%2c1.5-0.1%2c2.2-0.1c2.9-0.1%2c5.9-0.1%2c8.8%2c0c5.8%2c0.2%2c11.5%2c0.9%2c17%2c1.9c11.1%2c2.1%2c21.5%2c5.6%2c31%2c10.3 c9.5%2c4.6%2c17.9%2c10.3%2c25.3%2c16.5c0.5%2c0.4%2c0.9%2c0.8%2c1.4%2c1.2c0.4%2c0.4%2c0.9%2c0.8%2c1.3%2c1.2c0.9%2c0.8%2c1.7%2c1.6%2c2.6%2c2.4c0.9%2c0.8%2c1.7%2c1.6%2c2.5%2c2.4 c0.8%2c0.8%2c1.6%2c1.6%2c2.4%2c2.5c3.1%2c3.3%2c6%2c6.6%2c8.6%2c10c5.2%2c6.7%2c9.4%2c13.5%2c12.7%2c19.9c0.2%2c0.4%2c0.4%2c0.8%2c0.6%2c1.2c0.2%2c0.4%2c0.4%2c0.8%2c0.6%2c1.2 c0.4%2c0.8%2c0.8%2c1.6%2c1.1%2c2.4c0.4%2c0.8%2c0.7%2c1.5%2c1.1%2c2.3c0.3%2c0.8%2c0.7%2c1.5%2c1%2c2.3c1.2%2c3%2c2.4%2c5.9%2c3.3%2c8.6c1.5%2c4.4%2c2.6%2c8.3%2c3.5%2c11.7 c0.3%2c1.4%2c1.6%2c2.3%2c3%2c2.1c1.5-0.1%2c2.6-1.3%2c2.6-2.8C342.6%2c170.4%2c342.5%2c166.1%2c342%2c161.2z'/%3e %3c/svg%3e");
      }

      .preloader__text {
        margin-top: 16px;
        font-weight: 500;
        font-size: 14px;
        font-family: Sans-serif;
        opacity: 0;
        animation-name: preloader-fade-in;
        animation-duration: 0.9s;
        animation-delay: 1.8s;
        animation-fill-mode: forwards;
      }

      .theme-light .preloader__text {
        color: #52545c;
      }

      .theme-dark .preloader__text {
        color: #d8d9da;
      }

      @keyframes preloader-fade-in {
        0% {
          opacity: 0;
           
          animation-timing-function: cubic-bezier(0, 0, 0.5, 1);
        }
        100% {
          opacity: 1;
        }
      }

      @keyframes preloader-bounce {
        from,
        to {
          transform: translateY(0px);
          animation-timing-function: cubic-bezier(0.3, 0, 0.1, 1);
        }
        50% {
          transform: translateY(-50px);
          animation-timing-function: cubic-bezier(0.9, 0, 0.7, 1);
        }
      }

      @keyframes preloader-squash {
        0% {
          transform: scaleX(1.3) scaleY(0.8);
          animation-timing-function: cubic-bezier(0.3, 0, 0.1, 1);
          transform-origin: bottom center;
        }
        15% {
          transform: scaleX(0.75) scaleY(1.25);
          animation-timing-function: cubic-bezier(0, 0, 0.7, 0.75);
          transform-origin: bottom center;
        }
        55% {
          transform: scaleX(1.05) scaleY(0.95);
          animation-timing-function: cubic-bezier(0.9, 0, 1, 1);
          transform-origin: top center;
        }
        95% {
          transform: scaleX(0.75) scaleY(1.25);
          animation-timing-function: cubic-bezier(0, 0, 0, 1);
          transform-origin: bottom center;
        }
        100% {
          transform: scaleX(1.3) scaleY(0.8);
          transform-origin: bottom center;
          animation-timing-function: cubic-bezier(0, 0, 0.7, 1);
        }
      }

       
      .preloader__text--fail {
        display: none;
      }

       
      .preloader--done .preloader__bounce,
      .preloader--done .preloader__logo {
        animation-name: none;
        display: none;
      }

      .preloader--done .preloader__logo,
      .preloader--done .preloader__text {
        display: none;
        color: #ff5705 !important;
        font-size: 15px;
      }

      .preloader--done .preloader__text--fail {
        display: block;
      }

      [ng\:cloak],
      [ng-cloak],
      .ng-cloak {
        display: none !important;
      }
    </style>

    <div class="preloader">
      <div class="preloader__enter">
        <div class="preloader__bounce">
          <div class="preloader__logo"></div>
        </div>
      </div>
      <div class="preloader__text">Loading Grafana</div>
      <div class="preloader__text preloader__text--fail">
        <p>
          <strong>If you're seeing this Grafana has failed to load its application files</strong>
          <br />
          <br />
        </p>
        <p>
          1. This could be caused by your reverse proxy settings.<br /><br />
          2. If you host grafana under subpath make sure your grafana.ini root_url setting includes subpath. If not using a reverse proxy make sure to set serve_from_sub_path to true.<br />
          <br />
          3. If you have a local dev build make sure you build frontend using: yarn start, yarn start:hot, or yarn
          build<br />
          <br />
          4. Sometimes restarting grafana-server can help<br />
        </p>
      </div>
    </div>

    <grafana-app class="grafana-app" ng-cloak>
      <sidemenu class="sidemenu"></sidemenu>
      <app-notifications-list class="page-alert-list"></app-notifications-list>
      <search-wrapper></search-wrapper>

      <div class="main-view">
				<div ng-view class="scroll-canvas"></div>
      </div>
    </grafana-app>

    <script>
        window.grafanaBootData = {
          user: {"isSignedIn":false,"id":0,"login":"","email":"","name":"","lightTheme":false,"orgCount":0,"orgId":0,"orgName":"","orgRole":"","isGrafanaAdmin":false,"gravatarUrl":"","timezone":"browser","locale":"en-GB","helpFlags1":0,"hasEditPermissionInFolders":false},
          settings: {"alertingEnabled":true,"alertingErrorOrTimeout":"alerting","alertingMinInterval":1,"alertingNoDataOrNullValues":"no_data","allowOrgCreate":false,"appSubUrl":"","appUrl":"http://localhost:3000/","authProxyEnabled":false,"autoAssignOrg":true,"buildInfo":{"buildstamp":1607529777,"commit":"11f305f88a","edition":"Open Source","env":"production","hasUpdate":true,"hideVersion":false,"isEnterprise":false,"latestVersion":"7.3.7","version":"7.3.5"},"datasources":{"-- Dashboard --":{"meta":{"type":"datasource","name":"-- Dashboard --","id":"dashboard","info":{"author":{"name":"","url":""},"description":"","links":null,"logos":{"small":"public/img/icn-datasource.svg","large":"public/img/icn-datasource.svg"},"build":{},"screenshots":null,"version":"","updated":""},"dependencies":{"grafanaVersion":"*","plugins":[]},"includes":null,"module":"app/plugins/datasource/dashboard/module","baseUrl":"public/app/plugins/datasource/dashboard","category":"","preload":false,"signature":"internal","Root":null,"annotations":false,"metrics":true,"alerting":false,"explore":false,"tables":false,"logs":false,"tracing":false,"builtIn":true,"routes":null,"streaming":false},"name":"-- Dashboard --","type":"datasource"},"-- Grafana --":{"meta":{"type":"datasource","name":"-- Grafana --","id":"grafana","info":{"author":{"name":"","url":""},"description":"","links":null,"logos":{"small":"public/img/icn-datasource.svg","large":"public/img/icn-datasource.svg"},"build":{},"screenshots":null,"version":"","updated":""},"dependencies":{"grafanaVersion":"*","plugins":[]},"includes":null,"module":"app/plugins/datasource/grafana/module","baseUrl":"public/app/plugins/datasource/grafana","category":"","preload":false,"signature":"internal","Root":null,"annotations":true,"metrics":true,"alerting":false,"explore":false,"tables":false,"logs":false,"tracing":false,"builtIn":true,"routes":null,"streaming":false},"name":"-- Grafana --","type":"datasource"},"-- Mixed --":{"meta":{"type":"datasource","name":"-- Mixed --","id":"mixed","info":{"author":{"name":"","url":""},"description":"","links":null,"logos":{"small":"public/img/icn-datasource.svg","large":"public/img/icn-datasource.svg"},"build":{},"screenshots":null,"version":"","updated":""},"dependencies":{"grafanaVersion":"*","plugins":[]},"includes":null,"module":"app/plugins/datasource/mixed/module","baseUrl":"public/app/plugins/datasource/mixed","category":"","preload":false,"signature":"internal","Root":null,"annotations":false,"metrics":true,"alerting":false,"explore":false,"tables":false,"logs":false,"tracing":false,"queryOptions":{"minInterval":true},"builtIn":true,"mixed":true,"routes":null,"streaming":false},"name":"-- Mixed --","type":"datasource"}},"dateFormats":{"fullDate":"YYYY-MM-DD HH:mm:ss","useBrowserLocale":false,"interval":{"second":"HH:mm:ss","minute":"HH:mm","hour":"MM/DD HH:mm","day":"MM/DD","month":"YYYY-MM","year":"YYYY"},"defaultTimezone":"browser"},"defaultDatasource":"-- Grafana --","disableLoginForm":false,"disableSanitizeHtml":false,"disableUserSignUp":true,"editorsCanAdmin":false,"exploreEnabled":true,"externalUserMngInfo":"","externalUserMngLinkName":"","externalUserMngLinkUrl":"","featureToggles":{},"googleAnalyticsId":"","http2Enabled":false,"ldapEnabled":false,"licenseInfo":{"edition":"Open Source","expiry":0,"hasLicense":false,"hasValidLicense":false,"licenseUrl":"https://grafana.com/products/enterprise/?utm_source=grafana_footer","stateInfo":""},"loginHint":"email or username","marketplaceUrl":"https://grafana.com/grafana/plugins/","minRefreshInterval":"5s","oauth":{},"panels":{"alertlist":{"baseUrl":"public/app/plugins/panel/alertlist","hideFromList":false,"id":"alertlist","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"Shows list of alerts and their current status","links":null,"logos":{"small":"public/app/plugins/panel/alertlist/img/icn-singlestat-panel.svg","large":"public/app/plugins/panel/alertlist/img/icn-singlestat-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/alertlist/module","name":"Alert list","signature":"internal","skipDataQuery":true,"sort":9,"state":""},"bargauge":{"baseUrl":"public/app/plugins/panel/bargauge","hideFromList":false,"id":"bargauge","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"","links":null,"logos":{"small":"public/app/plugins/panel/bargauge/img/icon_bar_gauge.svg","large":"public/app/plugins/panel/bargauge/img/icon_bar_gauge.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/bargauge/module","name":"Bar gauge","signature":"internal","skipDataQuery":false,"sort":4,"state":"beta"},"dashlist":{"baseUrl":"public/app/plugins/panel/dashlist","hideFromList":false,"id":"dashlist","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"List of dynamic links to other dashboards","links":null,"logos":{"small":"public/app/plugins/panel/dashlist/img/icn-dashlist-panel.svg","large":"public/app/plugins/panel/dashlist/img/icn-dashlist-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/dashlist/module","name":"Dashboard list","signature":"internal","skipDataQuery":true,"sort":10,"state":""},"gauge":{"baseUrl":"public/app/plugins/panel/gauge","hideFromList":false,"id":"gauge","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"","links":null,"logos":{"small":"public/app/plugins/panel/gauge/img/icon_gauge.svg","large":"public/app/plugins/panel/gauge/img/icon_gauge.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/gauge/module","name":"Gauge","signature":"internal","skipDataQuery":false,"sort":3,"state":""},"gettingstarted":{"baseUrl":"public/app/plugins/panel/gettingstarted","hideFromList":true,"id":"gettingstarted","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"","links":null,"logos":{"small":"public/app/plugins/panel/gettingstarted/img/icn-dashlist-panel.svg","large":"public/app/plugins/panel/gettingstarted/img/icn-dashlist-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/gettingstarted/module","name":"Getting Started","signature":"internal","skipDataQuery":true,"sort":100,"state":""},"graph":{"baseUrl":"public/app/plugins/panel/graph","hideFromList":false,"id":"graph","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"Graph Panel for Grafana","links":null,"logos":{"small":"public/app/plugins/panel/graph/img/icn-graph-panel.svg","large":"public/app/plugins/panel/graph/img/icn-graph-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/graph/module","name":"Graph","signature":"internal","skipDataQuery":false,"sort":1,"state":""},"heatmap":{"baseUrl":"public/app/plugins/panel/heatmap","hideFromList":false,"id":"heatmap","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"Heatmap Panel for Grafana","links":[{"name":"Brendan Gregg - Heatmaps","url":"http://www.brendangregg.com/heatmaps.html"},{"name":"Brendan Gregg - Latency Heatmaps","url":" http://www.brendangregg.com/HeatMaps/latency.html"}],"logos":{"small":"public/app/plugins/panel/heatmap/img/icn-heatmap-panel.svg","large":"public/app/plugins/panel/heatmap/img/icn-heatmap-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/heatmap/module","name":"Heatmap","signature":"internal","skipDataQuery":false,"sort":8,"state":""},"homelinks":{"baseUrl":"public/app/plugins/panel/homelinks","hideFromList":true,"id":"homelinks","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"","links":null,"logos":{"small":"public/app/plugins/panel/homelinks/img/news.svg","large":"public/app/plugins/panel/homelinks/img/news.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/homelinks/module","name":"Home links","signature":"internal","skipDataQuery":true,"sort":100,"state":""},"logs":{"baseUrl":"public/app/plugins/panel/logs","hideFromList":false,"id":"logs","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"","links":null,"logos":{"small":"public/app/plugins/panel/logs/img/icn-logs-panel.svg","large":"public/app/plugins/panel/logs/img/icn-logs-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/logs/module","name":"Logs","signature":"internal","skipDataQuery":false,"sort":100,"state":""},"news":{"baseUrl":"public/app/plugins/panel/news","hideFromList":false,"id":"news","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"","links":null,"logos":{"small":"public/app/plugins/panel/news/img/news.svg","large":"public/app/plugins/panel/news/img/news.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/news/module","name":"News","signature":"internal","skipDataQuery":true,"sort":10,"state":"beta"},"pluginlist":{"baseUrl":"public/app/plugins/panel/pluginlist","hideFromList":false,"id":"pluginlist","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"Plugin List for Grafana","links":null,"logos":{"small":"public/app/plugins/panel/pluginlist/img/icn-dashlist-panel.svg","large":"public/app/plugins/panel/pluginlist/img/icn-dashlist-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/pluginlist/module","name":"Plugin list","signature":"internal","skipDataQuery":true,"sort":100,"state":""},"singlestat":{"baseUrl":"public/app/plugins/panel/singlestat","hideFromList":false,"id":"singlestat","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"Singlestat Panel for Grafana","links":null,"logos":{"small":"public/app/plugins/panel/singlestat/img/icn-singlestat-panel.svg","large":"public/app/plugins/panel/singlestat/img/icn-singlestat-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/singlestat/module","name":"Singlestat","signature":"internal","skipDataQuery":false,"sort":6,"state":"deprecated"},"stat":{"baseUrl":"public/app/plugins/panel/stat","hideFromList":false,"id":"stat","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"Singlestat Panel for Grafana","links":null,"logos":{"small":"public/app/plugins/panel/stat/img/icn-singlestat-panel.svg","large":"public/app/plugins/panel/stat/img/icn-singlestat-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/stat/module","name":"Stat","signature":"internal","skipDataQuery":false,"sort":2,"state":"beta"},"table":{"baseUrl":"public/app/plugins/panel/table","hideFromList":false,"id":"table","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"Table Panel for Grafana","links":null,"logos":{"small":"public/app/plugins/panel/table/img/icn-table-panel.svg","large":"public/app/plugins/panel/table/img/icn-table-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/table/module","name":"Table","signature":"internal","skipDataQuery":false,"sort":5,"state":""},"table-old":{"baseUrl":"public/app/plugins/panel/table-old","hideFromList":false,"id":"table-old","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"Table Panel for Grafana","links":null,"logos":{"small":"public/app/plugins/panel/table-old/img/icn-table-panel.svg","large":"public/app/plugins/panel/table-old/img/icn-table-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/table-old/module","name":"Table (old)","signature":"internal","skipDataQuery":false,"sort":100,"state":"deprecated"},"text":{"baseUrl":"public/app/plugins/panel/text","hideFromList":false,"id":"text","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"","links":null,"logos":{"small":"public/app/plugins/panel/text/img/icn-text-panel.svg","large":"public/app/plugins/panel/text/img/icn-text-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/text/module","name":"Text","signature":"internal","skipDataQuery":true,"sort":7,"state":""},"welcome":{"baseUrl":"public/app/plugins/panel/welcome","hideFromList":true,"id":"welcome","info":{"author":{"name":"Grafana Labs","url":"https://grafana.com"},"description":"","links":null,"logos":{"small":"public/app/plugins/panel/welcome/img/icn-dashlist-panel.svg","large":"public/app/plugins/panel/welcome/img/icn-dashlist-panel.svg"},"build":{},"screenshots":null,"version":"","updated":""},"module":"app/plugins/panel/welcome/module","name":"Welcome","signature":"internal","skipDataQuery":true,"sort":100,"state":""}},"passwordHint":"password","pluginsToPreload":[],"rendererAvailable":false,"samlEnabled":false,"sigV4AuthEnabled":false,"verifyEmailEnabled":false,"viewersCanEdit":false},
          navTree: [{"id":"dashboards","text":"Dashboards","subTitle":"Manage dashboards \u0026 folders","icon":"apps","url":"/","sortWeight":-1900,"children":[{"id":"home","text":"Home","icon":"home-alt","url":"/","hideFromTabs":true},{"id":"divider","text":"Divider","divider":true,"hideFromTabs":true},{"id":"manage-dashboards","text":"Manage","icon":"sitemap","url":"/dashboards"},{"id":"playlists","text":"Playlists","icon":"presentation-play","url":"/playlists"},{"id":"snapshots","text":"Snapshots","icon":"camera","url":"/dashboard/snapshots"}]},{"id":"help","text":"Help","subTitle":"Grafana v7.3.5 (11f305f88a)","icon":"question-circle","url":"#","sortWeight":-1200,"hideFromMenu":true}]
        };

      
        window.onload = function() {
          var preloader = document.getElementsByClassName("preloader");
          if (preloader.length) {
            preloader[0].className = "preloader preloader--done";
          }
        };
    </script>

    

    
    <script src="public/build/runtime.8fac2dc1d47d6c3fc6b7.js" type="text/javascript"></script>
    <script src="public/build/angular~app.8fac2dc1d47d6c3fc6b7.js" type="text/javascript"></script>
    <script src="public/build/app.8fac2dc1d47d6c3fc6b7.js" type="text/javascript"></script>
    <script src="public/build/moment~app.8fac2dc1d47d6c3fc6b7.js" type="text/javascript"></script>
    <script src="public/build/vendors~app.8fac2dc1d47d6c3fc6b7.js" type="text/javascript"></script>
    <script>
      performance.mark('js done blocking');
    </script>
  </body>
</html>`)