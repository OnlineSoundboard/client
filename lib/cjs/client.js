"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const socket_io_client_1 = require("socket.io-client");
const tiny_typed_emitter_1 = require("@dastan21/tiny-typed-emitter");
const sound_cache_js_1 = require("./sound_cache.js");
const error_js_1 = require("./error.js");
/**
 * Client-side class for the OnlineSoundboard project.
 */
class Client extends tiny_typed_emitter_1.TypedEmitter {
    /** Default value of communication timeout. */
    static Timeout = 1000;
    _socket;
    _cacheManager;
    _timeout;
    _board;
    _clientData;
    /**
     * @param url url of the server
     */
    constructor(url, options = {}) {
        super();
        this._timeout = options.timeout ?? Client.Timeout;
        this._cacheManager = new sound_cache_js_1.SoundCache();
        this._board = null;
        this._clientData = {};
        if (url == null || url === '')
            throw new error_js_1.default(error_js_1.default.Errors.ServerUrlMissing);
        this._socket = (0, socket_io_client_1.io)(url, { timeout: this._timeout });
        this.setupListeners();
    }
    setupListeners() {
        this._socket.on('connect', () => this.emit('connect'));
        this._socket.on('connect_error', () => this.emit('disconnect', new error_js_1.default(error_js_1.default.Errors.ConnectionRefused)));
        this._socket.on('disconnect', () => this.emit('disconnect'));
        this._socket.on('board:joined', ({ client }) => this.emit('client:join', client));
        this._socket.on('board:left', ({ client }) => this.emit('client:leave', client));
        this._socket.on('board:updated', ({ board }) => this.updateBoardData(board));
        this._socket.on('board:client:updated', ({ client }) => this.emit('client:update', client));
        this._socket.on('sound:played', ({ soundId }) => this.playSound(soundId));
        this._socket.on('sound:missing', ({ soundId }, callback) => this.sendSound(soundId, callback));
        this._socket.on('sound:updated', ({ sound }) => this.updateSoundData(sound));
        this._socket.on('sound:deleted', ({ soundId }) => this.deleteSound(soundId));
        this._socket.on('sound:fetch', (callback) => callback(this.sounds));
    }
    /**
     * Create a board.
     * @param options create board options
     */
    async create(options) {
        this.connect();
        return await new Promise((resolve, reject) => {
            const to = this.setTimeoutReject(reject);
            this._socket.emit('board:create', {
                clientData: this._clientData,
                boardData: options?.data,
                auth: options?.auth,
                locked: options?.locked
            }, (err, board) => {
                clearTimeout(to);
                if (err != null)
                    return reject(new error_js_1.default(err));
                this._board = board;
                resolve();
            });
        }).catch(err => {
            this.disconnect();
            throw err;
        });
    }
    /**
     * Join a board.
     * @param boardId the board id
     */
    async join(boardId, auth) {
        this.connect();
        return await new Promise((resolve, reject) => {
            const to = this.setTimeoutReject(reject);
            this._socket.emit('board:join', {
                clientData: this._clientData,
                boardId,
                auth
            }, (err, board) => {
                clearTimeout(to);
                if (err != null)
                    return reject(new error_js_1.default(err));
                this._board = board;
                resolve();
            });
        }).catch(err => {
            this.disconnect();
            throw err;
        });
    }
    /**
     * Leave the board.
     */
    async leave() {
        return await new Promise((resolve, reject) => {
            const to = this.setTimeoutReject(reject);
            this._socket.emit('board:leave', () => {
                clearTimeout(to);
                this._board = null;
                resolve();
            });
        });
    }
    /**
     * Connect to the server.
     */
    connect() {
        this._socket.connect();
    }
    /**
     * Disconnect from the server.
     */
    disconnect() {
        this._socket.disconnect();
    }
    /**
     * Cache a sound.
     * @param sound the sound to cache
     * @returns the cached sound id
     */
    async cache(sound) {
        return await new Promise((resolve, reject) => {
            this._cacheManager.add(sound).then((cachedSound) => {
                resolve((cachedSound).id);
            }).catch((err) => {
                reject(new error_js_1.default(error_js_1.default.Errors.SoundCacheFailed, err.message));
            });
        });
    }
    async isCached(sound) {
        const soundId = typeof sound === 'string' ? sound : sound.id;
        return await this._cacheManager.cached(soundId);
    }
    play(sound) {
        const soundId = typeof sound === 'string' ? sound : sound.id;
        void this._cacheManager.get(soundId).then((cachedSound) => {
            if (cachedSound == null)
                throw new error_js_1.default(error_js_1.default.Errors.SoundNotCached, soundId);
            this._socket.emit('sound:play', { soundId });
        });
    }
    playSound(soundId) {
        void this._cacheManager.get(soundId).then((cachedSound) => {
            if (cachedSound != null) {
                this.emit('sound:play', cachedSound);
            }
            else {
                void this.cacheSound(soundId).then((sound) => {
                    this.emit('sound:play', sound);
                });
            }
        });
    }
    async cacheSound(soundId) {
        return await new Promise((resolve, reject) => {
            this._socket.emit('sound:missing', { soundId }, (err, sound) => {
                if (err != null)
                    return reject(new error_js_1.default(err));
                this._cacheManager.add(sound).then(() => {
                    resolve(sound);
                }).catch(/* istanbul ignore next */ (err) => reject(err));
            });
        });
    }
    sendSound(soundId, callback) {
        void this._cacheManager.get(soundId).then((sound) => {
            if (sound == null)
                return callback(new error_js_1.default(error_js_1.default.Errors.SoundNotCached, soundId), null);
            callback(null, sound);
        });
    }
    /**
     * Update the board.
     * @param options board options
     */
    async updateBoard(options) {
        return await new Promise((resolve, reject) => {
            if (this._board == null)
                return reject(new error_js_1.default(error_js_1.default.Errors.NotInABoard));
            const to = this.setTimeoutReject(reject);
            this._socket.emit('board:update', { options }, (err, updatedBoard) => {
                clearTimeout(to);
                /* istanbul ignore next */
                if (err != null)
                    return reject(new error_js_1.default(err));
                this._board = updatedBoard;
                resolve();
            });
        });
    }
    /**
     * Update a sound.
     * @param sound sound to update
     */
    async updateSound(sound) {
        const cachedSound = await this._cacheManager.get(sound.id);
        return await new Promise((resolve, reject) => {
            const to = this.setTimeoutReject(reject);
            if (cachedSound == null) {
                clearTimeout(to);
                reject(new error_js_1.default(error_js_1.default.Errors.SoundNotCached, sound.id));
                return;
            }
            this._socket.emit('sound:update', { sound: { id: sound.id, data: sound.data, ext: sound.ext } }, () => {
                clearTimeout(to);
                resolve();
            });
        });
    }
    updateSoundData(sound) {
        void this._cacheManager.add(sound);
        this.emit('sound:update', sound);
    }
    async delete(sound) {
        const soundId = typeof sound === 'string' ? sound : sound.id;
        return await new Promise((resolve, reject) => {
            const to = this.setTimeoutReject(reject);
            this._socket.emit('sound:delete', { soundId }, () => {
                clearTimeout(to);
                resolve();
            });
        });
    }
    deleteSound(soundId) {
        void this._cacheManager.get(soundId).then((removedSound) => {
            if (removedSound == null)
                return;
            void this._cacheManager.remove(soundId).then(() => {
                this.emit('sound:remove', soundId);
            });
        });
    }
    /**
     * Fetch and cache all sounds from the board.
     */
    async fetchSounds() {
        return await new Promise((resolve) => {
            this._socket.emit('sound:fetch', async (sounds) => {
                await Promise.allSettled(sounds.map(async (s) => await this.cache(s)));
                resolve(sounds);
            });
        });
    }
    updateBoardData(board) {
        this._board = {
            id: board.id,
            auth: board.auth,
            locked: board.locked,
            data: board.data
        };
        this.emit('board:update', {
            locked: this._board.locked,
            auth: this._board.auth,
            data: this._board.data
        });
    }
    setTimeoutReject(reject) {
        return setTimeout(() => {
            reject(new error_js_1.default(error_js_1.default.Errors.Timeout));
        }, this._timeout);
    }
    /** The client id. */
    get id() {
        return this._socket.id;
    }
    /** The current board. */
    get board() {
        return this._board;
    }
    /** Data shared to others clients. */
    get data() {
        return this._clientData;
    }
    set data(value) {
        if (Object.keys(value ?? {}).length === 0)
            value = {};
        if (this._board == null)
            return;
        this._socket.emit('board:client:update', { clientData: this._clientData }, (_, data) => {
            this._clientData = data;
        });
    }
    /** The list of cached sounds. */
    get sounds() {
        return this._cacheManager.list();
    }
    /** Whether the socket is currently connected. */
    get connected() {
        return this._socket.connected;
    }
    /** Whether the socket is currently disconnected. */
    get disconnected() {
        return this._socket.disconnected;
    }
}
exports.Client = Client;
exports.default = Client;
