import {
  ConnectionRequest,
  ConnectionRequestStatus,
  IncomingConnectionRequestStatus,
} from "../interfaces/connection-request";

export default interface ConnectionRequestService {
  create(connectionRequest: ConnectionRequest): Promise<ConnectionRequest>;
  createIncoming(connectionRequest: ConnectionRequest): Promise<ConnectionRequest>;
  sendConnectionRequest(connectionRequest: ConnectionRequest): Promise<void>;
  receiveProviderRejection(connectionRequest: ConnectionRequest): Promise<void>;
  assertConnectionRequestUpdatable(
    connectionRequest: ConnectionRequest,
    pendingStatuses?: Array<ConnectionRequestStatus | IncomingConnectionRequestStatus>,
  ): Promise<void>;
}
