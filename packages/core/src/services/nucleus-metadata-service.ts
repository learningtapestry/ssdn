import { API } from "../interfaces/aws-metadata-keys";
import { MetadataKey, MetadataValue } from "../interfaces/base-types";
import { PublicNucleusMetadata } from "../interfaces/connection";

export default interface NucleusMetadataService {
  getPublicMetadata(): Promise<PublicNucleusMetadata>;
  getMetadataValue(metadataKey: MetadataKey): Promise<MetadataValue<MetadataKey>>;
  getEndpoint(): Promise<MetadataValue<API>>;
}
