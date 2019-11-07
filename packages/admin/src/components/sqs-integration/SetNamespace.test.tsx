import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, wait } from "@testing-library/react";
import React from "react";

import AWSService from "../../services/aws-service";
import SetNamespace from "./SetNamespace";

describe("<SetNamespace/>", () => {
  const props = {
    onClose: jest.fn(),
    onNamespaceSaved: jest.fn(),
    show: true,
  };

  beforeAll(() => {
    AWSService.retrieveSQSIntegrationNamespace = jest
      .fn()
      .mockReturnValue("ssdn-test.learningtapestry.com");
    AWSService.updateNamespace = jest.fn();
  });

  it("renders the current namespace inside a text input", async () => {
    const { getByDisplayValue } = render(<SetNamespace {...props} />);

    await wait(() => {
      getByDisplayValue("ssdn-test.learningtapestry.com");
    });
  });

  it("sets a new value for the namespace", async () => {
    const { getByTestId, getByText } = render(<SetNamespace {...props} />);

    await wait(() => {
      fireEvent.change(getByTestId("functionNamespace"), {
        target: { value: "modified.learningtapestry.com" },
      });
      fireEvent.click(getByText("Confirm"));

      expect(AWSService.updateNamespace).toHaveBeenCalledWith("modified.learningtapestry.com");
      expect(props.onNamespaceSaved).toHaveBeenCalled();
    });
  });
});
