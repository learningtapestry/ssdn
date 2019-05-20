import { NucleusError } from "./nucleus-error";

describe("NucleusError", () => {
  it("sets the message and statusCode properties", () => {
    const error404 = new NucleusError("Not Found", 404);
    expect(error404.message).toEqual("Not Found");
    expect(error404.statusCode).toEqual("404");
  });
});
