import "jest-dom/extend-expect";
import React from "react";
import { renderWithRouter } from "../../../test-support/test-helper";
import Header from "./Header";

describe("<Header />", () => {
  it("renders the navigation links", () => {
    const { getByText } = renderWithRouter(<Header />);

    expect(getByText(/home/i)).toHaveAttribute("href", "/");
    expect(getByText(/providers/i)).toHaveAttribute("href", "/submitted");
    expect(getByText(/consumers/i)).toHaveAttribute("href", "/incoming");
    expect(getByText(/logs/i)).toHaveAttribute("href", "/logs");
    expect(getByText(/users/i)).toHaveAttribute("href", "/users");
    expect(getByText(/settings/i)).toHaveAttribute("href", "/settings");
  });
});
