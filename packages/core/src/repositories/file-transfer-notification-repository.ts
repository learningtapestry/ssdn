/**
 * file-transfer-notification-repository.ts: General interface to describe operations on file
 * transfer notifications
 */

import { FileTransferNotification } from "../interfaces/file-transfer-notification";

export default interface FileTransferNotificationRepository {
  findAll(): Promise<FileTransferNotification[]>;
  put(fileTransferNotification: FileTransferNotification): Promise<FileTransferNotification>;
  delete(name: string): Promise<void>;
}
