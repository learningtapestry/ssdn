import { PUBLIC_METADATA } from "../interfaces/aws-metadata-keys";
import { Connection } from "../interfaces/connection";
import NucleusMetadataService from "./nucleus-metadata-service";

export default class ExternalNucleusMetadataService implements NucleusMetadataService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  public async getMetadataValue(configurationKey: PUBLIC_METADATA) {
    const value = this.connection.metadata[configurationKey];
    if (value) {
      return { value };
    }
    throw new Error(`Requested a configuration property that does not exist: ${configurationKey}`);
  }

  public async getEndpoint() {
    return { value: this.connection.endpoint };
  }

  public async getPublicMetadata() {
    return this.connection.metadata;
  }
}
