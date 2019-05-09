/**
 * nucleus-config.ts: Defines the type that stores the Nucleus configuration on install
 */

export default interface NucleusConfig {
  organization: string;
  email: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  environment: string;
  bucket: string;
}
