import { Format } from "../interfaces/format";

export default interface FormatRepository {
  get(name: string): Promise<Format>;
  findAll(): Promise<Format[]>;
  put(format: Format): Promise<Format>;
  delete(name: string): Promise<void>;
  update(name: string, format: Format): Promise<Format>;
}
