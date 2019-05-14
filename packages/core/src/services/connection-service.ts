import { Connection, ProviderIssuedConnectionDetails } from "../interfaces/connection";
import { ConnectionRequest } from "../interfaces/connection-request";
import { StreamStatus } from "../interfaces/stream";

export default interface ConnectionService {
  createForConsumerRequest(connectionRequest: ConnectionRequest): Promise<Connection>;
  createForProviderAcceptance(
    connectionRequest: ConnectionRequest,
    connectionDetails: ProviderIssuedConnectionDetails,
  ): Promise<Connection>;
  rejectConsumerRequest(connectionRequest: ConnectionRequest): Promise<void>;
  updateStream(
    endpoint: string,
    namespace: string,
    channel: string,
    status: StreamStatus,
    streamType: "input" | "output",
  ): Promise<Connection>;
  updateStreamByExternal(
    userId: string,
    endpoint: string,
    namespace: string,
    channel: string,
    status: StreamStatus,
    streamType: "input" | "output",
  ): Promise<Connection>;
}
