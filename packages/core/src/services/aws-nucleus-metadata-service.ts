import CloudformationService from "./cloudformation-service";
import NucleusMetadataService from "./nucleus-metadata-service";

export default class AwsNucleusMetadataService implements NucleusMetadataService {
  private cloudformation: CloudformationService;

  constructor(cloudformation: CloudformationService) {
    this.cloudformation = cloudformation;
  }

  public async getConfigurationValue(configurationKey: string) {
    const stack = await this.cloudformation.getCurrentStack();
    return stack.Outputs!.find((o) => o.OutputKey === configurationKey)!.OutputValue!;
  }

  public async getEndpoint() {
    return await this.getConfigurationValue("ExchangeApi");
  }
}
