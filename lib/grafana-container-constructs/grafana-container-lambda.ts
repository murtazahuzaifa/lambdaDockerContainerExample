import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as iam from "@aws-cdk/aws-iam";
require('dotenv').config();

interface GrafanaContainerLambdaProps {
  userTableName: ddb.ITable['tableName'],
}

export class GrafanaContainerLambda extends cdk.Construct {

  public readonly apiEndpoint: apigatewayv2.HttpApi['apiEndpoint'];

  constructor(scope: cdk.Construct, id: string, props: GrafanaContainerLambdaProps) {
    super(scope, id);

    // creating lambda container with docker image
    const lambdaContainer = new lambda.DockerImageFunction(this, "lambdaFunction", {
      code: lambda.DockerImageCode.fromImageAsset("lambdaImage"),
      timeout: cdk.Duration.seconds(60),
      memorySize: 300,
      environment: {
        USERS_TABLE: props.userTableName,
        GF_MYSQL_HOST: process.env.GF_MYSQL_HOST!,
        GF_MYSQL_USER: process.env.GF_MYSQL_USER!,
        GF_MYSQL_PASSWORD: process.env.GF_MYSQL_PASSWORD!,
      }
    });

    /* adding require policies in lambda default role */
    lambdaContainer.addToRolePolicy(new iam.PolicyStatement({
      actions: ["dynamodb:*"],
      resources: ['*'],
      effect: iam.Effect.ALLOW,
    }));


    /* logging http endpoint for lambda container */
    const httpApi = new apigatewayv2.HttpApi(this, "LambdaDockerApi", {
      defaultIntegration: new LambdaProxyIntegration({ handler: lambdaContainer }),
    });
    this.apiEndpoint = httpApi.apiEndpoint;

    /* adding api endpoint as environment in lambda container */
    lambdaContainer.addEnvironment("HTTP_API", httpApi.apiEndpoint);


    /* logging api end point */
    new cdk.CfnOutput(this, "lambdaApi", { value: httpApi.apiEndpoint });

  }
}
