import { buildConnectionRequest } from "../../../test-support/factories";
import { buildApiProxyHandlerEvent, fakeImpl, mocked } from "../../../test-support/jest-helper";
import DynamoConnectionRequestRepository from "../../repositories/dynamo-connection-request-repository";
import { getConnectionRequestRepository } from "../../services";
import { handler } from "./";

jest.mock("../../services");

const fakeConnectionRequestRepo = fakeImpl<DynamoConnectionRequestRepository>({
  get: jest.fn((id) =>
    id === "1"
      ? Promise.resolve(buildConnectionRequest({ id: "1", acceptanceToken: "Test" }))
      : Promise.reject(),
  ),
});

mocked(getConnectionRequestRepository).mockImplementation(() => fakeConnectionRequestRepo);

describe("ConnectionRequestVerifyFunction", () => {
  it("verifies authorization, rejects unauthorized", async () => {
    const response = handler(
      buildApiProxyHandlerEvent()
        .path({ id: "1" })
        .headers({ Authorization: "Bearer Fail" })
        .build(),
    );
    await expect(response).resolves.toEqual({
      body: JSON.stringify({
        errors: [
          {
            detail: "The authorization token could not be validated.",
            status: "403",
            title: "SSDNError",
          },
        ],
      }),
      statusCode: 403,
    });
  });

  it("verifies authorization, accepts authorized", async () => {
    const response = handler(
      buildApiProxyHandlerEvent()
        .path({ id: "1" })
        .headers({ Authorization: "Bearer Test" })
        .build(),
    );
    await expect(response).resolves.toEqual({
      body: "",
      statusCode: 200,
    });
  });
});
