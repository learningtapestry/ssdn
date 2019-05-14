export default class TtlCache<T, Y> {
  public defaultTtl: number;

  public entries: Map<
    T,
    {
      expiresAt: number;
      value: Y;
    }
  > = new Map();

  public constructor(defaultTtl: number = 60 * 1000) {
    this.defaultTtl = defaultTtl;
  }

  public async get(key: T): Promise<Y | null>;
  public async get(key: T, orElseSet: () => Promise<Y>): Promise<Y>;
  public async get(key: T, orElseSet?: () => Promise<Y>) {
    const entry = this.entries.get(key);
    if (entry) {
      const now = new Date().getTime();
      if (entry.expiresAt < now) {
        return orElseSet ? this.set(key, await orElseSet()) : null;
      } else {
        return entry.value;
      }
    } else if (orElseSet) {
      return this.set(key, await orElseSet());
    }
    return null;
  }

  public async set(key: T, value: Y, ttl = this.defaultTtl) {
    this.entries.set(key, { expiresAt: new Date().getTime() + ttl, value });
    return value;
  }
}
