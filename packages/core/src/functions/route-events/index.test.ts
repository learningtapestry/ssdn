import { mocked } from "../../../test-support/jest-helper";
import { getEventRouter } from "../../services";
import * as handlerScope from "./";

// We need to define the mock directly here, because getEventRouter is being used
// in the outer scope in route-events.
jest.mock("../../services", () => {
  const routerMethods = {
    route: jest.fn(() => Promise.resolve()),
  };
  const moduleExports = {
    getEventRouter: jest.fn(() => routerMethods),
  };
  (moduleExports.getEventRouter as any).impl = routerMethods;
  return moduleExports;
});

describe("RouteEventsFunction", () => {
  it("decodes data and sends events in chunks to the router", async () => {
    const records: any[] = [];
    for (let i = 0; i < 150; i++) {
      records.push({
        kinesis: {
          data: "eyJhIjoxfQ==",
        },
      });
    }
    await handlerScope.handler({ Records: records }, {} as any, () => {});
    const routeFn = mocked((getEventRouter as any).impl.route);
    expect(routeFn).toHaveBeenCalledTimes(2);
    expect(routeFn.mock.calls[0][0]).toHaveLength(100);
    expect(routeFn.mock.calls[1][0]).toHaveLength(50);
    expect(routeFn.mock.calls[0][0][0]).toEqual({ a: 1 });
  });
});
