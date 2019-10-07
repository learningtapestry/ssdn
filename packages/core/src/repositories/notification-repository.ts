/**
 * notification-repository.ts: General interface to describe generic operations on notifications
 */

export default interface NotificationRepository<T> {
  findAll(): Promise<T[]>;
  put(fileTransferNotification: T): Promise<T>;
  delete(name: string): Promise<void>;
}
