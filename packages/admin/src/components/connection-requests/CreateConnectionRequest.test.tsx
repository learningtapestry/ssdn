import "jest-dom/extend-expect";
import React from "react";
import { fireEvent, render, wait, waitForElement } from "react-testing-library";
import * as factories from "../../../test-support/factories";
import AWSService from "../../services/aws-service";
import ConsumerRequestService from "../../services/consumer-request-service";
import CreateConnectionRequest from "./CreateConnectionRequest";

describe("<CreateConnectionRequest/>", () => {
  beforeAll(() => {
    AWSService.saveConnectionRequest = jest.fn();
    ConsumerRequestService.register = jest.fn();
  });

  it("renders title and connection request form", () => {
    const { getByText, getByLabelText } = render(<CreateConnectionRequest />);

    getByText("Data Provider Request Form");
    getByLabelText("Endpoint URL");
    getByLabelText("First Name");
    getByLabelText("Last Name");
    getByLabelText("Organization");
    getByLabelText("Title");
    getByLabelText("Email");
    getByLabelText("Phone Number");
    getByLabelText("Extension");
  });

  it("validates the entered values and displays error messages", async () => {
    const { getByText } = render(<CreateConnectionRequest />);

    fireEvent.click(getByText("Send"));

    await wait(() => {
      getByText("endpoint is a required field");
      getByText("firstName is a required field");
      getByText("lastName is a required field");
      getByText("organization is a required field");
      getByText("title is a required field");
      getByText("email is a required field");
      getByText("phoneNumber is a required field");
    });
  });

  it("submits a valid form and displays verification code", async () => {
    const { getByText, getByLabelText, getByRole } = render(<CreateConnectionRequest />);

    const request = factories.connectionRequests()[0];
    fireEvent.change(getByLabelText("Endpoint URL"), { target: { value: request.endpoint } });
    fireEvent.change(getByLabelText("First Name"), { target: { value: request.firstName } });
    fireEvent.change(getByLabelText("Last Name"), { target: { value: request.lastName } });
    fireEvent.change(getByLabelText("Organization"), { target: { value: request.organization } });
    fireEvent.change(getByLabelText("Title"), { target: { value: request.title } });
    fireEvent.change(getByLabelText("Email"), { target: { value: request.email } });
    fireEvent.change(getByLabelText("Phone Number"), { target: { value: request.phoneNumber } });
    fireEvent.click(getByText("Send"));

    await waitForElement(() => getByRole("dialog"));
    expect(ConsumerRequestService.register).toHaveBeenCalled();
    expect(AWSService.saveConnectionRequest).toHaveBeenCalled();
  });
});
