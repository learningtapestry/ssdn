import "jest-dom/extend-expect";

import React from "react";
import { fireEvent, render, wait, waitForElement } from "react-testing-library";

import AWSService from "../../services/aws-service";
import CreateFormat from "./CreateFormat";

jest.mock("../../services/aws-service");

describe("<CreateFormat />", () => {
  it("allows one to create a format", async () => {
    const { getByText, getByLabelText, getByRole } = render(<CreateFormat />);

    getByText("Create Format");

    fireEvent.change(getByLabelText("Name"), {
      target: { value: "xAPI" },
    });

    fireEvent.change(getByLabelText("Description"), {
      target: { value: "xAPI description" },
    });

    fireEvent.click(getByText("Submit"));
    await waitForElement(() => getByRole("alert"));
    await getByText("The format has been created successfully.");
    expect(AWSService.createFormat).toHaveBeenCalledWith({
      description: "xAPI description",
      name: "xAPI",
    });
  });

  it("validates required fields", async () => {
    const { getByText } = render(<CreateFormat />);

    getByText("Create Format");

    fireEvent.click(getByText("Submit"));

    await wait(() => {
      getByText("name is a required field");
    });
  });
});
