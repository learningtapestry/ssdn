import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, wait } from "@testing-library/react";
import React from "react";

import * as factories from "../../../test-support/factories";
import AWSService from "../../services/aws-service";
import AssociateQueue from "./AssociateQueue";

describe("<AssociateQueue/>", () => {
  const props = {
    onAssociationCreated: jest.fn(),
    onClose: jest.fn(),
    queueMappings: Array(factories.queueMappings()[0]),
    show: true,
  };

  beforeAll(() => {
    AWSService.retrieveQueues = jest.fn().mockReturnValue(factories.queueArns());
    AWSService.createQueueMapping = jest.fn();
  });

  it("renders a select input with the available queues", async () => {
    const { getByText } = render(<AssociateQueue {...props} queueMappings={[]} />);

    await wait(() => {
      getByText("arn:aws:sqs:us-east-1:111111111111:ssdn-one-queue");
      getByText("arn:aws:sqs:us-east-1:111111111111:ssdn-another-queue");
    });
  });

  it("renders an empty input select when all queues are associated", async () => {
    const { queryByText } = render(
      <AssociateQueue {...props} queueMappings={factories.queueMappings()} />,
    );

    await wait(() => {
      expect(
        queryByText("arn:aws:sqs:us-east-1:111111111111:ssdn-one-queue"),
      ).not.toBeInTheDocument();
      expect(
        queryByText("arn:aws:sqs:us-east-1:111111111111:ssdn-another-queue"),
      ).not.toBeInTheDocument();
    });
  });

  it("associates a queue with the lambda function", async () => {
    const { getByText } = render(<AssociateQueue {...props} />);

    await wait(() => {
      fireEvent.click(getByText("Confirm"));

      expect(AWSService.createQueueMapping).toHaveBeenCalledWith(
        "arn:aws:sqs:us-east-1:111111111111:ssdn-another-queue",
      );
      expect(props.onAssociationCreated).toHaveBeenCalled();
    });
  });

  it("changes input type when queue is external", async () => {
    const { getByLabelText, getByPlaceholderText } = render(<AssociateQueue {...props} />);

    await wait(() => {
      fireEvent.click(getByLabelText("Queue resides in external AWS account?"));

      getByPlaceholderText("Enter the ARN of the queue");
    });
  });

  it("displays the error message when it happens", async () => {
    AWSService.createQueueMapping = jest.fn().mockImplementation(() => {
      throw Error("Test Error");
    });
    const { getByText } = render(<AssociateQueue {...props} />);

    await wait(() => {
      fireEvent.click(getByText("Confirm"));

      getByText("Test Error");
    });
  });
});
