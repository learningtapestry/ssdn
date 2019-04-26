import "jest-dom/extend-expect";
import React from "react";
import { render, wait } from "react-testing-library";
import * as factories from "../../../test-support/factories";
import AWSService from "../../services/aws-service";
import Settings from "./Settings";

/* FIXME: The nasty warning about test not wrapped in act(...) should go away when this is resolved:
 *        https://github.com/facebook/react/issues/14769
 */
describe("<Settings/>", () => {
  beforeEach(() => {
    AWSService.retrieveStacks = jest.fn().mockReturnValue(factories.instances());
  });

  it("renders the title and instance tabs", async () => {
    const { getByText } = render(<Settings />);

    getByText("Settings");
    await wait(() => {
      getByText("Nucleus-Dev");
      getByText("Nucleus");
    });
  });

  it("renders the settings for all instances", async () => {
    const { getByText } = render(<Settings />);

    await wait(() => {
      getByText("Nucleus-Development-EventProcessor");
      getByText(/Nucleus-Dev-HelloNucleusFunction-HCJE3P62QE5P/i);
      getByText("Nucleus-Production-EventProcessor");
      getByText(/Nucleus-HelloNucleusFunction-60K87QSYCYTJ/i);
    });
  });
});
