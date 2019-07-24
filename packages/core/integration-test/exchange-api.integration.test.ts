import { sign } from "aws4";
import Axios from "axios";
import { parse } from "url";

import { getDocumentClient, getLambda } from "../src/aws-clients";
import { parseKinesisData } from "../src/functions/api-helper";
import {
  API,
  API_KEYS,
  AWS_SSDN,
  BUCKETS,
  LAMBDAS,
  STREAMS,
  TABLES,
} from "../src/interfaces/aws-metadata-keys";
import { Connection } from "../src/interfaces/connection";
import { ConnectionRequest } from "../src/interfaces/connection-request";
import { Stream, StreamStatus, StreamType } from "../src/interfaces/stream";
import { getMetadataService } from "../src/services";
import { streamsPath } from "../src/services/aws-exchange-service";
import LambdaService from "../src/services/lambda-service";
import { buildConnection, buildConnectionRequest } from "../test-support/factories";
import waitUntil, {
  deleteAllData,
  getAdminCredentials,
  getCognitoAwsCredentials,
  getPairMetadataService,
  getStreamRecords,
  refreshCredentials,
  seedData,
} from "../test-support/integration";

const uuidv4r = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
// tslint:disable-next-line: max-line-length
const iso8601r = /^(?:[\+-]?\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[\.,]\d+(?!:))?)?(?:\2[0-5]\d(?:[\.,]\d+)?)?(?:[zZ]|(?:[\+-])(?:[01]\d|2[0-3]):?(?:[0-5]\d)?)?)?)?$/;

