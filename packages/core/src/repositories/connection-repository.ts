import { Connection } from "../interfaces/connection";

export default interface ConnectionRepository {
  findAllWithOutputStreams(): Promise<Connection[]>;
  get(endpoint: string): Promise<Connection>;
  getByConnectionSecret(id: string): Promise<Connection>;
  put(connection: Connection): Promise<Connection>;
}
