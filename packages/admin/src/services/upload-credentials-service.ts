/**
 * upload-credentials-service.ts: Wrapper service that connects to the Upload Credentials Generator
 * API
 */

import axios, { AxiosInstance } from "axios/index";
import find from "lodash/fp/find";
import querystring from "querystring";
import { Format } from "../interfaces/format";
import Instance from "../interfaces/instance";
import Setting from "../interfaces/setting";
import AWSService from "./aws-service";

class UploadCredentialsService {
  public static FORMATS = ["xAPI", "Caliper"];
  private instance: AxiosInstance;
  private settings?: Setting[];

  constructor() {
    this.instance = axios.create({
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  public async generate(client: string, format: Format) {
    const endpoint = await this.outputValue("GenerateUploadCredentialsApi");
    const url = `${endpoint}/upload-credentials`;
    const response = await this.instance.post(url, querystring.stringify({ client, format }), {
      headers: { "x-api-key": await this.apiKey() },
    });

    return response.data.credentials;
  }

  public async apiKey() {
    const apiKeyId = await this.outputValue("GenerateUploadCredentialsApiKeyId");

    return AWSService.retrieveApiKey(apiKeyId);
  }

  private async stackOutputs() {
    if (!this.settings) {
      this.settings = ((await AWSService.retrieveStack()) as Instance).settings;
    }

    return this.settings;
  }

  private async outputValue(key: string) {
    const outputs = await this.stackOutputs();
    const setting = await find<Setting>(["key", key])(outputs);

    return setting!.value;
  }
}

export default UploadCredentialsService;
