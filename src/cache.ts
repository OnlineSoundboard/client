abstract class CacheManager<Item> {
  /** Items map. */
  protected readonly _items: Map<string, Item>

  constructor () {
    this._items = new Map<string, Item>()
  }

  /**
   * Caches an item.
   * @param item the item to cache
   */
  public abstract add (item: Item): Promise<Item>

  /**
   * Gets an item from the cache.
   * @param id id of the item to get
   */
  public abstract get (id: string): Promise<Item | null>
  /**
   * Gets an item from the cache.
   * @param item the item to get
   */
  public abstract get (item: Item): Promise<Item | null>

  /**
   * Whether the item is cached.
   * @param id id of the item to check
   */
  public abstract cached (id: string): Promise<boolean>

  /**
   * Removes an item from the cache.
   * @param id id of the item to remove
   */
  public abstract remove (id: string): Promise<void>
  /**
   * Removes an item from the cache.
   * @param item the item to remove
   */
  public abstract remove (item: Item): Promise<void>

  /**
   * Clears the cache.
   */
  public abstract clear (): Promise<void>

  /**
   * Lists cached items.
   */
  public list (): Item[] {
    return Array.from(this._items.values())
  }
}

export { CacheManager }
export default { CacheManager }
