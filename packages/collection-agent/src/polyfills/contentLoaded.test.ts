import { contentLoaded } from "./contentloaded";

describe("contentLoaded", () => {
  it("attaches a handler for onDOMContentLoaded", (done) => {
    contentLoaded(window, () => {
      done();
    });
  });
});
