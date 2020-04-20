/**
 * ssdn-config.ts: Defines the type that stores the SSDN configuration on install
 */

export default interface SSDNConfig {
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
