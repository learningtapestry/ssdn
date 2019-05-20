import { PageContext } from "./pageContext";

describe("PageContext", () => {
  it("correctly exposes interface members", () => {
    document.title = "Test";
    const context = new PageContext();
    expect(context.url).toEqual("http://localhost/");
    expect(context.pageTitle).toEqual("Test");
  });
});
