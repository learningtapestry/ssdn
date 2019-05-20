import { onDOMContentLoaded, onWindowHidden, onWindowVisible } from "./events";

const eventRemovers: Array<() => void> = [];

describe("events", () => {
  beforeEach(() => {
    eventRemovers.forEach((fn) => fn());
  });

  describe("onDOMContentLoaded", () => {
    it("attaches a handler for onDOMContentLoaded", (done) => {
      eventRemovers.push(
        onDOMContentLoaded(() => {
          done();
        }),
      );
    });
  });

  describe("onWindowVisible", () => {
    it("attaches a handler for focus", (done) => {
      eventRemovers.push(
        onWindowVisible(() => {
          done();
        }),
      );
      window.dispatchEvent(new FocusEvent("focus"));
    });

    describe("visibilitychange handler", () => {
      it("triggers when document is visible", (done) => {
        eventRemovers.push(
          onWindowVisible(() => {
            done();
          }),
        );
        (document as any).hidden = false;
        document.dispatchEvent(new Event("visibilitychange"));
      });

      it("doesn't trigger when document is hidden", (done) => {
        eventRemovers.push(
          onWindowVisible(() => {
            fail();
          }),
        );
        (document as any).hidden = true;
        document.dispatchEvent(new Event("visibilitychange"));
        done();
      });
    });
  });

  describe("onWindowHidden", () => {
    describe("blur handler", () => {
      it("attaches a handler for blur", (done) => {
        eventRemovers.push(
          onWindowHidden(() => {
            done();
          }),
        );
        window.dispatchEvent(new FocusEvent("blur"));
      });
    });

    describe("visibilitychange handler", () => {
      it("triggers when document is hidden", (done) => {
        eventRemovers.push(
          onWindowHidden(() => {
            done();
          }),
        );
        (document as any).hidden = true;
        document.dispatchEvent(new Event("visibilitychange"));
      });

      it("doesn't trigger when document is visible", (done) => {
        eventRemovers.push(
          onWindowHidden(() => {
            fail();
          }),
        );
        (document as any).hidden = false;
        document.dispatchEvent(new Event("visibilitychange"));
        done();
      });
    });
  });
});
