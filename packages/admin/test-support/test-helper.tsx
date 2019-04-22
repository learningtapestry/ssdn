/**
 * test-helper.ts: Support functions to be used in tests
 */

import { createMemoryHistory } from "history";
import React from "react";
import { Router } from "react-router-dom";
import { render } from "react-testing-library";

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
  return jest.fn().mockImplementation(() => {
    return { promise: () => returnValue };
  });
}
