import "jest-dom/extend-expect";
import React from "react";
import { render } from "react-testing-library";
import Home from "./Home";

describe("<Home />", () => {
  it("renders the main page", () => {
    const { getByText } = render(<Home />);

    getByText(/welcome to Secure Student Data Network/i);
  });
});
