import React from "react";
import { wait } from "react-testing-library";
import { renderWithRouter } from "../../../test-support/test-helper";
import UploadCredentialsService from "../../services/upload-credentials-service";
import ProgrammaticAccess from "./ProgrammaticAccess";

describe("<ProgrammaticAccess />", () => {
  beforeAll(() => {
    UploadCredentialsService.prototype.endpoint = jest
      .fn()
      .mockResolvedValue("http://ssdn.example.org/upload-credentials");
    UploadCredentialsService.prototype.apiKey = jest.fn().mockResolvedValue("TEST-API-KEY");
  });

  it("renders the title and dynamic variables", async () => {
    const { getByText } = renderWithRouter(<ProgrammaticAccess />);

    getByText("Programmatic Access");
    await wait(() => {
      getByText("http://ssdn.example.org/upload-credentials");
      getByText("TEST-API-KEY");
    });
  });

  it("renders the code snippets", () => {
    const { getByText } = renderWithRouter(<ProgrammaticAccess />);

    getByText("Using cURL");
    getByText("Using HTTPie");
    getByText("Using Node");
  });
});
