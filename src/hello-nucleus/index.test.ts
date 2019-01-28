"use strict";

const app = require("./index.ts");

describe("hello nucleus", () => {
    it("verifies successful response", async () => {
        const result = await app.lambdaHandler({}, {});

        expect(typeof result).toBe("object");
        expect(result.statusCode).toEqual(200);
        expect(typeof result.body).toBe("string");

        let response = JSON.parse(result.body);

        expect(typeof response).toBe("object");
        expect(response.message).toEqual("Hello Nucleus!");
        expect(typeof response.location).toBe("string");
    });
});
