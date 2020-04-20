import { buildConnectionRequest } from "../../test-support/factories";
import { fakeImpl, mocked } from "../../test-support/jest-helper";
import { AWS_SSDN } from "../interfaces/aws-metadata-keys";
import { ConnectionRequestStatus } from "../interfaces/connection-request";
import { ConnectionRequestRepository } from "../repositories/connection-request-repository";
import AwsConnectionRequestService from "./aws-connection-request-service";
import ExchangeService from "./exchange-service";
import LambdaService from "./lambda-service";
import SSDNMetadataService from "./ssdn-metadata-service";

const fakeRepository = fakeImpl<ConnectionRequestRepository>({
  getIncoming: jest.fn(() => Promise.reject()),
  put: jest.fn(),
  putIncoming: jest.fn((c) => Promise.resolve(c)),
  updateIncomingStatus: jest.fn(),
  updateStatus: jest.fn(),
});

const fakeMetadata = fakeImpl<SSDNMetadataService>({
  getEndpoint: jest.fn(() => Promise.resolve({ value: "https://red.com" })),
  getMetadataValue: jest.fn((k: string) =>
    Promise.resolve({
      value: ({
        [AWS_SSDN.awsAccountId]: "ssdnaccountid",
        [AWS_SSDN.namespace]: "ssdn-test.learningtapestry.com",
        [AWS_SSDN.ssdnId]: "ssdn-test",
      } as any)[k],
    }),
  ),
});

const fakeExchangeService = fakeImpl<ExchangeService>({
  sendConnectionRequest: jest.fn(),
});

const fakeLambdaService = fakeImpl<LambdaService>({
  invokeApiGatewayLambda: jest.fn(),
});

const buildConnectionRequestService = () =>
  new AwsConnectionRequestService(
    fakeRepository,
    fakeMetadata,
    fakeExchangeService,
    fakeLambdaService,
  );

describe("AwsConnectionRequestService", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("create", () => {
    it("creates a new connection request", async () => {
      const connectionRequest = await buildConnectionRequestService().create(
        buildConnectionRequest({
          acceptanceToken: "",
          connection: {
            awsAccountId: "",
            ssdnId: "",
          },
          consumerEndpoint: "",
          creationDate: "",
          formats: ["Caliper"],
          id: "",
          namespace: "",
          status: ConnectionRequestStatus.Accepted,
          verificationCode: "",
        }),
      );
      expect(connectionRequest.id.split("-")).toHaveLength(5);
      expect(connectionRequest.acceptanceToken.split("-")).toHaveLength(5);
      expect(connectionRequest.formats).toEqual(["Caliper"]);
      expect(connectionRequest.connection).toEqual({
        awsAccountId: "ssdnaccountid",
        ssdnId: "ssdn-test",
      });
      expect(connectionRequest.consumerEndpoint).toEqual("https://red.com");
      expect(connectionRequest.creationDate).not.toHaveLength(0);
      expect(connectionRequest.namespace).toEqual("ssdn-test.learningtapestry.com");
      expect(connectionRequest.status).toEqual(ConnectionRequestStatus.Created);
      expect(connectionRequest.verificationCode).not.toHaveLength(0);
      expect(fakeRepository.put).toHaveBeenCalledWith(connectionRequest);
      expect(fakeExchangeService.sendConnectionRequest).toHaveBeenCalledWith(connectionRequest);
      expect(fakeRepository.updateStatus).toHaveBeenCalledWith(
        connectionRequest.id,
        ConnectionRequestStatus.Pending,
      );
    });

    it("rejects the creation of self-referential requests", async () => {
      const result = buildConnectionRequestService().create(
        buildConnectionRequest({ providerEndpoint: "https://red.com" }),
      );
      await expect(result).rejects.toHaveProperty(
        "message",
        "An instance cannot create an stream to itself.",
      );
    });
  });

  describe("createIncoming", () => {
    it("rejects requests with duplicate ids", async () => {
      mocked(fakeRepository.getIncoming).mockResolvedValueOnce(buildConnectionRequest());
      const result = buildConnectionRequestService().createIncoming(buildConnectionRequest());
      await expect(result).rejects.toHaveProperty(
        "message",
        "The connection request has already been submitted.",
      );
    });

    it("creates incoming requests", async () => {
      const connectionRequest = await buildConnectionRequestService().createIncoming(
        buildConnectionRequest({ status: ConnectionRequestStatus.Accepted }),
      );
      expect(connectionRequest.status).toEqual(ConnectionRequestStatus.Created);
      expect(fakeRepository.putIncoming).toHaveBeenCalledWith(connectionRequest);
    });

    it("rejects the creation of self-referential requests", async () => {
      const result = buildConnectionRequestService().createIncoming(
        buildConnectionRequest({ consumerEndpoint: "https://red.com" }),
      );
      await expect(result).rejects.toHaveProperty(
        "message",
        "An instance cannot create an stream to itself.",
      );
    });
  });

  describe("sendConnectionRequest", () => {
    it("sends a connection request to the other instance", async () => {
      const connectionRequest = buildConnectionRequest({
        id: "1234",
        status: ConnectionRequestStatus.Created,
      });
      await buildConnectionRequestService().sendConnectionRequest(connectionRequest);
      expect(fakeExchangeService.sendConnectionRequest).toHaveBeenCalledWith(connectionRequest);
      expect(fakeRepository.updateStatus).toHaveBeenCalledWith(
        "1234",
        ConnectionRequestStatus.Pending,
      );
    });

    it("rejects sending pending requests", async () => {
      const connectionRequest = buildConnectionRequest({
        id: "1234",
        status: ConnectionRequestStatus.Pending,
      });
      const result = buildConnectionRequestService().sendConnectionRequest(connectionRequest);
      await expect(result).rejects.toHaveProperty(
        "message",
        "The connection request cannot be updated.",
      );
    });
  });

  describe("receiveProviderRejection", () => {
    it("updates the status of the request", async () => {
      await buildConnectionRequestService().receiveProviderRejection(
        buildConnectionRequest({ id: "1234", status: ConnectionRequestStatus.Pending }),
      );
      expect(fakeRepository.updateStatus).toHaveBeenCalledWith(
        "1234",
        ConnectionRequestStatus.Rejected,
      );
    });

    it("rejects updating already decided-upon requests", async () => {
      const result = buildConnectionRequestService().receiveProviderRejection(
        buildConnectionRequest({ id: "1234", status: ConnectionRequestStatus.Accepted }),
      );
      await expect(result).rejects.toHaveProperty(
        "message",
        "The connection request cannot be updated.",
      );
    });
  });

  describe("assertConnectionRequestUpdatable", () => {
    it("throws an error for accepted or rejected requests", async () => {
      const service = buildConnectionRequestService();
      for (const status of [ConnectionRequestStatus.Accepted, ConnectionRequestStatus.Rejected]) {
        const result = service.assertConnectionRequestUpdatable(buildConnectionRequest({ status }));
        await expect(result).rejects.toHaveProperty(
          "message",
          "The connection request cannot be updated.",
        );
      }
    });
  });
});
