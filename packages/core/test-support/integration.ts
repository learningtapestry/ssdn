import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
/**
 * aws.ts: Support functions related to AWS resources
 */
import Kinesis from "aws-sdk/clients/kinesis";
import Lambda from "aws-sdk/clients/lambda";
import { CognitoIdentityCredentials } from "aws-sdk/lib/core";
import pick from "lodash/fp/pick";
import generate from "nanoid/generate";

import { getCloudFormation, getDocumentClient } from "../src/aws-clients";
import { readEnv } from "../src/helpers/app-helper";
import { AWS_SSDN, TABLES } from "../src/interfaces/aws-metadata-keys";
import { MetadataKey } from "../src/interfaces/base-types";
import DynamoFormatRepository from "../src/repositories/dynamo-format-repository";
import AwsSSDNMetadataService from "../src/services/aws-ssdn-metadata-service";

export async function getAdminCredentials(metadata: AwsSSDNMetadataService) {
  const clientId = (await metadata.getMetadataValue(AWS_SSDN.clientWebId)).value;
  const userPoolId = (await metadata.getMetadataValue(AWS_SSDN.userPoolId)).value;
  const cognito = new CognitoIdentityServiceProvider();

  // Enable API authentication
  await cognito
    .updateUserPoolClient({
      ClientId: clientId,
      ExplicitAuthFlows: ["ADMIN_NO_SRP_AUTH"],
      UserPoolId: userPoolId,
    })
    .promise();

  // Delete previously created admin
  try {
    await cognito
      .adminDeleteUser({
        UserPoolId: userPoolId,
        Username: "admin",
      })
      .promise();
  } catch {}

  // Create new admin
  const tempPassword = generate("12345ABCDEHabcde!@#%&/", 30);
  await cognito
    .adminCreateUser({
      DesiredDeliveryMediums: ["EMAIL"],
      TemporaryPassword: tempPassword,
      UserAttributes: [
        { Name: "email", Value: "ssdn.admin.test@learningtapestry.com" },
        { Name: "name", Value: "Admin" },
        { Name: "phone_number", Value: "+12025550129" },
        { Name: "email_verified", Value: "true" },
        { Name: "phone_number_verified", Value: "false" },
      ],
      UserPoolId: userPoolId,
      Username: "admin",
    })
    .promise();

  // Authenticate
  const challenge = await cognito
    .adminInitiateAuth({
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      AuthParameters: {
        PASSWORD: tempPassword,
        USERNAME: "admin",
      },
      ClientId: clientId,
      UserPoolId: userPoolId,
    })
    .promise();

  const result = await cognito
    .adminRespondToAuthChallenge({
      ChallengeName: "NEW_PASSWORD_REQUIRED",
      ChallengeResponses: {
        NEW_PASSWORD: generate("12345ABCDEHabcde!@#%&/", 30),
        USERNAME: "admin",
      },
      ClientId: clientId,
      Session: challenge.Session,
      UserPoolId: userPoolId,
    })
    .promise();

  return result.AuthenticationResult!;
}

export async function refreshCredentials(
  metadata: AwsSSDNMetadataService,
  credentials: CognitoIdentityServiceProvider.AuthenticationResultType,
) {
  const clientId = (await metadata.getMetadataValue(AWS_SSDN.clientWebId)).value;
  const userPoolId = (await metadata.getMetadataValue(AWS_SSDN.userPoolId)).value;
  const cognito = new CognitoIdentityServiceProvider();

  // Authenticate
  const result = await cognito
    .adminInitiateAuth({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      AuthParameters: {
        REFRESH_TOKEN: credentials.RefreshToken!,
      },
      ClientId: clientId,
      UserPoolId: userPoolId,
    })
    .promise();

  return result.AuthenticationResult!;
}

