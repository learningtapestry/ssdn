import "jest-dom/extend-expect";

import React from "react";
import {
  fireEvent,
  render,
  wait,
  waitForElement,
  waitForElementToBeRemoved,
} from "react-testing-library";

import * as factories from "../../../test-support/factories";
import { nullConnectionRequest } from "../../app-helper";
import AWSService from "../../services/aws-service";
import Incoming from "./Incoming";

/* FIXME: The nasty warning about test not wrapped in act(...) should go away when this is resolved:
 *        https://github.com/facebook/react/issues/14769
 */
describe("<Incoming />", () => {
  beforeAll(() => {
    AWSService.retrieveConnectionRequests = jest
      .fn()
      .mockReturnValue(factories.connectionRequests());
    AWSService.acceptConnectionRequest = jest.fn().mockReturnValue(() => nullConnectionRequest());
  });

  beforeEach(() => {
    (AWSService.acceptConnectionRequest as any).mockClear();
  });

  it("renders title and requests in the list", async () => {
    const { getByText, queryByText } = render(<Incoming />);

    getByText("Incoming Requests");
    await wait(() => {
      getByText("https://nucleus.adam.acme.org/");
      getByText("Stoltenberg-Harvey");
      queryByText("2/13/2019");
      getByText("Accepted");

      getByText("https://nucleus.jonah.acme.org/");
      getByText("Disney");
      queryByText("4/14/2019");
      getByText("Created");

      getByText("https://nucleus.mickey.acme.org/");
      getByText("Heaney, Hackett and Jacobson");
      queryByText("4/14/2019");
      getByText("Rejected");
    });
  });

  it("renders the buttons for incoming", async () => {
    const { getAllByText } = render(<Incoming />);

    await wait(() => {
      getAllByText("View info");
      getAllByText("Accept");
      getAllByText("Reject");
    });
  });

  it("handles the accept action", async () => {
    const { getByText, getAllByText, getByRole, getByPlaceholderText } = render(<Incoming />);
    await waitForElement(() => getAllByText("Accept"));
    fireEvent.click(getAllByText("Accept")[0]);
    await waitForElement(() => getByRole("dialog"));
    fireEvent.change(getByPlaceholderText("Verification Code"), {
      target: { value: "VerifyJonah" },
    });
    fireEvent.click(getByText("Confirm"));
    await waitForElementToBeRemoved(() => getByRole("dialog"));
    expect(AWSService.acceptConnectionRequest).toHaveBeenCalledTimes(1);
    expect(AWSService.acceptConnectionRequest).toHaveBeenCalledWith(
      "https://nucleus.jonah.acme.org/",
      "ConnReqIdJonah",
      true,
    );
  });

  it("handles the reject action", async () => {
    const { getByText, getAllByText, getByRole } = render(<Incoming />);
    await waitForElement(() => getAllByText("Reject"));
    fireEvent.click(getAllByText("Reject")[0]);
    await waitForElement(() => getByRole("dialog"));
    fireEvent.click(getByText("Confirm"));
    await waitForElementToBeRemoved(() => getByRole("dialog"));
    expect(AWSService.acceptConnectionRequest).toHaveBeenCalledTimes(1);
    expect(AWSService.acceptConnectionRequest).toHaveBeenCalledWith(
      "https://nucleus.jonah.acme.org/",
      "ConnReqIdJonah",
      false,
    );
  });

  it("handles the view detail action", async () => {
    const { getAllByText, getByRole } = render(<Incoming />);
    await waitForElement(() => getAllByText("View info"));
    fireEvent.click(getAllByText("View info")[0]);
    await waitForElement(() => getByRole("dialog"));
    fireEvent.click(getAllByText("Close")[0]);
    await waitForElementToBeRemoved(() => getByRole("dialog"));
  });
});
