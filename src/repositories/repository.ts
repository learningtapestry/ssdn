/**
 * repository.ts: General interface to describe repository access
 */

type Content = string | object;

interface Repository {
  store(content: Content, attributes?: object): void;
  storeBatch(content: Content[], attributes?: object): void;
}
