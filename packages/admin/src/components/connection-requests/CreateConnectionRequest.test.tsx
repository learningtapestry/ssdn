import "@testing-library/jest-dom/extend-expect";

import React from "react";

import { fireEvent, render, wait, waitForElement } from "@testing-library/react";

import * as factories from "../../../test-support/factories";
import { nullConnectionRequest } from "../../app-helper";
import { Format } from "../../interfaces/format";
import AWSService from "../../services/aws-service";
import CreateConnectionRequest from "./CreateConnectionRequest";

describe("<CreateConnectionRequest/>", () => {
  beforeAll(() => {
    AWSService.saveConnectionRequest = jest.fn(async () => nullConnectionRequest());
    AWSService.retrieveFormats = jest.fn(async () => [{ name: "xAPI" } as Format]);
  });

  it("renders title and connection request form", async () => {
    const { getByText, getByLabelText } = render(<CreateConnectionRequest />);

    await wait(() => getByText("xAPI"));
    getByText("Data Provider Request Form");
    getByLabelText("Endpoint URL");
    getByLabelText("Organization");
    getByLabelText("Namespace");
    getByText("Formats");
  });

  it("validates the entered values and displays error messages", async () => {
    const { getByText } = render(<CreateConnectionRequest />);

    fireEvent.click(getByText("Send"));

    await wait(() => {
      getByText("providerEndpoint is a required field");
      getByText("organization is a required field");
      getByText("formats field must have at least 1 items");
    });
  });

  it("submits a valid form and displays verification code", async () => {
    const { getByText, getByLabelText, getByRole } = render(<CreateConnectionRequest />);

    const request = factories.connectionRequests()[0];
    fireEvent.change(getByLabelText("Endpoint URL"), {
      target: { value: request.providerEndpoint },
    });
    fireEvent.change(getByLabelText("Organization"), { target: { value: request.organization } });
    await wait(() => getByText("xAPI"));
    fireEvent.click(getByText("xAPI"));
    fireEvent.click(getByText("Send"));

    // @ts-ignore
    await waitForElement(() => getByRole("dialog", { hidden: true }));
    expect(AWSService.saveConnectionRequest).toHaveBeenCalled();
  });
});
