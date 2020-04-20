import "@testing-library/jest-dom/extend-expect";

import React from "react";

import { fireEvent, wait } from "@testing-library/react";

import { act } from "react-dom/test-utils";
import * as factories from "../../../test-support/factories";
import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import Notifications from "./Notifications";

describe("<Notifications/>", () => {
  beforeAll(() => {
    AWSService.retrieveFileTransferNotifications = jest
      .fn()
      .mockReturnValue(factories.fileTransferNotifications());
    AWSService.deleteFileTransferNotification = jest.fn();
  });

  it("renders title and notifications in the list", async () => {
    const { getByText } = renderWithRouter(<Notifications />, {
      route: "/file-transfers/notifications",
    });

    getByText("Notifications");
    await wait(() => {
      getByText("Error");
      getByText("7/4/2019, 7:38:39 AM");
      getByText("This is a test message");
      getByText("Network error has occurred");
      getByText("example-bucket");
      getByText("ssdn-test.learningtapestry.com/xAPI/test.txt");
      getByText("Info");
      getByText("7/7/2019, 6:55:08 AM");
      getByText("This is another test message");
      getByText("File was successfully transferred");
      getByText("another-bucket");
      getByText("ssdn-test.learningtapestry.com/Caliper/file.pdf");
    });
  });

  it("handles the details modal dialog", async () => {
    const { getByText, getAllByText } = renderWithRouter(<Notifications />, {
      route: "/file-transfers/notifications",
    });

    await wait(() => {
      fireEvent.click(getByText("Details"));
      getByText("Notification Details");
      getByText("aws-service.ts:295 Uncaught (in promise) Error: An unexpected error occurred");
    });
    fireEvent.click(getAllByText("Close")[1]);
  });

  it("handles the delete modal dialog", async () => {
    const { getByText, getAllByText } = renderWithRouter(<Notifications />, {
      route: "/file-transfers/notifications",
    });

    await wait(() => {
      fireEvent.click(getAllByText("Delete")[0]);
      getByText("Are you sure you want to delete notification 'This is a test message'?");

      act(() => {
        fireEvent.click(getByText("Confirm"));
      });
    });

    expect(AWSService.deleteFileTransferNotification).toHaveBeenCalled();
  });
});
