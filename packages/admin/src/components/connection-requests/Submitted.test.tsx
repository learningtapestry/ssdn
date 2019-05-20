import "jest-dom/extend-expect";

import React from "react";
import { fireEvent, wait, waitForElement, waitForElementToBeRemoved } from "react-testing-library";

import * as factories from "../../../test-support/factories";
import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import Submitted from "./Submitted";

/* FIXME: The nasty warning about test not wrapped in act(...) should go away when this is resolved:
 *        https://github.com/facebook/react/issues/14769
 */
describe("<Submitted />", () => {
  beforeAll(() => {
    AWSService.retrieveConnectionRequests = jest
      .fn()
      .mockReturnValue(factories.connectionRequests());
  });

  it("renders title and requests in the list", async () => {
    const { getByText, getAllByText, queryByText } = renderWithRouter(<Submitted />, {
      route: "/connections/requests/submitted",
    });

    getByText("Submitted Requests");
    await wait(() => {
      expect(getAllByText("https://nucleus.ajax.org")).toHaveLength(3);

      queryByText("2/13/2019");
      getByText("Accepted");

      queryByText("4/14/2019");
      getByText("Created");

      queryByText("4/14/2019");
      getByText("Rejected");
    });
  });

  it("renders the buttons for submitted", async () => {
    const { getAllByText } = renderWithRouter(<Submitted />, {
      route: "/connections/requests/submitted",
    });

    await wait(() => {
      getAllByText("Create New Connection");
      getAllByText("View info");
    });
  });

  it("handles the view detail action", async () => {
    const { getAllByText, getByRole } = renderWithRouter(<Submitted />, {
      route: "/connections/requests/submitted",
    });

    await waitForElement(() => getAllByText("View info"));
    fireEvent.click(getAllByText("View info")[0]);
    await waitForElement(() => getByRole("dialog"));
    fireEvent.click(getAllByText("Close")[0]);
    await waitForElementToBeRemoved(() => getByRole("dialog"));
  });
});
