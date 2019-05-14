import DynamoConnectionRepository from "./repositories/dynamo-connection-repository";
import DynamoConnectionRequestRepository from "./repositories/dynamo-connection-request-repository";
import AwsConnectionRequestService from "./services/aws-connection-request-service";
import AwsConnectionService from "./services/aws-connection-service";
import AwsEventRouter from "./services/aws-event-router";
import AwsExchangeService from "./services/aws-exchange-service";
import AwsNucleusMetadataService from "./services/aws-nucleus-metadata-service";
import CloudformationService from "./services/cloudformation-service";
import IamService from "./services/iam-service";
import LambdaService from "./services/lambda-service";

const CONTAINER_CACHE: { [k: string]: any } = {};

function cached<T>(key: string, builder: () => T): T {
  let cachedObj = CONTAINER_CACHE[key];
  if (cachedObj) {
    return cachedObj;
  }
  cachedObj = CONTAINER_CACHE[key] = builder();
  return cachedObj;
}

export function getConnectionRepository() {
  return cached("DynamoConnectionRepository", () => new DynamoConnectionRepository());
}

export function getConnectionRequestRepository() {
  return cached("DynamoConnectionRequestRepository", () => new DynamoConnectionRequestRepository());
}

export function getCloudformationService() {
  return cached("CloudformationService", () => new CloudformationService());
}

export function getIamService() {
  return cached("IamService", () => new IamService(getMetadataService()));
}

export function getLambdaService() {
  return cached("LambdaService", () => new LambdaService(getCloudformationService()));
}

export function getExchangeService() {
  return cached("AwsExchangeService", () => new AwsExchangeService());
}

export function getMetadataService() {
  return cached(
    "AwsNucleusMetadataService",
    () => new AwsNucleusMetadataService(getCloudformationService()),
  );
}

export function getConnectionRequestService() {
  return cached(
    "AwsConnectionRequestService",
    () =>
      new AwsConnectionRequestService(
        getConnectionRequestRepository(),
        getMetadataService(),
        getExchangeService(),
        getLambdaService(),
      ),
  );
}

export function getConnectionService() {
  return cached(
    "AwsConnectionService",
    () =>
      new AwsConnectionService(
        getConnectionRepository(),
        getConnectionRequestRepository(),
        getConnectionRequestService(),
        getExchangeService(),
        getIamService(),
        getMetadataService(),
      ),
  );
}

export function getEventRouter() {
  return new AwsEventRouter(getConnectionRepository(), getExchangeService());
}
