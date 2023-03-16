declare abstract class CacheManager<Item> {
    /** Items map. */
    protected readonly _items: Map<string, Item>;
    constructor();
    /**
     * Caches an item.
     * @param item the item to cache
     */
    abstract add(item: Item): Promise<Item>;
    /**
     * Gets an item from the cache.
     * @param id id of the item to get
     */
    abstract get(id: string): Promise<Item | null>;
    /**
     * Gets an item from the cache.
     * @param item the item to get
     */
    abstract get(item: Item): Promise<Item | null>;
    /**
     * Whether the item is cached.
     * @param id id of the item to check
     */
    abstract cached(id: string): Promise<boolean>;
    /**
     * Removes an item from the cache.
     * @param id id of the item to remove
     */
    abstract remove(id: string): Promise<void>;
    /**
     * Removes an item from the cache.
     * @param item the item to remove
     */
    abstract remove(item: Item): Promise<void>;
    /**
     * Clears the cache.
     */
    abstract clear(): Promise<void>;
    /**
     * Lists cached items.
     */
    list(): Item[];
}
export { CacheManager };
declare const _default: {
    CacheManager: typeof CacheManager;
};
export default _default;
