import { contentLoaded } from "./contentLoaded";

describe("contentLoaded", () => {
  it("attaches a handler for onDOMContentLoaded", (done) => {
    contentLoaded(window, () => {
      done();
    });
  });
});
