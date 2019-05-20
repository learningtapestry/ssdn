import { Connection, ConsumerIssuedConnection } from "../interfaces/connection";
import { ConnectionRequest } from "../interfaces/connection-request";
import Event from "../interfaces/event";
import { ProviderIssuedAcceptance, StreamUpdate } from "../interfaces/exchange";

export default interface ExchangeService {
  sendAcceptance(
    connectionRequest: ConnectionRequest,
    providerAcceptance: ProviderIssuedAcceptance,
  ): Promise<ConsumerIssuedConnection>;
  sendConnectionRequest(connectionRequest: ConnectionRequest): Promise<void>;
  sendEvents(connection: Connection, events: Event[]): Promise<void>;
  sendRejection(connectionRequest: ConnectionRequest): Promise<void>;
  sendStreamUpdate(connection: Connection, streamUpdate: StreamUpdate): Promise<void>;
  verifyConnectionRequest(connectionRequest: ConnectionRequest): Promise<void>;
}
