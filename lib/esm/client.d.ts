import { TypedEmitter } from '@dastan21/tiny-typed-emitter';
import { type Sound, type DefaultSoundData, type InputSound } from './sound_cache.js';
import OSBError from './error.js';
export type KeyValueObject = Record<string, any>;
export type DefaultBoardData = any;
export interface Board<BoardData = DefaultBoardData> {
    id: string;
    auth?: string | null;
    locked: boolean;
    data: BoardData;
}
export interface InputBoard<BoardData = DefaultBoardData> {
    id: string;
    auth?: string | null;
    locked?: boolean;
    data?: BoardData;
}
export interface SocketClient<ClientData extends KeyValueObject = {}> {
    id: string;
    data: ClientData;
}
export interface ClientOptions {
    /** Communication timeout. */
    timeout?: number;
}
export interface BoardOptions<BoardData = DefaultBoardData> {
    /** Client authentication string. */
    auth?: string | null;
    /** Wether the board is locked. */
    locked?: boolean;
    /** Board data. */
    data?: BoardData;
}
interface Emits<ClientData extends KeyValueObject = {}, BoardData = DefaultBoardData, SoundData = DefaultSoundData> {
    /** Fired when the client has connected to the server. */
    'connect': () => void;
    /** Fired when the client has disconnected from the server. */
    'disconnect': (err?: OSBError) => void;
    /** Fired when a client plays a sound. */
    'sound:play': (sound: Sound<SoundData>) => void;
    /** Fired when a client updates a sound data. */
    'sound:update': (sound: Sound<SoundData>) => void;
    /** Fired when a client removes a sound. */
    'sound:remove': (soundId: string) => void;
    /** Fired when the board is updated. */
    'board:update': (boardOptions: BoardOptions<BoardData>) => void;
    /** Fired when a client joins the board. */
    'client:join': (clientData: SocketClient<ClientData>) => void;
    /** Fired when a client updates its data. */
    'client:update': (clientData: SocketClient<ClientData>) => void;
    /** Fired when a client leaves the board. */
    'client:leave': (clientData: SocketClient<ClientData>, reason?: string) => void;
}
/**
 * Client-side class for the OnlineSoundboard project.
 */
declare class Client<ClientData extends KeyValueObject = {}, BoardData = DefaultBoardData, SoundData = DefaultSoundData> extends TypedEmitter<Emits<ClientData, BoardData, SoundData>> {
    /** Default value of communication timeout. */
    static readonly Timeout = 1000;
    private readonly _socket;
    private readonly _cacheManager;
    private readonly _timeout;
    private _board;
    private _clientData;
    /**
     * @param url url of the server
     */
    constructor(url: string, options?: ClientOptions);
    setupListeners(): void;
    /**
     * Create a board.
     * @param options create board options
     */
    create(options?: BoardOptions): Promise<void>;
    /**
     * Join a board.
     * @param boardId the board id
     */
    join(boardId: string, auth?: string): Promise<void>;
    /**
     * Leave the board.
     */
    leave(): Promise<void>;
    /**
     * Connect to the server.
     */
    connect(): void;
    /**
     * Disconnect from the server.
     */
    disconnect(): void;
    /**
     * Cache a sound.
     * @param sound the sound to cache
     * @returns the cached sound id
     */
    cache(sound: InputSound<SoundData>): Promise<string>;
    /**
     * Wether the sound is cached.
     * @param soundId the sound id to check
     */
    isCached(soundId: string): Promise<boolean>;
    /**
     * Wether the sound is cached.
     * @param sound the sound to check
     */
    isCached(sound: Sound<SoundData>): Promise<boolean>;
    /**
     * Broadcast a sound to play.
     * @param soundId the id of the sound to broadcast
     */
    play(soundId: string): void;
    /**
     * Broadcast a sound to play.
     * @param sound the sound to broadcast
     */
    play(sound: Sound<SoundData>): void;
    private playSound;
    private cacheSound;
    private sendSound;
    /**
     * Update the board.
     * @param options board options
     */
    updateBoard(options: BoardOptions<BoardData>): Promise<void>;
    /**
     * Update a sound.
     * @param sound sound to update
     */
    updateSound(sound: Sound<SoundData>): Promise<void>;
    private updateSoundData;
    /**
     * Delete a sound from the cache and in the board.
     * @param soundId the id of the sound to delete
     */
    delete(soundId: string): Promise<void>;
    /**
     * Delete a sound from the cache and in the board.
     * @param sound the sound to delete
     */
    delete(sound: Sound<SoundData>): Promise<void>;
    private deleteSound;
    /**
     * Fetch and cache all sounds from the board.
     */
    fetchSounds(): Promise<Array<Sound<SoundData>>>;
    private updateBoardData;
    private setTimeoutReject;
    /** The client id. */
    get id(): string;
    /** The current board. */
    get board(): Board<BoardData> | null;
    /** Data shared to others clients. */
    get data(): ClientData;
    set data(value: ClientData);
    /** The list of cached sounds. */
    get sounds(): Array<Sound<SoundData>>;
    /** Whether the socket is currently connected. */
    get connected(): boolean;
    /** Whether the socket is currently disconnected. */
    get disconnected(): boolean;
}
export { Client };
export default Client;
