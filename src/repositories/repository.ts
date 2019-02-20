/**
 * repository.ts: General interface to describe repository access
 */

interface Repository {
    store(content: object, attributes?: object): void;
}
