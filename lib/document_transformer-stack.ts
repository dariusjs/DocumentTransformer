import { NextJSLambdaEdge } from '@sls-next/cdk-construct';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class DocumentTransformerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new cdk.aws_s3.Bucket(this, 'PayloadBucket', {
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      enforceSSL: true,
      publicReadAccess: false,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    });
    new cdk.aws_ssm.StringParameter(this, 'BucketArn', {
      parameterName: 'PayloadBucketAddress',
      stringValue: bucket.bucketRegionalDomainName,
    });

    const getStatusLambda = new cdk.aws_lambda.Function(this, 'CheckLambda', {
      code: new cdk.aws_lambda.InlineCode('print("Hello World")'),
      handler: 'index.main',
      timeout: cdk.Duration.seconds(30),
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_9,
    });

    const submitLambda = new cdk.aws_lambda.Function(this, 'SubmitLambda', {
      code: new cdk.aws_lambda.InlineCode('print("Hello World")'),
      handler: 'index.main',
      timeout: cdk.Duration.seconds(30),
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_9,
    });

    const submitJob = new cdk.aws_stepfunctions_tasks.LambdaInvoke(
      this,
      'Submit Job',
      {
        lambdaFunction: submitLambda,
        outputPath: '$.Payload',
      },
    );

    const waitX = new cdk.aws_stepfunctions.Wait(this, 'Wait X Seconds', {
      time: cdk.aws_stepfunctions.WaitTime.secondsPath('$.waitSeconds'),
    });

    const getStatus = new cdk.aws_stepfunctions_tasks.LambdaInvoke(
      this,
      'Get Job Status',
      {
        lambdaFunction: getStatusLambda,
        inputPath: '$.guid',
        outputPath: '$.Payload',
      },
    );

    const jobFailed = new cdk.aws_stepfunctions.Fail(this, 'Job Failed', {
      cause: 'AWS Batch Job Failed',
      error: 'DescribeJob returned FAILED',
    });

    const finalStatus = new cdk.aws_stepfunctions_tasks.LambdaInvoke(
      this,
      'Get Final Job Status',
      {
        lambdaFunction: getStatusLambda,
        inputPath: '$.guid',
        outputPath: '$.Payload',
      },
    );

    const definition = submitJob
      .next(waitX)
      .next(getStatus)
      .next(
        new cdk.aws_stepfunctions.Choice(this, 'Job Complete?')
          .when(
            cdk.aws_stepfunctions.Condition.stringEquals('$.status', 'FAILED'),
            jobFailed,
          )
          .when(
            cdk.aws_stepfunctions.Condition.stringEquals(
              '$.status',
              'SUCCEEDED',
            ),
            finalStatus,
          )
          .otherwise(waitX),
      );

    const stateMachine = new cdk.aws_stepfunctions.StateMachine(
      this,
      'StateMachine',
      {
        definition: definition,
        stateMachineType: cdk.aws_stepfunctions.StateMachineType.STANDARD,
      },
    );
    new cdk.aws_ssm.StringParameter(this, 'SfnName', {
      parameterName: 'TranslateStateMachine',
      stringValue: stateMachine.stateMachineName,
    });

    const nextConstruct = new NextJSLambdaEdge(this, 'NextJsApp', {
      serverlessBuildOutDir: './build',
      runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
      timeout: cdk.Duration.seconds(30),
      memory: 256,
      withLogging: true,
    });

    bucket.addCorsRule({
      allowedMethods: [
        cdk.aws_s3.HttpMethods.GET,
        cdk.aws_s3.HttpMethods.POST,
        cdk.aws_s3.HttpMethods.PUT,
      ],
      allowedOrigins: [
        'http://localhost:3000',
        // Circular dependencyy need to fix
        // `https://${nextConstruct.distribution.domainName}`,
      ],
      allowedHeaders: ['*'],
    });

    nextConstruct.nextApiLambda?.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        resources: [`${bucket.bucketArn}/*`],
        actions: ['s3:put*'],
      }),
    );
  }
}
