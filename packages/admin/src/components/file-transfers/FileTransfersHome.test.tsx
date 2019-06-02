import React from "react";
import { renderWithRouter } from "../../../test-support/test-helper";
import FileTransfersHome from "./FileTransfersHome";

describe("<FileTransfersHome />", () => {
  it("renders the left menu", async () => {
    const { getAllByText, getByText } = renderWithRouter(<FileTransfersHome />, {
      route: "/file-transfers",
    });
    getAllByText("Generate Upload Credentials");
    getByText("Notifications");
    getByText("Manage Schema Descriptions");
  });

  it("redirects to the upload credentials form", async () => {
    const { getByText } = renderWithRouter(<FileTransfersHome />, {
      route: "/file-transfers",
    });
    getByText(
      "Here you can generate temporary AWS credentials that will allow you to upload and share " +
        "files with other Nucleus instances.",
    );
  });
});
