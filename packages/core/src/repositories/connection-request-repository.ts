import {
  ConnectionRequest,
  ConnectionRequestStatus,
  IncomingConnectionRequestStatus,
} from "../interfaces/connection-request";

export interface ConnectionRequestRepository {
  get(id: string): Promise<ConnectionRequest>;
  getIncoming(consumerEndpoint: string, id: string): Promise<ConnectionRequest>;
  updateStatus(id: string, status: ConnectionRequestStatus): Promise<ConnectionRequest>;
  updateIncomingStatus(
    consumerEndpoint: string,
    id: string,
    status: ConnectionRequestStatus | IncomingConnectionRequestStatus,
  ): Promise<ConnectionRequest>;
  put(connectionRequest: ConnectionRequest): Promise<ConnectionRequest>;
  putIncoming(connectionRequest: ConnectionRequest): Promise<ConnectionRequest>;
}
