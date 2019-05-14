export default interface NucleusMetadataService {
  getConfigurationValue(configurationKey: string): Promise<string>;
  getEndpoint(): Promise<string>;
}
