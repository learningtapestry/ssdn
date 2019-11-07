import "@testing-library/jest-dom/extend-expect";
import { act, fireEvent, wait } from "@testing-library/react";
import React from "react";

import * as factories from "../../../test-support/factories";
import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import Queues from "./Queues";

describe("<SQSIntegration/>", () => {
  beforeAll(() => {
    AWSService.retrieveQueueMappings = jest.fn().mockReturnValue(factories.queueMappings());
    AWSService.retrieveQueues = jest.fn();
    AWSService.retrieveSQSIntegrationNamespace = jest.fn();
    AWSService.enableQueueMapping = jest.fn();
    AWSService.disableQueueMapping = jest.fn();
    AWSService.deleteQueueMapping = jest.fn();
  });

  it("renders title and active queue mappings in the list", async () => {
    const { getByText } = renderWithRouter(<Queues />, {
      route: "/sqs-integration",
    });

    getByText("Queues");
    await wait(() => {
      getByText("arn:aws:sqs:us-east-1:111111111111:ssdn-one-queue");
      getByText("10/2/2019, 7:25:18 PM");
      getByText("Enabled");
      getByText("arn:aws:sqs:us-east-1:111111111111:ssdn-another-queue");
      getByText("10/3/2019, 1:32:32 PM");
      getByText("Disabled");
    });
  });

  it("handles the delete modal dialog", async () => {
    const { getAllByText, getByText } = renderWithRouter(<Queues />, {
      route: "/sqs-integration",
    });

    await wait(() => {
      fireEvent.click(getAllByText("Delete")[0]);
      getByText(
        "Do you want to delete the integration with the queue 'arn:aws:sqs:us-east-1:111111111111:ssdn-one-queue'?",
      );
    });

    await act(async () => {
      fireEvent.click(getByText("Confirm"));
    });

    expect(AWSService.deleteQueueMapping).toHaveBeenCalledWith(
      "48aeaf30-abc6-4cc4-9bdf-9fc6d8f4f9ad",
    );
  });

  it("changes status of queue", async () => {
    const { getAllByText, getByText } = renderWithRouter(<Queues />, {
      route: "/sqs-integration",
    });

    await wait(() => {
      fireEvent.click(getByText("Enable"));
    });

    expect(AWSService.enableQueueMapping).toHaveBeenCalledWith(
      "3d865ff0-5949-4cd9-810c-f31a481f8b1a",
    );
  });

  it("renders action buttons", async () => {
    const { getByText } = renderWithRouter(<Queues />, { route: "/sqs-integration" });

    await wait(() => {
      getByText("Associate Queue");
    });
  });
});
