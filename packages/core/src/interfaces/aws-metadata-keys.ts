export enum API {
  beacon = "ProcessXAPIBeaconApi",
  exchange = "ExchangeApi",
  statements = "ProcessXAPIStatementApi",
}

export enum API_KEYS {
  collectionApiKeyId = "CollectionApiKeyId",
}

export enum AWS_NUCLEUS {
  awsAccountId = "AwsAccountId",
  namespace = "Namespace",
  nucleusId = "NucleusId",
}

export enum LAMBDAS {
  authorizeBeacon = "AuthorizeBeaconFunction",
  connectionRequestAccept = "ConnectionRequestAcceptFunction",
  connectionRequestCancel = "ConnectionRequestCancelFunction",
  connectionRequestCreate = "ConnectionRequestCreateFunction",
  connectionRequestSend = "ConnectionRequestSendFunction",
  connectionRequestVerify = "ConnectionRequestVerifyFunction",
  incomingConnectionRequestAccept = "IncomingConnectionRequestAcceptFunction",
  incomingConnectionRequestCancel = "IncomingConnectionRequestCancelFunction",
  incomingConnectionRequestCreate = "IncomingConnectionRequestCreateFunction",
  incomingConnectionRequestSendAcceptance = "IncomingConnectionRequestSendAcceptanceFunction",
  processXAPIBeacon = "ProcessXAPIBeaconFunction",
  processXAPIStatement = "ProcessXAPIStatementFunction",
  routeEvents = "RouteEventsFunction",
  streamUpdate = "StreamUpdate",
}

export enum POLICIES {
  consumerPolicy = "ExchangeConsumerPolicy",
  providerPolicy = "ExchangeProviderPolicy",
}

export enum PUBLIC_METADATA {
  EventProcessorStream = "EventProcessorStream",
}

export enum STREAMS {
  eventProcessor = "EventProcessorStream",
}

export enum TABLES {
  nucleusConnectionRequests = "NucleusConnectionRequestsTable",
  nucleusConnections = "NucleusConnectionsTable",
  nucleusIncomingConnectionRequests = "NucleusIncomingConnectionRequestsTable",
}
