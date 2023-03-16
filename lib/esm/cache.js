class CacheManager {
    /** Items map. */
    _items;
    constructor() {
        this._items = new Map();
    }
    /**
     * Lists cached items.
     */
    list() {
        return Array.from(this._items.values());
    }
}
export { CacheManager };
export default { CacheManager };
