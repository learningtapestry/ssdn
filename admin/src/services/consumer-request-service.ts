/**
 * consumer-request-service.ts: Service used by consumers to send requests to providers
 */

import axios from "axios";
import ConnectionRequest from "../interfaces/connection-request";

export default class ConsumerRequestService {
  public static async register(endpoint: string, connectionRequest: ConnectionRequest) {
    return await axios.post(endpoint, connectionRequest);
  }
}
