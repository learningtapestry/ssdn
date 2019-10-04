import "@testing-library/jest-dom/extend-expect";

import React from "react";

import { fireEvent, render } from "@testing-library/react";

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

    // @ts-ignore
    expect(getByRole("dialog", { hidden: true })).toBeVisible();
    expect(getByText("Children element")).toBeVisible();
  });

  it("renders the title", () => {
    const { getByText } = render(<ConfirmationModal {...props} />);

    getByText("My title");
  });

  it("executes the event handlers", () => {
    const { getByText, getAllByText } = render(<ConfirmationModal {...props} />);

    fireEvent.click(getAllByText("Close")[0]);
    fireEvent.click(getByText("Confirm"));

    expect(props.onClose).toHaveBeenCalled();
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it("honors the provided button labels", () => {
    const { getByText } = render(
      <ConfirmationModal {...props} closeLabel="Defend!" confirmLabel="Attack!" />,
    );

    getByText("Defend!");
    getByText("Attack!");
  });
});
