import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as events from "@aws-cdk/aws-events";
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as targets from "@aws-cdk/aws-events-targets";
require('dotenv').config()
import * as apigw from "@aws-cdk/aws-apigateway";

export class GrafanaApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // const table = new ddb.Table(this, "GrafanaRecord", {
    //   billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    //   partitionKey: {
    //     name: 'PK',
    //     type: ddb.AttributeType.STRING
    //   }
    // });


    // const lambdaLayer = new lambda.LayerVersion(this, "LambdaLayer", {
    //   code: lambda.Code.fromAsset('lambda_layer'),
    // })

    // ///Lambda Fucntion
    // const create_saas_api = new lambda.Function(this, "create_saas_api", {
    //   runtime: lambda.Runtime.NODEJS_12_X,
    //   code: lambda.Code.fromAsset("lambda"),
    //   handler: 'create_saas_api.handler',
    //   layers: [lambdaLayer],
    //   timeout: cdk.Duration.seconds(10),
    //   environment: {
    //     USERNAME: "admin",
    //     PASSWORD: "admin",
    //     ACCESS_KEY: process.env.ACCESS_KEY || "access",
    //     SECRET_KEY: process.env.SECRET_KEY || "secret",
    //     TABLE: table.tableName,
    //   },
    // })

    // const create_grafana_user = new lambda.Function(this, "create_grafana_user", {
    //   runtime: lambda.Runtime.NODEJS_12_X,
    //   code: lambda.Code.fromAsset("lambda"),
    //   handler: 'createGrafanaUser.handler',
    //   timeout: cdk.Duration.seconds(10),
    //   layers: [lambdaLayer],
    //   environment: {
    //     USERNAME: "admin",
    //     PASSWORD: "admin",
    //     TABLE: table.tableName,
    //   },
    // })

    // const create_subscribed_api = new lambda.Function(this, "create_subscribed_api", {
    //   runtime: lambda.Runtime.NODEJS_12_X,
    //   code: lambda.Code.fromAsset("lambda"),
    //   handler: 'create_subscribed_api.handler',
    //   timeout: cdk.Duration.seconds(10),
    //   layers: [lambdaLayer],
    //   environment: {
    //     USERNAME: "admin",
    //     PASSWORD: "admin",
    //     ACCESS_KEY: process.env.ACCESS_KEY || "access",
    //     SECRET_KEY: process.env.SECRET_KEY || "secret",
    //     TABLE: table.tableName,
    //   },
    // })

    // table.grantFullAccess(create_grafana_user)
    // table.grantFullAccess(create_saas_api)
    // table.grantFullAccess(create_subscribed_api)


    // const bus = new events.EventBus(this, 'Grafana_events', {
    //   eventBusName: 'grafana_event'
    // })

    // new events.Rule(this, 'create_grafana_user_rule', {
    //   eventBus: bus,
    //   eventPattern: {
    //     source: [
    //       "grafana"
    //     ],
    //     detailType: [
    //       "create_user"
    //     ]
    //   },
    //   ruleName: 'CreateUser',
    //   targets: [
    //     new targets.LambdaFunction(create_grafana_user, {
    //       event: events.RuleTargetInput.fromObject({
    //         data: events.EventField.fromPath('$.detail')
    //       })
    //     })
    //   ]
    // })

    // new events.Rule(this, 'create_subscribed_api_rule', {
    //   eventBus: bus,
    //   eventPattern: {
    //     source: [
    //       "grafana"
    //     ],
    //     detailType: [
    //       "create_subscribed_api"
    //     ]
    //   },
    //   ruleName: 'CreateSubscribedApi',
    //   targets: [
    //     new targets.LambdaFunction(create_subscribed_api, {
    //       event: events.RuleTargetInput.fromObject({
    //         data: events.EventField.fromPath('$.detail')
    //       })
    //     })
    //   ]
    // })

    // new events.Rule(this, 'create_saas_api_rule', {
    //   eventBus: bus,
    //   eventPattern: {
    //     source: [
    //       "grafana"
    //     ],
    //     detailType: [
    //       "create_saas_api"
    //     ]
    //   },
    //   ruleName: 'CreateSaasApi',
    //   targets: [
    //     new targets.LambdaFunction(create_saas_api, {
    //       event: events.RuleTargetInput.fromObject({
    //         data: events.EventField.fromPath('$.detail')
    //       })
    //     })
    //   ]
    // })

    // new cdk.CfnOutput(this, "Access", {
    //   value: process.env.ACCESS_KEY || "access"
    // });

    // new cdk.CfnOutput(this, "SEcret", {
    //   value: process.env.SECRET_KEY || "secret"
    // });

    // const api = new apigw.RestApi(this, 'GrafanaAPI', {
    //   restApiName: 'grafana',
    //   defaultCorsPreflightOptions: {
    //     allowOrigins: apigw.Cors.ALL_ORIGINS,
    //     allowMethods: apigw.Cors.ALL_METHODS, // this is also the default
    //   }
    // });

    // const get_grafana_panels = new lambda.Function(this, "get_grafana_panels", {
    //   runtime: lambda.Runtime.NODEJS_12_X,
    //   code: lambda.Code.fromAsset("lambda"),
    //   handler: 'get_grafana_panels.handler',
    //   timeout: cdk.Duration.seconds(10),
    //   layers: [lambdaLayer],
    //   environment: {
    //     USERNAME: "admin",
    //     PASSWORD: "admin",
    //     ACCESS_KEY: process.env.ACCESS_KEY || "access",
    //     SECRET_KEY: process.env.SECRET_KEY || "secret",
    //     TABLE: table.tableName,
    //   },
    // })

    // table.grantFullAccess(get_grafana_panels)

    // const grafana_panels = api.root.addResource('grafana_panels');
    // const updateIntegration = new apigw.LambdaIntegration(get_grafana_panels);
    // grafana_panels.addMethod('POST', updateIntegration);

  }
}
