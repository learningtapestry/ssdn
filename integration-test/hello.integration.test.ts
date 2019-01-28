"use strict";

const axios = require("axios");

describe("Hello Nucleus API", () => {
    it("returns the message", async () => {
        const response = await axios(process.env.NUCLEUS_HELLO_API);

        expect(response.status).toEqual(200);
        expect(response.data.message).toEqual("Hello Nucleus!");
    });
});
