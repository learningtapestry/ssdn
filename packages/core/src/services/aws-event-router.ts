import TtlCache from "../helpers/ttl-cache";
import { Connection } from "../interfaces/connection";
import Event from "../interfaces/event";
import { StreamStatus } from "../interfaces/stream";
import ConnectionRepository from "../repositories/connection-repository";
import EventRouter from "./event-router";
import ExchangeService from "./exchange-service";

type RouterRoutes = Map<string, Map<string, Connection>>;
type GroupedEvents = Map<string, { connection: Connection; events: Event[] }>;

export default class AwsEventRouter implements EventRouter {
  private connectionRepository: ConnectionRepository;

  private exchangeService: ExchangeService;

  private routes: RouterRoutes = new Map();

  private cache = new TtlCache<string, Connection[]>(60 * 1000);

  constructor(connectionRepository: ConnectionRepository, exchangeService: ExchangeService) {
    this.connectionRepository = connectionRepository;
    this.exchangeService = exchangeService;
  }

  public async route(events: Event[]) {
    await this.updateRoutes();
    const groupedEvents = events.reduce(this.groupEventsByConnection.bind(this), new Map());
    await Promise.all(
      Array.from(groupedEvents.values()).map((eventGroup) =>
        this.exchangeService.sendEvents(eventGroup.connection, eventGroup.events),
      ),
    );
  }

  private async updateRoutes() {
    let connections = await this.cache.get("Connections");
    if (connections) {
      return;
    }

    connections = await this.connectionRepository.findAllWithOutputStreams();
    for (const connection of connections) {
      for (const stream of connection.outputStreams) {
        if (stream.status !== StreamStatus.Active) {
          continue;
        }

        const key = this.getKey(stream.namespace, stream.channel);
        let endpoints = this.routes.get(key);

        if (!endpoints) {
          endpoints = new Map<string, Connection>();
          this.routes.set(key, endpoints);
        }

        if (!endpoints.get(connection.endpoint)) {
          endpoints.set(connection.endpoint, connection);
        }
      }
    }
    this.cache.set("Connections", connections);
  }

  private groupEventsByConnection(eventsByConnection: GroupedEvents, event: Event) {
    if (event.source) {
      // Exchanged events are currently not propagated.
      return eventsByConnection;
    }

    const { namespace, channel } = event.event;

    const connections = this.routes.get(this.getKey(namespace, channel));
    if (!connections) {
      return eventsByConnection;
    }
    for (const connection of connections.values()) {
      let connectionEvents = eventsByConnection.get(connection.endpoint);
      if (!connectionEvents) {
        connectionEvents = { connection, events: [] };
        eventsByConnection.set(connection.endpoint, connectionEvents);
      }
      connectionEvents.events.push(event);
    }
    return eventsByConnection;
  }

  private getKey(namespace: string, channel: string) {
    return `${namespace}/${channel}`;
  }
}
