import React from "react";

import { wait } from "@testing-library/react";
import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import SQSIntegrationHome from "./SQSIntegrationHome";

describe("<SQSIntegrationHome />", () => {
  beforeAll(() => {
    AWSService.retrieveQueueMappings = jest.fn();
    AWSService.retrieveQueues = jest.fn();
    AWSService.retrieveSQSIntegrationNamespace = jest.fn();
  });

  it("renders the left menu", async () => {
    const { getAllByText, getByText } = renderWithRouter(<SQSIntegrationHome />, {
      route: "/sqs-integration",
    });

    await wait(() => {
      getAllByText("Queues");
      getByText("Notifications");
    });
  });

  it("redirects to the queues section", async () => {
    const { getByText } = renderWithRouter(<SQSIntegrationHome />, {
      route: "/sqs-integration",
    });

    await wait(() => {
      getByText("Your SSDN instance is not currently associated with any SQS queue.");
    });
  });
});
