import "@testing-library/jest-dom/extend-expect";

import React from "react";

import { act, fireEvent, wait } from "@testing-library/react";

import * as factories from "../../../test-support/factories";
import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import Users from "./Users";

describe("<Users/>", () => {
  beforeAll(() => {
    AWSService.retrieveUsers = jest.fn().mockReturnValue(factories.users());
    AWSService.deleteUser = jest.fn();
  });

  it("renders title and users in the list", async () => {
    const { getByText, queryByText } = renderWithRouter(<Users />, { route: "/users" });

    getByText("Users");
    await wait(() => {
      getByText("test-user-1");
      queryByText("4/5/2019");
      getByText("test-user-1@example.org");
      getByText("Test User 1");
      getByText("+1555555555");
      getByText("CONFIRMED");
      getByText("test-user-2");
      queryByText("4/8/2019");
      getByText("test-user-2@example.org");
      getByText("Test User 2");
      getByText("+1666666666");
      getByText("FORCE_CHANGE_PASSWORD");
    });
  });

  it("handles the delete modal dialog", async () => {
    const { getAllByText, getByText } = renderWithRouter(<Users />, { route: "/users" });

    await wait(() => {
      fireEvent.click(getAllByText("Delete")[0]);
      getByText("Are you sure you want to delete user 'test-user-1'?");
    });

    await act(async () => {
      fireEvent.click(getByText("Confirm"));
    });

    expect(AWSService.deleteUser).toHaveBeenCalled();
  });

  it("renders button to create user", async () => {
    const { getByText } = renderWithRouter(<Users />, { route: "/users" });

    await wait(() => {
      expect(getByText("Create New User")).toBeInTheDocument();
    });
  });
});
