import "@testing-library/jest-dom/extend-expect";

import { fireEvent, wait } from "@testing-library/react";
import React from "react";
import { act } from "react-dom/test-utils";

import * as factories from "../../../test-support/factories";
import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import Notifications from "./Notifications";

describe("<Notifications/>", () => {
  beforeAll(() => {
    AWSService.retrieveSQSIntegrationNotifications = jest
      .fn()
      .mockReturnValue(factories.sqsIntegrationNotifications());
    AWSService.deleteSQSIntegrationNotification = jest.fn();
  });

  it("renders title and notifications in the list", async () => {
    const { getByText } = renderWithRouter(<Notifications />, {
      route: "/sqs-integration/notifications",
    });

    getByText("Notifications");
    await wait(() => {
      getByText("7/4/2019, 7:38:39 AM");
      getByText("Error detected in queue 'ssdn-test-queue'");
      getByText("First SQS error");
      getByText("arn:aws:sqs:us-east-1:111111111111:ssdn-test-queue");
      getByText("7/7/2019, 6:55:08 AM");
      getByText("Error detected in queue 'ssdn-another-queue'");
      getByText("Second SQS error");
      getByText("arn:aws:sqs:us-east-1:111111111111:ssdn-another-queue");
    });
  });

  it("handles the details modal dialog", async () => {
    const { getByText, getAllByText } = renderWithRouter(<Notifications />, {
      route: "/sqs-integration/notifications",
    });

    await wait(() => {
      fireEvent.click(getAllByText("Details")[0]);

      getByText("Notification Details");
      getByText("Error: Test SQS error at SQSMessageService.process (/var/task/index.js:72699:13)");
    });

    fireEvent.click(getAllByText("Close")[1]);
  });

  it("handles the delete modal dialog", async () => {
    const { getByText, getAllByText } = renderWithRouter(<Notifications />, {
      route: "/sqs-integration/notifications",
    });

    await wait(() => {
      fireEvent.click(getAllByText("Delete")[0]);
      getByText(
        "Are you sure you want to delete notification 'Error detected in queue 'ssdn-test-queue''?",
      );

      act(() => {
        fireEvent.click(getByText("Confirm"));
      });
    });

    expect(AWSService.deleteSQSIntegrationNotification).toHaveBeenCalled();
  });
});
