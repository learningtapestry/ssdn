import React from "react";

import { buildFormat } from "../../../test-support/factories";
import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import FileTransfersHome from "./FileTransfersHome";

describe("<FileTransfersHome />", () => {
  beforeAll(() => {
    AWSService.retrieveFormats = jest
      .fn()
      .mockResolvedValue([buildFormat({ name: "Caliper" }), buildFormat({ name: "S3" })]);
  });

  it("renders the left menu", async () => {
    const { getAllByText, getByText } = renderWithRouter(<FileTransfersHome />, {
      route: "/file-transfers",
    });
    getAllByText("Generate Upload Credentials");
    getByText("Notifications");
    getByText("Programmatic Access");
  });

  it("redirects to the upload credentials form", async () => {
    const { getByText } = renderWithRouter(<FileTransfersHome />, {
      route: "/file-transfers",
    });
    getByText(
      "Here you can generate temporary AWS credentials that will allow you to upload and share " +
        "files with other SSDN instances.",
    );
  });
});
