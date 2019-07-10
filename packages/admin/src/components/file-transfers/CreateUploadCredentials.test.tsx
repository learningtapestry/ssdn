import "jest-dom/extend-expect";

import React from "react";
import { fireEvent, render, wait } from "react-testing-library";

import { buildFormat, uploadCredentials } from "../../../test-support/factories";
import AWSService from "../../services/aws-service";
import UploadCredentialsService from "../../services/upload-credentials-service";
import CreateUploadCredentials from "./CreateUploadCredentials";

describe("<CreateConnectionRequest/>", () => {
  beforeAll(() => {
    UploadCredentialsService.prototype.generate = jest
      .fn()
      .mockResolvedValue(uploadCredentials().credentials);

    AWSService.retrieveFormats = jest
      .fn()
      .mockResolvedValue([buildFormat({ name: "Caliper" }), buildFormat({ name: "S3" })]);
  });

  it("renders title and upload credentials form", () => {
    const { getByText, getByLabelText } = render(<CreateUploadCredentials />);

    getByText("Generate Upload Credentials");
    getByLabelText("Namespace");
    getByLabelText("Format");
  });

  it("validates the entered values and displays error messages", async () => {
    const { getByText, getByDisplayValue } = render(<CreateUploadCredentials />);

    await wait(() => getByDisplayValue("Caliper"));

    fireEvent.click(getByText("Caliper"));
    fireEvent.click(getByText("Generate"));

    await wait(() => {
      getByText("client is a required field");
    });
  });

  it("submits a valid form and displays generated credentials", async () => {
    const { getByText, getByLabelText, getByDisplayValue } = render(<CreateUploadCredentials />);

    await wait(() => getByDisplayValue("Caliper"));

    fireEvent.change(getByLabelText("Namespace"), {
      target: { value: "ssdn-test.learningtapestry.com/foo/bar" },
    });
    fireEvent.click(getByText("Generate"));

    await wait(() => {
      getByText("Your temporary S3 credentials have been generated successfully!");
      getByText("'ssdn-test.learningtapestry.com__foo__bar/xAPI'");
      getByText("Access Key ID");
      getByText("Secret Access Key");
      getByText("Session Token");
    });

    expect(UploadCredentialsService.prototype.generate).toHaveBeenCalled();
  });
});
