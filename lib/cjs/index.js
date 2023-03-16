"use strict";
/* istanbul ignore file */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_js_1 = require("./client.js");
const sound_cache_js_1 = require("./sound_cache.js");
const error_js_1 = require("./error.js");
__exportStar(require("./client.js"), exports);
__exportStar(require("./sound_cache.js"), exports);
__exportStar(require("./error.js"), exports);
exports.default = { Client: client_js_1.Client, SoundCache: sound_cache_js_1.default, OSBError: error_js_1.default };
