import "jest-dom/extend-expect";

import React from "react";
import {
  fireEvent,
  render,
  wait,
  waitForElement,
  waitForElementToBeRemoved,
} from "react-testing-library";

import { buildFormat } from "../../../test-support/factories";
import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import Formats from "./Formats";

jest.mock("../../services/aws-service");

describe("<Formats />", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders a list with formats", async () => {
    (AWSService.retrieveFormats as jest.Mock).mockResolvedValueOnce([
      buildFormat({ name: "xAPI", description: "The first description" }),
      buildFormat({ name: "Caliper", description: "The second description" }),
    ]);

    const { getByText } = renderWithRouter(<Formats />, {
      route: "/formats",
    });

    getByText("Formats");

    await wait(() => {
      getByText("Create New Format");

      getByText("xAPI");
      getByText("The first description");
      expect(document.querySelector("a[href*='formats/xAPI/edit']")).toBeTruthy();

      getByText("Caliper");
      getByText("The second description");
      expect(document.querySelector("a[href*='formats/Caliper/edit']")).toBeTruthy();
    });
  });

  it("allows user to delete a format", async () => {
    (AWSService.retrieveFormats as jest.Mock).mockResolvedValue([
      buildFormat({ name: "xAPI", description: "The first description" }),
      buildFormat({ name: "Caliper", description: "The second description" }),
    ]);

    const { getByText, getAllByText, getByRole } = renderWithRouter(<Formats />, {
      route: "/formats",
    });
    await waitForElement(() => getAllByText("Delete"));

    fireEvent.click(getAllByText("Delete")[0]);
    await waitForElement(() => getByRole("dialog"));
    fireEvent.click(getByText("Confirm"));
    await waitForElementToBeRemoved(() => getByRole("dialog"));
    expect(AWSService.deleteFormat).toHaveBeenCalledTimes(1);
    expect(AWSService.deleteFormat).toHaveBeenCalledWith("xAPI");
  });
});
