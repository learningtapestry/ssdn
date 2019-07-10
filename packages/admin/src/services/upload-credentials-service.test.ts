import MockAdapter from "axios-mock-adapter";
import axios from "axios/index";
import { ssdnStack, uploadCredentials } from "../../test-support/factories";
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
      AWSService.retrieveStack = jest.fn().mockResolvedValue(ssdnStack);
      AWSService.retrieveApiKey = jest
        .fn()
        .mockResolvedValue("K4I8vkxjRz3OUZ8HBPKdS9Y8hCIh4fjY5F4JPFfn");
      mock
        .onPost(
          "https://ssdn.example.org/Production/upload-credentials",
          "client=ssdn-test.learningtapestry.com%2Ffoo%2Fbar&format=Caliper",
        )
        .reply(200, uploadCredentials());
    });

    it("generates upload credentials for the bucket", async () => {
      const credentials = await service.generate(
        "ssdn-test.learningtapestry.com/foo/bar",
        "Caliper",
      );

      expect(credentials).toEqual(uploadCredentials().credentials);
    });
  });
});
