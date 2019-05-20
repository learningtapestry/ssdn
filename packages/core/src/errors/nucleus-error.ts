export class NucleusError extends Error {
  public statusCode?: string;
  public name = "NucleusError";

  constructor(message: string, statusCode?: number) {
    super(message);
    if (statusCode) {
      this.statusCode = statusCode.toString();
    }
  }
}
