declare enum Errors {
    Unknown = -1,
    ServerUrlMissing = 0,
    ConnectionRefused = 1,
    Timeout = 2,
    InvalidArguments = 3,
    InvalidBoardId = 4,
    NotInABoard = 5,
    BoardLocked = 6,
    AuthFailed = 7,
    SoundNotCached = 8,
    SoundCacheFailed = 9
}
type MessagesRecord = Record<number, string>;
export interface OSBErrorSerialized {
    name: string;
    code: number;
    message: string;
    cause?: unknown;
}
/**
 * Online Soundboard Error.
 */
declare class OSBError extends Error {
    static readonly Errors: typeof Errors;
    static readonly Messages: MessagesRecord;
    code: number;
    /**
     * @param err error instance
     */
    constructor(err: Error | OSBError);
    /**
     * @param code error code
     * @param cause error cause
     */
    constructor(code: number, cause?: unknown);
    toString(): string;
    toJSON(): OSBErrorSerialized;
}
export { OSBError };
export default OSBError;
