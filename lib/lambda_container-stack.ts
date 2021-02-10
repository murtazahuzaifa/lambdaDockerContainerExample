import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import * as iam from "@aws-cdk/aws-iam";
require('dotenv').config();


////////////////////////////////////////// main stack //////////////////////////////////
export class LambdaContainerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // creating lambda container with docker image
    const lambdaContainer = new lambda.DockerImageFunction(this, "lambdaFunction", {
      code: lambda.DockerImageCode.fromImageAsset("lambdaImage"),
      // timeout: cdk.Duration.seconds(30),
      memorySize: 300,
      environment: {
        USERS_TABLE: process.env.USERS_TABLE!,
        GF_MYSQL_HOST: process.env.GF_MYSQL_HOST!,
        GF_MYSQL_USER: process.env.GF_MYSQL_USER!,
        GF_MYSQL_PASSWORD: process.env.GF_MYSQL_PASSWORD!,
      }
    });

    /* adding require policies in lambda default role */
    lambdaContainer.addToRolePolicy(new iam.PolicyStatement({
      actions: ["ecr-public:*", "ecr:SetRepositoryPolicy", "ecr:GetRepositoryPolicy", "dynamodb:*"],
      resources: ['*'],
      effect: iam.Effect.ALLOW,
    }))


    /* logging http endpoint for lambda container */
    const httpApi = new apigatewayv2.HttpApi(this, "LambdaDockerApi", {
      defaultIntegration: new LambdaProxyIntegration({ handler: lambdaContainer })
    });

    /* adding api endpoint as environment in lambda container */
    lambdaContainer.addEnvironment("HTTP_API", httpApi.apiEndpoint)


    /* logging api end point */
    new cdk.CfnOutput(this, "lambdaApi", { value: httpApi.apiEndpoint })

  }
}
