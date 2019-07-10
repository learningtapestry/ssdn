export class SSDNError extends Error {
  public statusCode?: string;
  public name = "SSDNError";

  constructor(message: string, statusCode?: number) {
    super(message);
    if (statusCode) {
      this.statusCode = statusCode.toString();
    }
  }
}
