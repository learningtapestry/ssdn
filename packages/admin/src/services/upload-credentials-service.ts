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

  constructor() {
    this.instance = axios.create({
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  public async generate(client: string, format: Format) {
    const stackOutputs = ((await AWSService.retrieveStack()) as Instance).settings;
    const credentialsEndpoint = find<Setting>(["key", "GenerateUploadCredentialsApi"])(
      stackOutputs,
    );
    const url = `${credentialsEndpoint!.value}/upload-credentials`;
    const response = await this.instance.post(url, querystring.stringify({ client, format }));

    return response.data.credentials;
  }
}

export default UploadCredentialsService;
