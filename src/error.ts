enum Errors {
  Unknown = -1,
  ServerUrlMissing = 0,
  ConnectionRefused,
  Timeout,
  InvalidArguments,
  InvalidBoardId,
  NotInABoard,
  BoardLocked,
  AuthFailed,
  SoundNotCached,
  SoundCacheFailed
}

type MessagesRecord = Record<number, string>

const Messages: MessagesRecord = {
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
} as const

export interface OSBErrorSerialized {
  name: string
  code: number
  message: string
  cause?: unknown
}

/**
 * Online Soundboard Error.
 */
class OSBError extends Error {
  public static readonly Errors = Errors
  public static readonly Messages = Messages
  public code: number

  /**
   * @param err error instance
   */
  constructor (err: Error | OSBError)
  /**
   * @param code error code
   * @param cause error cause
   */
  constructor (code: number, cause?: unknown)
  constructor (err: Error | OSBError | OSBErrorSerialized | number, cause?: unknown) {
    super()
    this.name = this.constructor.name
    if (typeof err === 'number') {
      this.code = err
      this.cause = cause
      this.message = Messages[this.code] ?? Messages[Errors.Unknown]
    } else {
      this.code = err instanceof Error && !(err instanceof OSBError) ? -1 : err.code
      this.cause = err.cause
      this.message = err.message
    }
  }

  public toString (): string {
    return `[${this.name}: ${this.message}]`
  }

  public toJSON (): OSBErrorSerialized {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      cause: this.cause
    }
  }
}

export { OSBError }
export default OSBError
