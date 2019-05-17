import "jest-dom/extend-expect";

import omit from "lodash/fp/omit";
import React from "react";
import { fireEvent, render } from "react-testing-library";

import * as factories from "../../../test-support/factories";
import ConnectionRequestModal from "./ConnectionRequestModal";

describe("<ConnectionRequestModal />", () => {
  const props = {
    connectionRequest: factories.connectionRequests()[0],
    onClose: jest.fn(),
    show: true,
    type: "incoming",
  };

  it("renders the dialog components", () => {
    const { getByRole } = render(<ConnectionRequestModal {...props} />);

    expect(getByRole("dialog")).toBeVisible();
  });

  it("renders the title", () => {
    const { getByText } = render(<ConnectionRequestModal {...props} />);

    getByText("Incoming Connection Request");
  });

  it("renders the request values", () => {
    const { getByText } = render(<ConnectionRequestModal {...props} />);

    getByText("2/13/2019, 7:21:36 AM");
    getByText("Accepted");
    getByText(props.connectionRequest.firstName);
    getByText(props.connectionRequest.lastName);
    getByText(props.connectionRequest.organization);
    getByText(props.connectionRequest.title);
    getByText(props.connectionRequest.email);
    getByText(props.connectionRequest.phoneNumber);
    if (props.connectionRequest.extension) {
      getByText(props.connectionRequest.extension);
    }
  });

  it("shows the verification code when seeing a provider request", () => {
    const providerRequest = { ...props.connectionRequest, type: "submitted" };

    const { queryByText } = render(
      <ConnectionRequestModal {...props} connectionRequest={providerRequest} />,
    );

    queryByText("Verify1");
  });
  it("executes the event handlers", () => {
    const { getAllByText } = render(<ConnectionRequestModal {...props} />);

    fireEvent.click(getAllByText("Close")[0]);

    expect(props.onClose).toHaveBeenCalled();
  });
});
