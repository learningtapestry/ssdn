"use strict";

import axios from "axios";
import { currentStack, getOutputValue } from "../test-support/aws";

describe("Hello Nucleus API", () => {
  it("returns the message", async () => {
    const helloNucleusEndpoint = await getOutputValue("HelloNucleusApi", currentStack());

    const response = await axios(helloNucleusEndpoint);

    expect(response.status).toEqual(200);
    expect(response.data.message).toEqual("Hello Nucleus!");
  });
});
