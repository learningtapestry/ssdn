import "jest-dom/extend-expect";
import { omit } from "lodash/fp";
import React from "react";
import { fireEvent, render } from "react-testing-library";
import * as factories from "../../../test-support/factories";
import ConnectionRequestModal from "./ConnectionRequestModal";

describe("<ConnectionRequestModal />", () => {
  const props = {
    connectionRequest: factories.connectionRequests()[0],
    onClose: jest.fn(),
    show: true,
  };

  it("renders the dialog components", () => {
    const { getByRole } = render(<ConnectionRequestModal {...props} />);

    expect(getByRole("dialog")).toBeVisible();
  });

  it("renders the title", () => {
    const { getByText } = render(<ConnectionRequestModal {...props} />);

    getByText("Consumer Connection Request");
  });

  it("renders the request values", () => {
    const { getByText, queryByText } = render(<ConnectionRequestModal {...props} />);
    const displayedAttributes = omit(["creationDate", "id", "status", "type", "verificationCode"])(
      props.connectionRequest,
    );

    getByText("2/13/2019, 1:21:36 PM");
    getByText("Accepted");
    queryByText("825150");
    Object.entries(displayedAttributes).forEach((entry) => {
      getByText(entry[1]); // Attribute value
    });
  });

  it("shows the verification code when seeing a provider request", () => {
    const providerRequest = { ...props.connectionRequest, type: "provider" };

    const { queryByText } = render(
      <ConnectionRequestModal {...props} connectionRequest={providerRequest} />,
    );

    queryByText("825150");
  });
  it("executes the event handlers", () => {
    const { getByText } = render(<ConnectionRequestModal {...props} />);

    fireEvent.click(getByText("Close"));

    expect(props.onClose).toHaveBeenCalled();
  });
});
