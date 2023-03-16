"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OSBError = void 0;
var Errors;
(function (Errors) {
    Errors[Errors["Unknown"] = -1] = "Unknown";
    Errors[Errors["ServerUrlMissing"] = 0] = "ServerUrlMissing";
    Errors[Errors["ConnectionRefused"] = 1] = "ConnectionRefused";
    Errors[Errors["Timeout"] = 2] = "Timeout";
    Errors[Errors["InvalidArguments"] = 3] = "InvalidArguments";
    Errors[Errors["InvalidBoardId"] = 4] = "InvalidBoardId";
    Errors[Errors["NotInABoard"] = 5] = "NotInABoard";
    Errors[Errors["BoardLocked"] = 6] = "BoardLocked";
    Errors[Errors["AuthFailed"] = 7] = "AuthFailed";
    Errors[Errors["SoundNotCached"] = 8] = "SoundNotCached";
    Errors[Errors["SoundCacheFailed"] = 9] = "SoundCacheFailed";
})(Errors || (Errors = {}));
const Messages = {
    [Errors.Unknown]: 'Unknown error',
    [Errors.ServerUrlMissing]: 'URL is missing',
    [Errors.ConnectionRefused]: 'Could not connect to the server',
    [Errors.Timeout]: 'Timed out',
    [Errors.InvalidArguments]: 'Invalid arguments',
    [Errors.InvalidBoardId]: 'Invalid board id',
    [Errors.NotInABoard]: 'Not in a board',
    [Errors.BoardLocked]: 'Board is locked',
    [Errors.AuthFailed]: 'Authentication failed',
    [Errors.SoundNotCached]: 'Sound is not cached',
    [Errors.SoundCacheFailed]: 'Failed to cache the sound'
};
/**
 * Online Soundboard Error.
 */
class OSBError extends Error {
    static Errors = Errors;
    static Messages = Messages;
    code;
    constructor(err, cause) {
        super();
        this.name = this.constructor.name;
        if (typeof err === 'number') {
            this.code = err;
            this.cause = cause;
            this.message = Messages[this.code] ?? Messages[Errors.Unknown];
        }
        else {
            this.code = err instanceof Error && !(err instanceof OSBError) ? -1 : err.code;
            this.cause = err.cause;
            this.message = err.message;
        }
    }
    toString() {
        return `[${this.name}: ${this.message}]`;
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            cause: this.cause
        };
    }
}
exports.OSBError = OSBError;
exports.default = OSBError;
