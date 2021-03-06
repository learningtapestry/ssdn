/**
 * event-repository.ts: General interface to describe repository access
 */

export type Content = string | object;

export interface EventRepository {
  store(content: Content, attributes?: object): any;
  storeBatch(content: Content[], attributes?: object): void;
}
