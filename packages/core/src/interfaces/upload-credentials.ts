export interface UploadCredentials {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
  };
  instructions: string;
}
