import { buildApiProxyHandlerEvent, mocked } from "../../../test-support/jest-helper";
import { getConnectionRequestRepository, getConnectionRequestService } from "../../services";
import { handler } from "./";

jest.mock("../../services");

const fakeConnectionRequestRepository = {
  get: jest.fn((id: string) => Promise.resolve({ id })),
};

const fakeConnectionRequestService = {
  sendConnectionRequest: jest.fn(() => Promise.resolve()),
};

mocked(getConnectionRequestRepository).mockImplementation(() => fakeConnectionRequestRepository);
mocked(getConnectionRequestService).mockImplementation(() => fakeConnectionRequestService);

describe("ConnectionRequestSendFunction", () => {
  it("sends a connection request", async () => {
    const response = await handler(
      buildApiProxyHandlerEvent()
        .path({
          id: "1",
        })
        .build(),
    );

    expect(response).toEqual({
      body: "",
      statusCode: 200,
    });

    expect(fakeConnectionRequestRepository.get).toHaveBeenCalledWith("1");
    expect(fakeConnectionRequestService.sendConnectionRequest).toHaveBeenCalledWith({
      id: "1",
    });
  });
});
