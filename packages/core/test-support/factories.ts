import { Connection } from "../src/interfaces/connection";
import { ConnectionRequest, ConnectionRequestStatus } from "../src/interfaces/connection-request";
import Event, { EventMetadata } from "../src/interfaces/event";

export function buildConnectionRequest(overrides?: Partial<ConnectionRequest>): ConnectionRequest {
  const defaults = {
    acceptanceToken: "",
    channels: [],
    connection: {
      awsAccountId: "",
      nucleusId: "",
    },
    consumerEndpoint: "",
    creationDate: "",
    id: "",
    namespace: "",
    organization: "",
    providerEndpoint: "",
    status: ConnectionRequestStatus.Created,
    type: "",
    verificationCode: "",
  };

  return {
    ...defaults,
    ...overrides,
  };
}

export function buildConnection(overrides?: Partial<Connection>): Connection {
  const defaults = {
    connection: {
      arn: "",
      awsAccountId: "",
      externalId: "",
      nucleusId: "",
      roleName: "",
    },
    creationDate: "",
    endpoint: "",
    externalConnection: {
      arn: "",
      externalId: "",
    },
    inputStreams: [],
    isConsumer: false,
    isProvider: false,
    metadata: {
      EventProcessorStream: "",
      UploadS3Bucket: "",
    },
    outputStreams: [],
    updateDate: "",
  };

  return {
    ...defaults,
    ...overrides,
  };
}

export function buildEventMetadata(overrides?: Partial<EventMetadata>) {
  const eventMetadata = {
    channel: "XAPI",
    date: "",
    format: "",
    namespace: "",
    operation: "",
    origin: "",
    protocol: "",
    representation: "",
    request: {
      headers: {},
      queryStringParameters: {},
    },
    resource: "",
    resourceId: "",
  };
  return {
    ...eventMetadata,
    ...(overrides as any),
  };
}

export function buildEvent(overrides?: Partial<Event>) {
  const event = {
    content: "",
    event: buildEventMetadata(),
  };
  return {
    ...event,
    ...(overrides as any),
  };
}
