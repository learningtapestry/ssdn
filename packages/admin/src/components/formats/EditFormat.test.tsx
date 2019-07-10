import "@testing-library/jest-dom/extend-expect";

import React from "react";
import { Route } from "react-router";
import { fireEvent, wait, waitForElement } from "@testing-library/react";

import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import EditFormat from "./EditFormat";

jest.mock("../../services/aws-service");

describe("<EditFormat />", () => {
  it("allows one to edit a format", async () => {
    (AWSService.retrieveFormat as jest.Mock).mockResolvedValueOnce({
      description: "The description",
      name: "xAPI",
    });

    const App = () => <Route exact={true} path="/formats/:name/edit" component={EditFormat} />;

    const { getByText, getByDisplayValue, getByLabelText, getByRole } = renderWithRouter(<App />, {
      route: "/formats/xAPI/edit",
    });

    getByText("Edit Format");

    await wait(() => getByDisplayValue("xAPI"));
    expect(document.getElementById("name")!.getAttribute("disabled")).not.toBeNull();
    getByDisplayValue("The description");

    fireEvent.change(getByLabelText("Description"), {
      target: { value: "Fixed description" },
    });

    fireEvent.click(getByText("Submit"));
    await waitForElement(() => getByRole("alert"));
    await getByText("The format has been updated successfully.");
    expect(AWSService.updateFormat).toHaveBeenCalledWith({
      description: "Fixed description",
      name: "xAPI",
    });
  });
});
