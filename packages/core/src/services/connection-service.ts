import { Connection, ProviderIssuedConnection } from "../interfaces/connection";
import { ConnectionRequest } from "../interfaces/connection-request";
import { Stream } from "../interfaces/stream";

export default interface ConnectionService {
  createForConsumerRequest(connectionRequest: ConnectionRequest): Promise<Connection>;
  createForProviderAcceptance(
    connectionRequest: ConnectionRequest,
    connectionDetails: ProviderIssuedConnection,
  ): Promise<Connection>;
  rejectConsumerRequest(connectionRequest: ConnectionRequest): Promise<void>;
  updateStream(
    connection: Connection,
    stream: Stream,
    streamType: "input" | "output",
    isInternalUpdate: boolean,
  ): Promise<Connection>;
}
