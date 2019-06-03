import MockAdapter from "axios-mock-adapter";
import axios from "axios/index";
import { nucleusStack, uploadCredentials } from "../../test-support/factories";
import AWSService from "./aws-service";
import UploadCredentialsService from "./upload-credentials-service";

let mock: MockAdapter;
let service: UploadCredentialsService;

describe("UploadCredentialsService", () => {
  beforeAll(() => {
    mock = new MockAdapter(axios);
    service = new UploadCredentialsService();
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  describe("generate", () => {
    beforeEach(() => {
      AWSService.retrieveStack = jest.fn().mockResolvedValue(nucleusStack);
      AWSService.retrieveApiKey = jest
        .fn()
        .mockResolvedValue("K4I8vkxjRz3OUZ8HBPKdS9Y8hCIh4fjY5F4JPFfn");
      mock
        .onPost(
          "https://nucleus.example.org/Production/upload-credentials",
          "client=learning-tapestry-test&format=Caliper",
        )
        .reply(200, uploadCredentials());
    });

    it("generates upload credentials for the bucket", async () => {
      const credentials = await service.generate("learning-tapestry-test", "Caliper");

      expect(credentials).toEqual(uploadCredentials().credentials);
    });
  });
});
