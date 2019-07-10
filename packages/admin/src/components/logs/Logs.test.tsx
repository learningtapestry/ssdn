import "@testing-library/jest-dom/extend-expect";

import React from "react";
import { fireEvent, render, wait } from "@testing-library/react";

import * as factories from "../../../test-support/factories";
import AWSService from "../../services/aws-service";
import Logs from "./Logs";

/* FIXME: The nasty warning about test not wrapped in act(...) should go away when this is resolved:
 *        https://github.com/facebook/react/issues/14769
 */
describe("<Logs/>", () => {
  beforeAll(() => {
    AWSService.retrieveLogGroups = jest.fn().mockReturnValue(factories.logGroups());
    AWSService.retrieveLogEvents = jest.fn().mockReturnValue(factories.logEvents());
  });

  it("renders title and log groups in the dropdown", async () => {
    const { getByText } = render(<Logs />);

    getByText("Logs");
    await wait(() => {
      getByText("/aws/lambda/SSDN-AuthorizeBeaconFunction-1P2GO4YF9VZA7");
    });
  });

  it("renders log events in the list", async () => {
    const { getByText } = render(<Logs />);

    await wait(() => {
      getByText("4/14/2019, 11:21:55 AM");
      getByText("START RequestId: df528d1a-6049-4430-8835-38e7ef58b800 Version: $LATEST");
      getByText("4/14/2019, 11:21:56 AM");
      getByText("END RequestId: df528d1a-6049-4430-8835-38e7ef58b800");
    });
  });

  it("handles the change group action", async () => {
    const { getByText } = render(<Logs />);

    await wait(() => {
      fireEvent.click(getByText("/aws/lambda/SSDN-AuthorizeBeaconFunction-1P2GO4YF9VZA7"));
      fireEvent.click(getByText("/aws/lambda/SSDN-ProcessXAPIStatementFunction-HCJE3P62QE5P"));
    });

    expect(AWSService.retrieveLogEvents).toHaveBeenCalled();
  });
});
