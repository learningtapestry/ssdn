import { DbFormat } from "../interfaces/format";

export default interface FormatRepository {
  get(name: string): Promise<DbFormat>;
  findAll(): Promise<DbFormat[]>;
  put(format: DbFormat): Promise<DbFormat>;
  delete(name: string): Promise<void>;
  update(name: string, format: DbFormat): Promise<DbFormat>;
}
