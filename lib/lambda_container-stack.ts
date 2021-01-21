import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";

export class LambdaContainerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // creating lambda with contianer image
    const fn = new lambda.DockerImageFunction(this, "lambdaFunction", {
      //make sure the lambdaImage folder must container Dockerfile
      code: lambda.DockerImageCode.fromImageAsset("lambdaImage"),
      // timeout: cdk.Duration.seconds(10),

    });

    const httpApi = new apigatewayv2.HttpApi(this, "LambdaDockerApi");
    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: new LambdaProxyIntegration({ handler: fn })
    })

    new cdk.CfnOutput(this, "lambdaApi", { value: httpApi.apiEndpoint })

  }
}
