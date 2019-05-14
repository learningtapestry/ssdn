import { buildConnection, buildEvent, buildEventMetadata } from "../../test-support/factories";
import { fakeImpl, mocked } from "../../test-support/jest-helper";
import { Connection } from "../interfaces/connection";
import { StreamStatus } from "../interfaces/stream";
import ConnectionRepository from "../repositories/connection-repository";
import AwsEventRouter from "./aws-event-router";
import ExchangeService from "./exchange-service";

const fakeConnectionRepository = fakeImpl<ConnectionRepository>({
  findAllWithOutputStreams: jest.fn(
    async (): Promise<Connection[]> => [
      buildConnection({
        endpoint: "https://acme.org",
        outputStreams: [
          { channel: "XAPI", namespace: "acme.org", status: StreamStatus.Active },
          { channel: "XAPI", namespace: "blue.org", status: StreamStatus.Active },
          { channel: "S3", namespace: "acme.org", status: StreamStatus.Active },
          { channel: "S3", namespace: "blue.org", status: StreamStatus.Paused },
        ],
      }),
      buildConnection({
        endpoint: "https://blue.org",
        outputStreams: [
          { channel: "XAPI", namespace: "blue.org", status: StreamStatus.Active },
          { channel: "XAPI", namespace: "acme.org", status: StreamStatus.Active },
          { channel: "S3", namespace: "blue.org", status: StreamStatus.Active },
          { channel: "S3", namespace: "acme.org", status: StreamStatus.PausedExternal },
        ],
      }),
    ],
  ),
});

const fakeExchangeService = fakeImpl<ExchangeService>({
  sendEvents: jest.fn(),
});

const events = [
  buildEvent({
    content: "External should not be routed",
    event: buildEventMetadata({ channel: "XAPI", namespace: "acme.org" }),
    source: { nucleusId: "123456" },
  }),
  buildEvent({
    content: "External should not be routed",
    event: buildEventMetadata({ channel: "XAPI", namespace: "blue.org" }),
    source: { nucleusId: "123456" },
  }),
  buildEvent({
    content: "XAPI acme should be routed to both",
    event: buildEventMetadata({ channel: "XAPI", namespace: "acme.org" }),
  }),
  buildEvent({
    content: "XAPI blue should be routed to both",
    event: buildEventMetadata({ channel: "XAPI", namespace: "acme.org" }),
  }),
  buildEvent({
    content: "S3 acme should be routed to acme",
    event: buildEventMetadata({ channel: "S3", namespace: "acme.org" }),
  }),
  buildEvent({
    content: "S3 blue should be routed to blue",
    event: buildEventMetadata({ channel: "S3", namespace: "blue.org" }),
  }),
];

describe("AwsEventRouter", () => {
  describe("route", () => {
    it("routes events", async () => {
      const router = new AwsEventRouter(fakeConnectionRepository, fakeExchangeService);
      await router.route(events);

      expect(fakeExchangeService.sendEvents).toHaveBeenCalledTimes(2);

      let [connection, routedEvents] = mocked(fakeExchangeService.sendEvents).mock.calls[0];
      expect((connection as Connection).endpoint).toEqual("https://acme.org");
      expect(routedEvents).toEqual([
        buildEvent({
          content: "XAPI acme should be routed to both",
          event: buildEventMetadata({ channel: "XAPI", namespace: "acme.org" }),
        }),
        buildEvent({
          content: "XAPI blue should be routed to both",
          event: buildEventMetadata({ channel: "XAPI", namespace: "acme.org" }),
        }),
        buildEvent({
          content: "S3 acme should be routed to acme",
          event: buildEventMetadata({ channel: "S3", namespace: "acme.org" }),
        }),
      ]);

      [connection, routedEvents] = mocked(fakeExchangeService.sendEvents).mock.calls[1];
      expect((connection as Connection).endpoint).toEqual("https://blue.org");
      expect(routedEvents).toEqual([
        buildEvent({
          content: "XAPI acme should be routed to both",
          event: buildEventMetadata({ channel: "XAPI", namespace: "acme.org" }),
        }),
        buildEvent({
          content: "XAPI blue should be routed to both",
          event: buildEventMetadata({ channel: "XAPI", namespace: "acme.org" }),
        }),
        buildEvent({
          content: "S3 blue should be routed to blue",
          event: buildEventMetadata({ channel: "S3", namespace: "blue.org" }),
        }),
      ]);
    });
  });
});