export async function getCognitoAwsCredentials(
  metadata: AwsSSDNMetadataService,
  credentials: CognitoIdentityServiceProvider.AuthenticationResultType,
) {
  const identityPoolId = (await metadata.getMetadataValue(AWS_SSDN.identityPoolId)).value;
  const userPoolId = (await metadata.getMetadataValue(AWS_SSDN.userPoolId)).value;
  const awsCreds = new CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
    Logins: {
      [`cognito-idp.${readEnv("AWS_REGION")}.amazonaws.com/${userPoolId}`]: credentials.IdToken!,
    },
  });
  await awsCreds.getPromise();
  return awsCreds;
}

export function getPairMetadataService() {
  return new AwsSSDNMetadataService(getCloudFormation(), readEnv("SSDN_PAIR_STACK_ID"));
}

export async function seedData(metadata: AwsSSDNMetadataService) {
  const formatRepo = new DynamoFormatRepository(metadata, getDocumentClient());
  await formatRepo.put({ name: "xAPI", description: "xAPI", creationDate: "", updateDate: "" });
  await formatRepo.put({
    creationDate: "",
    description: "Caliper",
    name: "Caliper",
    updateDate: "",
  });
}

export async function deleteAllData(metadata: AwsSSDNMetadataService) {
  const dynamo = getDocumentClient();
  for (const [tableId, keyProps] of Object.entries({
    [TABLES.ssdnConnectionRequests]: ["id"],
    [TABLES.ssdnConnections]: ["endpoint"],
    [TABLES.ssdnFileTransferNotifications]: ["id"],
    [TABLES.ssdnFormats]: ["name"],
    [TABLES.ssdnIncomingConnectionRequests]: ["id", "consumerEndpoint"],
  })) {
    const tableName = (await metadata.getMetadataValue(tableId as MetadataKey)).value;
    const items = await dynamo.scan({ TableName: tableName }).promise();
    if (!items.Items) {
      continue;
    }
    const keyDef = pick(keyProps);
    for (const item of items.Items!) {
      await dynamo.delete({ Key: keyDef(item), TableName: tableName }).promise();
    }
  }
}

export async function invokeLambda(functionArn: string, payload: object) {
  const client = new Lambda({ apiVersion: "2015-03-31" });
  const params = {
    FunctionName: functionArn,
    Payload: JSON.stringify(payload),
  };

  return await client.invoke(params).promise();
}

export async function getStreamRecords(streamName: string, timestamp: Date = new Date()) {
  const client = new Kinesis({ apiVersion: "2013-12-02" });
  const shards = await client.listShards({ StreamName: streamName }).promise();
  const shardIterator = await client
    .getShardIterator({
      ShardId: shards.Shards ? shards.Shards[0].ShardId : "shardId-000000000000",
      ShardIteratorType: "AT_TIMESTAMP",
      StreamName: streamName,
      Timestamp: timestamp,
    })
    .promise();

  return await client
    .getRecords({ ShardIterator: shardIterator.ShardIterator as string })
    .promise();
}

// Extracted from https://github.com/skidding/async-until
// MIT License

// Copyright (c) 2017 Ovidiu Cherecheș

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
export default async function waitUntil(
  cb: (...args: any) => any,
  opts?: { failMsg?: string; timeout?: number; loopDelay?: number; minLoops?: number },
) {
  const { failMsg = "Unexpected error", timeout = 300, loopDelay = 0, minLoops = 3 } = opts || {};
  const t1 = Date.now();

  return new Promise((resolve, reject) => {
    // Why the loop count if we already have a timeout? Well, say something
    // happens and our program freezes for a timeout + 1ms duration. The
    // callback will run in the next loop and instantly expire if the condition
    // isn't met. Sometimes our app releases a chain of async callbacks that
    // need to fulfill before our condition is met, so the min loop count
    // ensures we don't bail too soon in case of a hiccup.
    let loopCount = 0;

    async function loop() {
      loopCount += 1;

      if (await run()) {
        resolve(true);
      } else if (Date.now() - t1 < timeout || loopCount < minLoops) {
        setTimeout(loop, loopDelay);
      } else {
        reject(new Error(failMsg));
      }
    }

    async function run() {
      try {
        return cb();
      } catch (err) {
        reject(err);
      }
    }

    // Kick it
    loop();
  });
}
