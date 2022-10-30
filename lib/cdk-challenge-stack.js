import {  RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import events from 'aws-cdk-lib/aws-events';
import targets from 'aws-cdk-lib/aws-events-targets';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

const __filename = fileURLToPath(import.meta.url);

class CdkChallengeStack extends Stack {

  constructor(scope, id, props) {
    super(scope, id, props);

    const quotesTable = new Table(this, 'quotesTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    })

    const handlerFunction = new Function(this, 'quotesAPIHandler', {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 512,
      handler: 'app.handler',
      code: Code.fromAsset(join(path.dirname(__filename), '../lambdas')),
      environment: {
        MY_TABLE: quotesTable.tableName
      }
    });

    const handlerQuote = new Function(this, 'quotesSchedule', {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 512,
      handler: 'process.handler',
      code: Code.fromAsset(join(path.dirname(__filename), '../lambdas')),
      environment: {
        MY_TABLE: quotesTable.tableName
      }
    });

    const handlerMail = new Function(this, 'mailSchedule', {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 512,
      handler: 'sendEmail.handler',
      code: Code.fromAsset(join(path.dirname(__filename), '../lambdas')),
      environment: {
        MY_TABLE: quotesTable.tableName
      }
    });

    handlerMail.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'ses:SendEmail',
          'ses:SendRawEmail',
          'ses:SendTemplatedEmail'
        ],
        resources: ['*']
      })
    )

    quotesTable.grantReadWriteData(handlerFunction);
    quotesTable.grantReadWriteData(handlerQuote);
    quotesTable.grantReadWriteData(handlerMail);

    const api = new RestApi(this, 'quotesApi', {
      description: 'Quotes API',
    });

    const handlerIntegration = new LambdaIntegration(handlerFunction)
    const quoteIntegration = new LambdaIntegration(handlerQuote)


    const mainPath = api.root.addResource('quotes');

    mainPath.addMethod('GET', handlerIntegration); // get all
    // mainPath.addMethod('POST', handlerIntegration); // post a quote
    mainPath.addMethod('POST', quoteIntegration); // post a quote

    const rule = new events.Rule(this, 'Cron-rule', {
      schedule: events.Schedule.expression('cron(0 13 ? * MON-SUN *)')
    })

    const mailRule = new events.Rule(this, 'Cron-mail-rule', {
      schedule: events.Schedule.expression('cron(0 13 ? * MON-SUN *)')
    })

    rule.addTarget(new targets.LambdaFunction(handlerQuote));

    mailRule.addTarget(new targets.LambdaFunction(handlerMail));

  }
}

export { CdkChallengeStack }
