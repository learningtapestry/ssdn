import { readEnv } from "../helpers/app-helper";

const nucleusId = readEnv("NUCLEUS_ID");

export const TABLES = {
  nucleusConfiguration: `Nucleus-${nucleusId}-Configuration`,
  nucleusConnectionRequests: `Nucleus-${nucleusId}-ConnectionRequests`,
  nucleusConnections: `Nucleus-${nucleusId}-Connections`,
  nucleusIncomingConnectionRequests: `Nucleus-${nucleusId}-IncomingConnectionRequests`,
};

export const STREAMS = {
  eventProcessor: `Nucleus-${nucleusId}-EventProcessor`,
  eventProcessorFor: (externalNucleusId: string) => `Nucleus-${externalNucleusId}-EventProcessor`,
};

export const LAMBDAS = {
  authorizeBeacon: "AuthorizeBeaconFunction",
  connectionRequestAccept: "ConnectionRequestAcceptFunction",
  connectionRequestCancel: "ConnectionRequestCancelFunction",
  connectionRequestCreate: "ConnectionRequestCreateFunction",
  connectionRequestSend: "ConnectionRequestSendFunction",
  connectionRequestVerify: "ConnectionRequestVerifyFunction",
  incomingConnectionRequestAccept: "IncomingConnectionRequestAcceptFunction",
  incomingConnectionRequestCancel: "IncomingConnectionRequestCancelFunction",
  incomingConnectionRequestCreate: "IncomingConnectionRequestCreateFunction",
  incomingConnectionRequestSendAcceptance: "IncomingConnectionRequestSendAcceptanceFunction",
  processXAPIBeacon: "ProcessXAPIBeaconFunction",
  processXAPIStatement: "ProcessXAPIStatementFunction",
  routeEvents: "RouteEventsFunction",
  streamUpdate: "StreamUpdate",
};

export const POLICIES = {
  consumerPolicy: "ExchangeConsumerPolicy",
  providerPolicy: "ExchangeProviderPolicy",
};
