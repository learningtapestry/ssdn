import Event from "../interfaces/event";

export default interface EventRouter {
  route(events: Event[]): Promise<void>;
}
