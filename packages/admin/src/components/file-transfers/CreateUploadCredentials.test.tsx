import "jest-dom/extend-expect";
import React from "react";
import { fireEvent, render, wait } from "react-testing-library";
import { uploadCredentials } from "../../../test-support/factories";
import UploadCredentialsService from "../../services/upload-credentials-service";
import CreateUploadCredentials from "./CreateUploadCredentials";

describe("<CreateConnectionRequest/>", () => {
  beforeAll(() => {
    UploadCredentialsService.prototype.generate = jest
      .fn()
      .mockResolvedValue(uploadCredentials().credentials);
  });

  it("renders title and upload credentials form", () => {
    const { getByText, getByLabelText } = render(<CreateUploadCredentials />);

    getByText("Generate Upload Credentials");
    getByLabelText("Client");
    getByLabelText("Format");
  });

  it("validates the entered values and displays error messages", async () => {
    const { getByText } = render(<CreateUploadCredentials />);

    fireEvent.click(getByText("Caliper"));
    fireEvent.click(getByText("Generate"));

    await wait(() => {
      getByText("client is a required field");
    });
  });

  it("submits a valid form and displays generated credentials", async () => {
    const { getByText, getByLabelText } = render(<CreateUploadCredentials />);

    fireEvent.change(getByLabelText("Client"), {
      target: { value: "learning-tapestry-test" },
    });
    fireEvent.click(getByText("Generate"));

    await wait(() => {
      getByText("Your temporary S3 credentials have been generated successfully!");
      getByText("'learning-tapestry-test/xAPI'");
      getByText("Access Key ID");
      getByText("Secret Access Key");
      getByText("Session Token");
    });

    expect(UploadCredentialsService.prototype.generate).toHaveBeenCalled();
  });
});
