import "@testing-library/jest-dom/extend-expect";

import React from "react";

import {
  fireEvent,
  render,
  wait,
  waitForElement,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import * as factories from "../../../test-support/factories";
import { nullConnectionRequest } from "../../app-helper";
import AWSService from "../../services/aws-service";
import Incoming, { acceptTermsMessage } from "./Incoming";

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
      getByText("https://ssdn.adam.acme.org/");
      getByText("Stoltenberg-Harvey");
      queryByText("2/13/2019");
      getByText("Accepted");

      getByText("https://ssdn.jonah.acme.org/");
      getByText("Disney");
      queryByText("4/14/2019");
      getByText("Created");

      getByText("https://ssdn.mickey.acme.org/");
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
    const { getByText, getByLabelText, getAllByText, getByRole, getByPlaceholderText } = render(
      <Incoming />,
    );
    await waitForElement(() => getAllByText("Accept"));
    fireEvent.click(getAllByText("Accept")[0]);
    await waitForElement(() => getByRole("dialog", { hidden: true }));
    fireEvent.change(getByPlaceholderText("Verification Code"), {
      target: { value: "VerifyJonah" },
    });
    fireEvent.click(getByLabelText(acceptTermsMessage));
    fireEvent.click(getByText("Confirm"));
    await waitForElementToBeRemoved(() => getByRole("dialog", { hidden: true }));
    expect(AWSService.acceptConnectionRequest).toHaveBeenCalledTimes(1);
    expect(AWSService.acceptConnectionRequest).toHaveBeenCalledWith(
      "https://ssdn.jonah.acme.org/",
      "ConnReqIdJonah",
      true,
    );
  });

  it("prevents submission if terms are not accepted", async () => {
    const { getByText, getAllByText, getByRole } = render(<Incoming />);

    await waitForElement(() => getAllByText("Accept"));
    fireEvent.click(getAllByText("Accept")[0]);
    await waitForElement(() => getByRole("dialog", { hidden: true }));
    fireEvent.click(getByText("Confirm"));

    await waitForElement(() => getByText("You must agree before accepting this request."));
  });

  it("handles the reject action", async () => {
    const { getByText, getAllByText, getByRole } = render(<Incoming />);
    await waitForElement(() => getAllByText("Reject"));
    fireEvent.click(getAllByText("Reject")[0]);
    await waitForElement(() => getByRole("dialog", { hidden: true }));
    fireEvent.click(getByText("Confirm"));
    await waitForElementToBeRemoved(() => getByRole("dialog", { hidden: true }));
    expect(AWSService.acceptConnectionRequest).toHaveBeenCalledTimes(1);
    expect(AWSService.acceptConnectionRequest).toHaveBeenCalledWith(
      "https://ssdn.jonah.acme.org/",
      "ConnReqIdJonah",
      false,
    );
  });

  it("handles the view detail action", async () => {
    const { getAllByText, getByRole } = render(<Incoming />);
    await waitForElement(() => getAllByText("View info"));
    fireEvent.click(getAllByText("View info")[0]);
    await waitForElement(() => getByRole("dialog", { hidden: true }));
    fireEvent.click(getAllByText("Close")[0]);
    await waitForElementToBeRemoved(() => getByRole("dialog", { hidden: true }));
  });
});
