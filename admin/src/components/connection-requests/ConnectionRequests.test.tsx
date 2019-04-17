import "jest-dom/extend-expect";
import React from "react";
import { fireEvent, render, wait } from "react-testing-library";
import { mocked } from "ts-jest";
import * as factories from "../../../test-support/factories";
import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import ConnectionRequests from "./ConnectionRequests";

/* FIXME: The nasty warning about test not wrapped in act(...) should go away when this is resolved:
 *        https://github.com/facebook/react/issues/14769
 */
describe("<ConnectionRequests />", () => {
  const props = {
    description: "This is the requests section",
    title: "Connection Requests",
    type: "consumer",
  };

  beforeAll(() => {
    AWSService.retrieveConnectionRequests = jest
      .fn()
      .mockReturnValue(factories.connectionRequests());
    AWSService.saveConnectionRequest = jest.fn();
  });

  it("renders title and requests in the list", async () => {
    const { getByText } = render(<ConnectionRequests {...props} />);

    getByText("Connection Requests");
    await wait(() => {
      getByText("Adam");
      getByText("Mitchell");
      getByText("Stoltenberg-Harvey");
      getByText("2/13/2019");
      getByText("test-user-1@example.org");
      getByText("Accepted");

      getByText("Mickey");
      getByText("Smith");
      getByText("Heaney, Hackett and Jacobson");
      getByText("4/14/2019");
      getByText("test-user-2@example.org");
      getByText("Rejected");
    });
  });

  it("renders the buttons for providers", async () => {
    const { getByText, queryByText } = renderWithRouter(
      <ConnectionRequests {...props} type="provider" />,
      {
        route: "/providers",
      },
    );

    await wait(() => {
      getByText("Create New Connection");
      getByText("View info");
      expect(queryByText("Accept")).not.toBeInTheDocument();
      expect(queryByText("Reject")).not.toBeInTheDocument();
    });
  });

  it("renders the buttons for consumers", async () => {
    const { getByText, queryByText } = render(<ConnectionRequests {...props} />);

    await wait(() => {
      getByText("View info");
      getByText("Accept");
      getByText("Reject");
      expect(queryByText("Create New Connection")).not.toBeInTheDocument();
    });
  });

  it("handles the accept and reject actions", async () => {
    const { getByText } = render(<ConnectionRequests {...props} />);

    await wait(() => {
      fireEvent.click(getByText("Accept"));
      fireEvent.click(getByText("Reject"));
    });

    expect(mocked(AWSService.saveConnectionRequest).mock.calls.length).toEqual(2);
  });
});
