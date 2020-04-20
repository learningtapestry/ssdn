export enum API {
  beacon = "ProcessXAPIBeaconApi",
  exchange = "ExchangeApi",
  statements = "ProcessXAPIStatementApi",
  entities = "EntitiesApi",
}

export enum API_KEYS {
  collectionApiKeyId = "CollectionApiKeyId",
}

export enum AWS_SSDN {
  awsAccountId = "AwsAccountId",
  awsRegion = "AwsRegion",
  clientId = "CognitoUserPoolClientId",
  clientWebId = "CognitoUserPoolClientWebId",
  identityPoolId = "CognitoIdentityPoolId",
  namespace = "Namespace",
  ssdnId = "SSDNId",
  userPoolId = "CognitoUserPoolId",
}

export enum BUCKETS {
  delivery = "DeliveryS3Bucket",
  download = "DownloadS3Bucket",
  upload = "UploadS3Bucket",
}

export enum LAMBDAS {
  authorizeBeacon = "AuthorizeBeaconFunction",
  connectionRequestAccept = "ConnectionRequestAcceptFunction",
  connectionRequestCancel = "ConnectionRequestCancelFunction",
  connectionRequestCreate = "ConnectionRequestCreateFunction",
  connectionRequestSend = "ConnectionRequestSendFunction",
  connectionRequestVerify = "ConnectionRequestVerifyFunction",
  entities = "EntitiesApiFunction",
  incomingConnectionRequestAccept = "IncomingConnectionRequestAcceptFunction",
  incomingConnectionRequestCancel = "IncomingConnectionRequestCancelFunction",
  incomingConnectionRequestCreate = "IncomingConnectionRequestCreateFunction",
  incomingConnectionRequestSendAcceptance = "IncomingConnectionRequestSendAcceptanceFunction",
  processXAPIBeacon = "ProcessXAPIBeaconFunction",
  processXAPIStatement = "ProcessXAPIStatementFunction",
  routeEvents = "RouteEventsFunction",
  streamUpdate = "StreamUpdateFunction",
  generateUploadCredentials = "GenerateUploadCredentialsFunction",
}

export enum ROLES {
  uploadFile = "UploadFileRole",
}

export enum POLICIES {
  consumerPolicy = "ExchangeConsumerPolicy",
  providerPolicy = "ExchangeProviderPolicy",
}

export enum PUBLIC_METADATA {
  AwsRegion = "AwsRegion",
  EventProcessorStream = "EventProcessorStream",
}

export enum STREAMS {
  eventProcessor = "EventProcessorStream",
}

export enum TABLES {
  ssdnConnectionRequests = "SSDNConnectionRequestsTable",
  ssdnConnections = "SSDNConnectionsTable",
  ssdnIncomingConnectionRequests = "SSDNIncomingConnectionRequestsTable",
  ssdnFormats = "SSDNFormatsTable",
  ssdnFileTransferNotifications = "SSDNFileTransferNotificationsTable",
  ssdnSQSIntegrationNotifications = "SSDNSQSIntegrationNotificationsTable",
  ssdnDemoEvents = "SSDNDemoEventsTable",
}

export enum TOPICS {
  fileTransferNotifications = "FileTransferNotificationsTopic",
  sqsIntegrationNotifications = "SQSIntegrationNotificationsTopic",
}
