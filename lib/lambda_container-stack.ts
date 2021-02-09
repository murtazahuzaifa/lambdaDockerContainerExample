import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { Duration } from '@aws-cdk/core';
import * as iam from "@aws-cdk/aws-iam";

export class LambdaContainerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // creating lambda with contianer image
    const fn = new lambda.DockerImageFunction(this, "lambdaFunction", {
      code: lambda.DockerImageCode.fromImageAsset("lambdaImage"),
      // timeout: Duration.seconds(30),
      memorySize: 300,
      environment: {
        USERS_TABLE: "GrafanaApiStack-GrafanaRecord3E82FFFC-1ECPFEYZJ74OO",
        GF_MYSQL_HOST: "34.66.219.103:3306",
        GF_MYSQL_USER: "root",
        GF_MYSQL_PASSWORD: "admin123",
      }
    });

    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ["ecr-public:*", "ecr:SetRepositoryPolicy", "ecr:GetRepositoryPolicy", "dynamodb:*"],
      resources: ['*'],
      effect: iam.Effect.ALLOW,
    }))


    const httpApi = new apigatewayv2.HttpApi(this, "LambdaDockerApi", {
      defaultIntegration: new LambdaProxyIntegration({ handler: fn })
    });
    fn.addEnvironment("HTTP_API", httpApi.apiEndpoint)
    // httpApi.
    // httpApi.addRoutes({
    //   path: '/',
    //   methods: [apigatewayv2.HttpMethod.ANY],
    //   integration: new LambdaProxyIntegration({ handler: fn })
    // })

    new cdk.CfnOutput(this, "lambdaApi", { value: httpApi.apiEndpoint })

  }
}
