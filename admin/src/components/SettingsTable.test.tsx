import "jest-dom/extend-expect";
import React from "react";
import { render } from "react-testing-library";
import * as factories from "../../test-support/factories";
import SettingsTable from "./SettingsTable";

describe("<SettingsTable />", () => {
  it("renders a table with the settings", () => {
    const { getByText } = render(<SettingsTable settings={factories.instances()[0].settings} />);

    getByText("EventProcessorStreamName");
    getByText("Name of the Event Processor Kinesis Data Stream");
    getByText("Nucleus-Development-EventProcessor");
    getByText("Hello Nucleus Lambda Function ARN");
    getByText("HelloNucleusFunction");
    getByText(/Nucleus-Dev-HelloNucleusFunction-HCJE3P62QE5P/i);
  });
});
