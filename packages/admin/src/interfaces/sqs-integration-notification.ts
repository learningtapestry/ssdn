export interface SQSIntegrationNotification {
  id: string;
  subject: string;
  message: string;
  queue: string;
  details?: string;
  creationDate: Date | string;
}
