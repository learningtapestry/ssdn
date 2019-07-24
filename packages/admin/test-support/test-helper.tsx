/**
 * test-helper.ts: Support functions to be used in tests
 */
import { createMemoryHistory } from "history";
import React from "react";
import { Router } from "react-router-dom";

import { render } from "@testing-library/react";

export function renderWithRouter(
  ui: JSX.Element,
  { route = "/", history = createMemoryHistory({ initialEntries: [route] }) } = {},
) {
  return {
    ...render(<Router history={history}>{ui}</Router>),
    history,
  };
}

export function mockWithPromise(returnValue: any) {
  return jest.fn(() => ({ promise: async () => returnValue })) as jest.Mock<any>;
}
