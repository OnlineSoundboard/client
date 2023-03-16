"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
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
exports.CacheManager = CacheManager;
exports.default = { CacheManager };
