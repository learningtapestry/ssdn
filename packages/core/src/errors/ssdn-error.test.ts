import { SSDNError } from "./ssdn-error";

describe("SSDNError", () => {
  it("sets the message and statusCode properties", () => {
    const error404 = new SSDNError("Not Found", 404);
    expect(error404.message).toEqual("Not Found");
    expect(error404.statusCode).toEqual("404");
  });
});
