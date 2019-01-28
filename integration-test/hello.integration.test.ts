"use strict";

import axios from "axios";

describe("Hello Nucleus API", () => {
    it("returns the message", async () => {
        const url = process.env.NUCLEUS_HELLO_API || "http://localhost:3000/hello";
        const response = await axios(url);

        expect(response.status).toEqual(200);
        expect(response.data.message).toEqual("Hello Nucleus!");
    });
});