describe("ExchangeApi", () => {
  it("implements interchange between two SSDN instances", async () => {
    // Set a long time out, this test goes through the whole exchange process.
    jest.setTimeout(10 * 60 * 1000);

    const dynamo = getDocumentClient();
    const primaryMetadata = getMetadataService();
    const pairMetadata = getPairMetadataService();
    const primaryExchangeApiEndpoint = (await primaryMetadata.getEndpoint()).value;
    const pairExchangeApiEndpoint = (await pairMetadata.getEndpoint()).value;

    // Prepare DB.
    await deleteAllData(primaryMetadata);
    await deleteAllData(pairMetadata);
    await seedData(primaryMetadata);
    await seedData(pairMetadata);

    // Get credentials for the consumer instance.
    const credentials = await getAdminCredentials(primaryMetadata);

    // Create a connection request.
    const createConnectionRequestResponse = await Axios.post(
      `${primaryExchangeApiEndpoint}/connections/requests`,
      {
        formats: ["xAPI", "Caliper"],
        namespace: "test.learningtapestry.com",
        providerEndpoint: pairExchangeApiEndpoint,
      },
      {
        headers: {
          Authorization: credentials.IdToken,
        },
      },
    );

    expect(createConnectionRequestResponse.data).toEqual({
      acceptanceToken: expect.stringMatching(uuidv4r),
      connection: {
        awsAccountId: expect.stringMatching(/[0-9]+/),
        ssdnId: (await primaryMetadata.getMetadataValue(AWS_SSDN.ssdnId)).value,
      },
      consumerEndpoint: primaryExchangeApiEndpoint,
      creationDate: expect.stringMatching(iso8601r),
      formats: ["xAPI", "Caliper"],
      id: expect.stringMatching(uuidv4r),
      namespace: "test.learningtapestry.com",
      providerEndpoint: pairExchangeApiEndpoint,
      status: "created",
      verificationCode: expect.stringMatching(/[0-9]+/),
    });

    // Verify the request is sent to the other instance.
    let incomingRequest = buildConnectionRequest();
    await waitUntil(
      async () => {
        const item = await dynamo
          .get({
            Key: {
              consumerEndpoint: createConnectionRequestResponse.data.consumerEndpoint,
              id: createConnectionRequestResponse.data.id,
            },
            TableName: (await pairMetadata.getMetadataValue(TABLES.ssdnIncomingConnectionRequests))
              .value,
          })
          .promise();

        if (item && item.Item) {
          incomingRequest = item.Item as ConnectionRequest;
          return true;
        }
      },
      { timeout: 60 * 1000 },
    );

    expect(incomingRequest).toEqual(createConnectionRequestResponse.data);

    // Accept the connection request.
    // Get credentials for the pair instance.
    const pairCredentials = await getAdminCredentials(pairMetadata);

    const acceptConnectionRequestResponse = await Axios.post(
      `${pairExchangeApiEndpoint}/connections/incoming-requests/accept`,
      {
        accepted: true,
        endpoint: incomingRequest.consumerEndpoint,
        id: incomingRequest.id,
      },
      {
        headers: {
          Authorization: pairCredentials.IdToken,
        },
      },
    );

    let primaryConnection = buildConnection();
    let pairConnection = buildConnection();
    await waitUntil(
      async () => {
        let item = await dynamo
          .get({
            Key: {
              endpoint: pairExchangeApiEndpoint,
            },
            TableName: (await primaryMetadata.getMetadataValue(TABLES.ssdnConnections)).value,
          })
          .promise();
        if (item && item.Item) {
          primaryConnection = item.Item as Connection;
        }

        item = await dynamo
          .get({
            Key: {
              endpoint: primaryExchangeApiEndpoint,
            },
            TableName: (await pairMetadata.getMetadataValue(TABLES.ssdnConnections)).value,
          })
          .promise();

        if (item && item.Item) {
          pairConnection = item.Item as Connection;
        }

        if (primaryConnection.endpoint && pairConnection.endpoint) {
          return true;
        }
      },
      { timeout: 60 * 3 * 1000 },
    );

    expect(primaryConnection).toEqual({
      connection: {
        arn: expect.stringContaining("ssdn_ex"),
        awsAccountId: expect.stringMatching(/[0-9]+/),
        externalId: expect.stringMatching(uuidv4r),
        ssdnId: (await pairMetadata.getMetadataValue(AWS_SSDN.ssdnId)).value,
        roleName: expect.stringContaining("ssdn_ex"),
      },
      creationDate: expect.stringMatching(iso8601r),
      endpoint: pairExchangeApiEndpoint,
      externalConnection: {
        arn: expect.stringContaining("ssdn_ex"),
        externalId: expect.stringMatching(uuidv4r),
      },
      inputStreams: [
        {
          format: "xAPI",
          namespace: "test.learningtapestry.com",
          status: "active",
        },
        {
          format: "Caliper",
          namespace: "test.learningtapestry.com",
          status: "active",
        },
      ],
      isConsumer: false,
      isProvider: true,
      metadata: {
        EventProcessorStream: (await pairMetadata.getMetadataValue(STREAMS.eventProcessor)).value,
        UploadS3Bucket: (await pairMetadata.getMetadataValue(BUCKETS.upload)).value,
      },
      outputStreams: [],
      updateDate: expect.stringMatching(iso8601r),
    });

    expect(pairConnection).toEqual({
      connection: {
        arn: expect.stringContaining("ssdn_ex"),
        awsAccountId: expect.stringMatching(/[0-9]+/),
        externalId: expect.stringMatching(uuidv4r),
        ssdnId: (await primaryMetadata.getMetadataValue(AWS_SSDN.ssdnId)).value,
        roleName: expect.stringContaining("ssdn_ex"),
      },
      creationDate: expect.stringMatching(iso8601r),
      endpoint: primaryExchangeApiEndpoint,
      externalConnection: {
        arn: expect.stringContaining("ssdn_ex"),
        externalId: expect.stringMatching(uuidv4r),
      },
      inputStreams: [],
      isConsumer: true,
      isProvider: false,
      metadata: {
        EventProcessorStream: (await primaryMetadata.getMetadataValue(STREAMS.eventProcessor))
          .value,
        UploadS3Bucket: (await primaryMetadata.getMetadataValue(BUCKETS.upload)).value,
      },
      outputStreams: [
        {
          format: "xAPI",
          namespace: "test.learningtapestry.com",
          status: "active",
        },
        {
          format: "Caliper",
          namespace: "test.learningtapestry.com",
          status: "active",
        },
      ],
      updateDate: expect.stringMatching(iso8601r),
    });

    // Produce events.
    const pairApiKeyId = (await pairMetadata.getMetadataValue(API_KEYS.collectionApiKeyId)).value;
    const pairCollectionEndpoint = (await pairMetadata.getMetadataValue(API.beacon)).value;
    for (let i = 0; i < 10; i++) {
      const event = encodeURIComponent(
        JSON.stringify({
          actor: {
            account: { name: "test@example.com", homePage: "https://example.com" },
            objectType: "Agent",
          },
          object: { id: "http://localhost:1234/", objectType: "Activity" },
          verb: { id: "https://xapi-learningtapestry.github.io/ssdn/verbs/heartbeat" },
        }),
      );
      // tslint:disable-next-line: max-line-length
      const beaconCall = `${pairCollectionEndpoint}/xAPI/beacon?aid=${pairApiKeyId}&ns=test.learningtapestry.com&event=${event}`;
      await Axios.get(beaconCall);
    }

    // Verify that events are routed.
    let records: any[] = [];
    await waitUntil(
      async () => {
        const result = await getStreamRecords(
          (await primaryMetadata.getMetadataValue(STREAMS.eventProcessor)).value,
        );
        if (result.Records.length) {
          records = result.Records;
          return true;
        }
      },
      { timeout: 60 * 3 * 1000 },
    );

    expect(parseKinesisData(records[0].Data)).toEqual({
      content: {
        actor: {
          account: {
            homePage: "https://example.com",
            name: "test@example.com",
          },
          objectType: "Agent",
        },
        id: expect.stringMatching(uuidv4r),
        object: {
          id: "http://localhost:1234/",
          objectType: "Activity",
        },
        verb: {
          id: "https://xapi-learningtapestry.github.io/ssdn/verbs/heartbeat",
        },
      },
      event: {
        date: expect.stringMatching(iso8601r),
        format: "xAPI",
        namespace: "test.learningtapestry.com",
        operation: "GET",
        origin: expect.stringContaining("/xAPI/beacon"),
        protocol: "HTTP/1.1",
        representation: "REST",
        request: {
          headers: expect.any(Object),
          queryStringParameters: {
            aid: pairApiKeyId,
            event: expect.any(String),
            ns: "test.learningtapestry.com",
          },
        },
        resource: "statements",
        resourceId: expect.stringMatching(uuidv4r),
      },
      source: {
        endpoint: pairExchangeApiEndpoint,
      },
    });

    // Pause stream
    const awsCreds = await getCognitoAwsCredentials(
      primaryMetadata,
      await refreshCredentials(primaryMetadata, credentials),
    );

    const parsedUrl = parse(streamsPath(primaryExchangeApiEndpoint));
    const streamUpdate = {
      endpoint: pairExchangeApiEndpoint,
      stream: {
        format: "xAPI",
        namespace: "test.learningtapestry.com",
        status: StreamStatus.Paused,
      },
      streamType: StreamType.Input,
    };
    const request = {
      body: JSON.stringify(streamUpdate),
      data: streamUpdate,
      headers: {
        "Content-Type": "application/json",
      },
      host: parsedUrl.host,
      method: "POST",
      path: parsedUrl.pathname,
      url: streamsPath(primaryExchangeApiEndpoint),
    };
    const signedRequest = sign(request, {
      accessKeyId: awsCreds.accessKeyId,
      secretAccessKey: awsCreds.secretAccessKey,
      sessionToken: awsCreds.sessionToken,
    });
    delete signedRequest.headers.Host;
    delete signedRequest.headers["Content-Length"];
    await Axios.request(signedRequest);

    await waitUntil(
      async () => {
        const streamItem = await dynamo
          .get({
            Key: {
              endpoint: primaryExchangeApiEndpoint,
            },
            TableName: (await pairMetadata.getMetadataValue(TABLES.ssdnConnections)).value,
          })
          .promise();

        if (streamItem && streamItem.Item) {
          const outputStream = (streamItem.Item as Connection).outputStreams.find(
            (s) => s.format === "xAPI",
          );
          if (outputStream!.status === StreamStatus.PausedExternal) {
            return true;
          }
        }
      },
      { timeout: 3 * 60 * 1000 },
    );
  });
});
