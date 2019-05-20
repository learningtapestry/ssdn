import "jest-dom/extend-expect";

import React from "react";
import { fireEvent, render, wait, waitForElement } from "react-testing-library";

import * as factories from "../../../test-support/factories";
import { nullConnectionRequest } from "../../app-helper";
import AWSService from "../../services/aws-service";
import CreateConnectionRequest from "./CreateConnectionRequest";

describe("<CreateConnectionRequest/>", () => {
  beforeAll(() => {
    AWSService.saveConnectionRequest = jest.fn(async () => nullConnectionRequest());
  });

  it("renders title and connection request form", () => {
    const { getByText, getByLabelText } = render(<CreateConnectionRequest />);

    getByText("Data Provider Request Form");
    getByLabelText("Endpoint URL");
    getByLabelText("Organization");
  });

  it("validates the entered values and displays error messages", async () => {
    const { getByText } = render(<CreateConnectionRequest />);

    fireEvent.click(getByText("Send"));

    await wait(() => {
      getByText("providerEndpoint is a required field");
      getByText("organization is a required field");
    });
  });

  it("submits a valid form and displays verification code", async () => {
    const { getByText, getByLabelText, getByRole } = render(<CreateConnectionRequest />);

    const request = factories.connectionRequests()[0];
    fireEvent.change(getByLabelText("Endpoint URL"), {
      target: { value: request.providerEndpoint },
    });
    fireEvent.change(getByLabelText("Organization"), { target: { value: request.organization } });
    fireEvent.click(getByText("Send"));

    await waitForElement(() => getByRole("dialog"));
    expect(AWSService.saveConnectionRequest).toHaveBeenCalled();
  });
});
