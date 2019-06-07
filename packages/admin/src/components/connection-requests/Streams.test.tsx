import "jest-dom/extend-expect";

import React from "react";
import {
  fireEvent,
  render,
  wait,
  waitForElement,
  waitForElementToBeRemoved,
} from "react-testing-library";

import * as factories from "../../../test-support/factories";
import AWSService from "../../services/aws-service";
import Streams from "./Streams";

/* FIXME: The nasty warning about test not wrapped in act(...) should go away when this is resolved:
 *        https://github.com/facebook/react/issues/14769
 */
describe("<Streams />", () => {
  describe("consumers", () => {
    beforeAll(() => {
      AWSService.retrieveStreams = jest.fn().mockReturnValue(factories.outputStreams());
      AWSService.updateStream = jest.fn();
    });

    beforeEach(() => {
      (AWSService.updateStream as any).mockClear();
    });

    it("renders title and requests in the list", async () => {
      const { getByText } = render(<Streams streamType="output" />);

      getByText("Consumer Streams");
      await wait(() => {
        getByText("https://nucleus.adam.acme.org/");
        getByText("nucleus.adam.acme.org");
        getByText("Active");

        getByText("https://nucleus.jonah.acme.org/");
        getByText("nucleus.jonah.acme.org");
        getByText("Paused");

        getByText("https://nucleus.mickey.acme.org/");
        getByText("nucleus.mickey.acme.org");
        getByText("Paused (External)");
      });
    });

    it("renders the buttons for incoming", async () => {
      const { getByText } = render(<Streams streamType="output" />);

      await wait(() => {
        getByText("Pause");
        getByText("Resume");
      });
    });

    it("handles the pause action", async () => {
      const { getByText, getByRole } = render(<Streams streamType="output" />);
      await waitForElement(() => getByText("Pause"));
      fireEvent.click(getByText("Pause"));
      await waitForElement(() => getByRole("dialog"));
      fireEvent.click(getByText("Confirm"));
      await waitForElementToBeRemoved(() => getByRole("dialog"));
      expect(AWSService.updateStream).toHaveBeenCalledTimes(1);
      expect(AWSService.updateStream).toHaveBeenCalledWith(
        "https://nucleus.adam.acme.org/",
        "xAPI",
        "nucleus.adam.acme.org",
        "paused",
        "output",
      );
    });

    it("handles the resume action", async () => {
      const { getByText, getByRole } = render(<Streams streamType="output" />);
      await waitForElement(() => getByText("Resume"));
      fireEvent.click(getByText("Resume"));
      await waitForElement(() => getByRole("dialog"));
      fireEvent.click(getByText("Confirm"));
      await waitForElementToBeRemoved(() => getByRole("dialog"));
      expect(AWSService.updateStream).toHaveBeenCalledTimes(1);
      expect(AWSService.updateStream).toHaveBeenCalledWith(
        "https://nucleus.jonah.acme.org/",
        "xAPI",
        "nucleus.jonah.acme.org",
        "active",
        "output",
      );
    });
  });

  describe("providers", () => {
    beforeAll(() => {
      AWSService.retrieveStreams = jest.fn().mockReturnValue(factories.inputStreams());
      AWSService.updateStream = jest.fn();
    });

    beforeEach(() => {
      (AWSService.updateStream as any).mockClear();
    });

    it("renders title and requests in the list", async () => {
      const { getByText } = render(<Streams streamType="input" />);

      getByText("Provider Streams");
    });
  });
});
