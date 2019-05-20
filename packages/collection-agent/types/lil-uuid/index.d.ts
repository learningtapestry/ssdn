declare module "lil-uuid" {
  type UUID = {
    (): string;
    isUUID(uuid: string, version?: string): boolean;
  };
  var uuid: UUID;
  export = uuid;
}
