import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { render } from "@testing-library/react";
import Home from "./Home";

describe("<Home />", () => {
  it("renders the main page", () => {
    const { getByText } = render(<Home />);

    getByText(/welcome to Secure Student Data Network/i);
  });
});
