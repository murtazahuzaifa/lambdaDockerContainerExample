import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as efs from "@aws-cdk/aws-efs";
import * as iam from "@aws-cdk/aws-iam";

export class LambdaContainerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myVpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      // natGateways: 0
    });

    const fileSystem = new efs.FileSystem(this, "lambdaEfsFileSystem", {
      vpc: myVpc,
    });

    const accessPoint = fileSystem.addAccessPoint("AccessPoint", {    
      createAcl: {
        ownerGid: "1001",
        ownerUid: "1001",
        permissions: "777",
      },
      path: "/grafana",
      posixUser: {
        gid: "1001",
        uid: "1001",
      },
    });

    // creating lambda with contianer image
    const fn = new lambda.DockerImageFunction(this, "lambdaFunction", {
      code: lambda.DockerImageCode.fromImageAsset("lambdaImage"),
      // timeout: Duration.seconds(10),
      memorySize: 512,
      vpc: myVpc,
      filesystem: lambda.FileSystem.fromEfsAccessPoint(accessPoint, "/mnt/grafana"),
    });
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ["ecr-public:*", "ecr:SetRepositoryPolicy", "ecr:GetRepositoryPolicy"],
      resources: ['*']
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
