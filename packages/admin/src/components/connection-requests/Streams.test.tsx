import "@testing-library/jest-dom/extend-expect";

import React from "react";

import {
  fireEvent,
  render,
  wait,
  waitForElement,
  waitForElementToBeRemoved,
} from "@testing-library/react";

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
        getByText("https://ssdn.adam.acme.org/");
        getByText("ssdn.adam.acme.org");
        getByText("Active");

        getByText("https://ssdn.jonah.acme.org/");
        getByText("ssdn.jonah.acme.org");
        getByText("Paused");

        getByText("https://ssdn.mickey.acme.org/");
        getByText("ssdn.mickey.acme.org");
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
        "https://ssdn.adam.acme.org/",
        "xAPI",
        "ssdn.adam.acme.org",
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
        "https://ssdn.jonah.acme.org/",
        "xAPI",
        "ssdn.jonah.acme.org",
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
