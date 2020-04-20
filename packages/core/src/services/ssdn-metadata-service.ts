import { API } from "../interfaces/aws-metadata-keys";
import { MetadataKey, MetadataValue } from "../interfaces/base-types";
import { PublicSSDNMetadata } from "../interfaces/connection";

export default interface SSDNMetadataService {
  getPublicMetadata(): Promise<PublicSSDNMetadata>;
  getMetadataValue(metadataKey: MetadataKey): Promise<MetadataValue<MetadataKey>>;
  getEndpoint(): Promise<MetadataValue<API>>;
}
