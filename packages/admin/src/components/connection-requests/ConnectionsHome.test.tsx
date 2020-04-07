import "@testing-library/jest-dom/extend-expect";

import React from "react";

import { wait } from "@testing-library/dom";
import * as factories from "../../../test-support/factories";
import { renderWithRouter } from "../../../test-support/test-helper";
import AWSService from "../../services/aws-service";
import ConnectionsHome from "./ConnectionsHome";

describe("<ConnectionsHome />", () => {
  beforeAll(() => {
    AWSService.retrieveConnectionRequests = jest
      .fn()
      .mockReturnValue(factories.connectionRequests());
  });

  it("renders the left menu", async () => {
    const { getByText } = renderWithRouter(<ConnectionsHome />, {
      route: "/connections",
    });

    await wait(() => {
      getByText("Consumers");
      getByText("Providers");
      getByText("Incoming");
      getByText("Submitted");
      getByText("Create new connection");
    });
  });

  it("redirects to the incoming requests", async () => {
    const { queryByText } = renderWithRouter(<ConnectionsHome />, {
      route: "/connections",
    });

    await wait(() => {
      queryByText("This section displays incoming connection requests from other instances.");
    });
  });
});
