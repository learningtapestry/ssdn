export enum FileTransferNotificationType {
  Info = "info",
  Error = "error",
}

export interface FileTransferNotification {
  id: string;
  subject: string;
  message: string;
  type: FileTransferNotificationType;
  file: string;
  bucket: string;
  details?: string;
  creationDate: Date | string;
}

export interface SNSFileTransferNotification {
  subject: string;
  message: string;
  type: FileTransferNotificationType;
  file: string;
  bucket: string;
  details?: string;
}
