/**
 * nucleus-config.ts: Defines the type that stores the Nucleus configuration on install
 */

export default interface NucleusConfig {
  organization: string;
  instanceId: string;
  email: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  environment: string;
  namespace: string;
  bucket: string;
  stackName: string;
}
