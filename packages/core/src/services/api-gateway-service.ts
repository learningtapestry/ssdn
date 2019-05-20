import APIGateway from "aws-sdk/clients/apigateway";

import { API_KEYS } from "../interfaces/aws-metadata-keys";
import { MetadataValue } from "../interfaces/base-types";

export default class ApiGatewayService {
  private client: APIGateway;

  constructor(client: APIGateway) {
    this.client = client;
  }

  public async getApiKey(keyId: MetadataValue<API_KEYS>) {
    return await this.client.getApiKey({ apiKey: keyId.value, includeValue: true }).promise();
  }
}
