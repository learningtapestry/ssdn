import "jest-dom/extend-expect";
import React from "react";
import { fireEvent, render } from "react-testing-library";
import ConfirmationModal from "./ConfirmationModal";

describe("<ConfirmationModal />", () => {
  const props = {
    children: <p>Children element</p>,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    show: true,
    title: "My title",
  };

  it("renders the dialog components", () => {
    const { getByRole, getByText } = render(<ConfirmationModal {...props} />);

    expect(getByRole("dialog")).toBeVisible();
    expect(getByText("Children element")).toBeVisible();
  });

  it("renders the title", () => {
    const { getByText } = render(<ConfirmationModal {...props} />);

    getByText("My title");
  });

  it("executes the event handlers", () => {
    const { getByText } = render(<ConfirmationModal {...props} />);

    fireEvent.click(getByText("Close"));
    fireEvent.click(getByText("Confirm"));

    expect(props.onClose.mock.calls.length).toEqual(1);
    expect(props.onConfirm.mock.calls.length).toEqual(1);
  });
});
