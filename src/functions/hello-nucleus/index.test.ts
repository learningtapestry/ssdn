"use strict";

import { lambdaHandler } from ".";

describe("hello nucleus", () => {
  it("verifies successful response", async () => {
    const result = await lambdaHandler({}, {});

    expect(typeof result).toBe("object");
    expect(result.statusCode).toEqual(200);
    expect(typeof result.body).toBe("string");

    const response = JSON.parse(result.body);

    expect(typeof response).toBe("object");
    expect(response.message).toEqual("Hello Nucleus!");
    expect(typeof response.location).toBe("string");
  });
});
