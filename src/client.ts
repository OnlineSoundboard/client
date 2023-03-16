import { io, type Socket } from 'socket.io-client'
import { TypedEmitter } from '@dastan21/tiny-typed-emitter'
import { type ClientToServerEvents, type ServerToClientEvents } from './index.js'
import { SoundCache, type Sound, type DefaultSoundData, type InputSound } from './sound_cache.js'
import OSBError from './error.js'

export type KeyValueObject = Record<string, any>

export type DefaultBoardData = any

export interface Board<BoardData = DefaultBoardData> {
  id: string
  auth?: string | null
  locked: boolean
  data: BoardData
}

export interface InputBoard<BoardData = DefaultBoardData> {
  id: string
  auth?: string | null
  locked?: boolean
  data?: BoardData
}

export interface SocketClient<ClientData extends KeyValueObject = {}> {
  id: string
  data: ClientData
}

export interface ClientOptions {
  /** Communication timeout. */
  timeout?: number
}

export interface BoardOptions<BoardData = DefaultBoardData> {
  /** Client authentication string. */
  auth?: string | null
  /** Wether the board is locked. */
  locked?: boolean
  /** Board data. */
  data?: BoardData
}

interface Emits<ClientData extends KeyValueObject = {}, BoardData = DefaultBoardData, SoundData = DefaultSoundData> {
  /** Fired when the client has connected to the server. */
  'connect': () => void
  /** Fired when the client has disconnected from the server. */
  'disconnect': (err?: OSBError) => void
  /** Fired when a client plays a sound. */
  'sound:play': (sound: Sound<SoundData>) => void
  /** Fired when a client updates a sound data. */
  'sound:update': (sound: Sound<SoundData>) => void
  /** Fired when a client removes a sound. */
  'sound:remove': (soundId: string) => void
  /** Fired when the board is updated. */
  'board:update': (boardOptions: BoardOptions<BoardData>) => void
  /** Fired when a client joins the board. */
  'client:join': (clientData: SocketClient<ClientData>) => void
  /** Fired when a client updates its data. */
  'client:update': (clientData: SocketClient<ClientData>) => void
  /** Fired when a client leaves the board. */
  'client:leave': (clientData: SocketClient<ClientData>, reason?: string) => void
}

/**
 * Client-side class for the OnlineSoundboard project.
 */
class Client<ClientData extends KeyValueObject = {}, BoardData = DefaultBoardData, SoundData = DefaultSoundData> extends TypedEmitter<Emits<ClientData, BoardData, SoundData>> {
  /** Default value of communication timeout. */
  public static readonly Timeout = 1000

  private readonly _socket: Socket<ServerToClientEvents<ClientData, BoardData, SoundData>, ClientToServerEvents<ClientData, BoardData, SoundData>>
  private readonly _cacheManager: SoundCache
  private readonly _timeout: number

  private _board: Board<BoardData> | null
  private _clientData: ClientData

  /**
   * @param url url of the server
   */
  constructor (url: string, options: ClientOptions = {}) {
    super()
    this._timeout = options.timeout ?? Client.Timeout
    this._cacheManager = new SoundCache<SoundData>()
    this._board = null
    this._clientData = {} as any

    if (url == null || url === '') throw new OSBError(OSBError.Errors.ServerUrlMissing)
    this._socket = io(url, { timeout: this._timeout })

    this.setupListeners()
  }

  setupListeners (): void {
    this._socket.on('connect', () => this.emit('connect'))
    this._socket.on('connect_error', () => this.emit('disconnect', new OSBError(OSBError.Errors.ConnectionRefused)))
    this._socket.on('disconnect', () => this.emit('disconnect'))

    this._socket.on('board:joined', ({ client }) => this.emit('client:join', client))
    this._socket.on('board:left', ({ client }) => this.emit('client:leave', client))
    this._socket.on('board:updated', ({ board }) => this.updateBoardData(board))
    this._socket.on('board:client:updated', ({ client }) => this.emit('client:update', client))

    this._socket.on('sound:played', ({ soundId }) => this.playSound(soundId))
    this._socket.on('sound:missing', ({ soundId }, callback) => this.sendSound(soundId, callback))
    this._socket.on('sound:updated', ({ sound }) => this.updateSoundData(sound))
    this._socket.on('sound:deleted', ({ soundId }) => this.deleteSound(soundId))
    this._socket.on('sound:fetch', (callback) => callback(this.sounds))
  }

  /**
   * Create a board.
   * @param options create board options
   */
  public async create (options?: BoardOptions): Promise<void> {
    this.connect()
    return await new Promise<void>((resolve, reject) => {
      const to = this.setTimeoutReject(reject)
      this._socket.emit('board:create', {
        clientData: this._clientData,
        boardData: options?.data,
        auth: options?.auth,
        locked: options?.locked
      }, (err, board) => {
        clearTimeout(to)
        if (err != null) return reject(new OSBError(err))
        this._board = board
        resolve()
      })
    }).catch(err => {
      this.disconnect()
      throw err
    })
  }

  /**
   * Join a board.
   * @param boardId the board id
   */
  public async join (boardId: string, auth?: string): Promise<void> {
    this.connect()
    return await new Promise<void>((resolve, reject) => {
      const to = this.setTimeoutReject(reject)
      this._socket.emit('board:join', {
        clientData: this._clientData,
        boardId,
        auth
      }, (err, board) => {
        clearTimeout(to)
        if (err != null) return reject(new OSBError(err))
        this._board = board
        resolve()
      })
    }).catch(err => {
      this.disconnect()
      throw err
    })
  }

  /**
   * Leave the board.
   */
  public async leave (): Promise<void> {
    return await new Promise((resolve, reject) => {
      const to = this.setTimeoutReject(reject)
      this._socket.emit('board:leave', () => {
        clearTimeout(to)
        this._board = null
        resolve()
      })
    })
  }

  /**
   * Connect to the server.
   */
  public connect (): void {
    this._socket.connect()
  }

  /**
   * Disconnect from the server.
   */
  public disconnect (): void {
    this._socket.disconnect()
  }

  /**
   * Cache a sound.
   * @param sound the sound to cache
   * @returns the cached sound id
   */
  public async cache (sound: InputSound<SoundData>): Promise<string> {
    return await new Promise((resolve, reject) => {
      this._cacheManager.add(sound).then((cachedSound) => {
        resolve((cachedSound).id)
      }).catch((err) => {
        reject(new OSBError(OSBError.Errors.SoundCacheFailed, (err as Error).message))
      })
    })
  }

  /**
   * Wether the sound is cached.
   * @param soundId the sound id to check
   */
  public isCached (soundId: string): Promise<boolean>
  /**
   * Wether the sound is cached.
   * @param sound the sound to check
   */
  public isCached (sound: Sound<SoundData>): Promise<boolean>
  public async isCached (sound: Sound<SoundData> | string): Promise<boolean> {
    const soundId = typeof sound === 'string' ? sound : sound.id
    return await this._cacheManager.cached(soundId)
  }

  /**
   * Broadcast a sound to play.
   * @param soundId the id of the sound to broadcast
   */
  public play (soundId: string): void
  /**
   * Broadcast a sound to play.
   * @param sound the sound to broadcast
   */
  public play (sound: Sound<SoundData>): void
  public play (sound: Sound<SoundData> | string): void {
    const soundId = typeof sound === 'string' ? sound : sound.id
    void this._cacheManager.get(soundId).then((cachedSound) => {
      if (cachedSound == null) throw new OSBError(OSBError.Errors.SoundNotCached, soundId)
      this._socket.emit('sound:play', { soundId })
    })
  }

  private playSound (soundId: string): void {
    void this._cacheManager.get(soundId).then((cachedSound) => {
      if (cachedSound != null) {
        this.emit('sound:play', cachedSound)
      } else {
        void this.cacheSound(soundId).then((sound) => {
          this.emit('sound:play', sound)
        })
      }
    })
  }

  private async cacheSound (soundId: string): Promise<Sound<SoundData>> {
    return await new Promise((resolve, reject) => {
      this._socket.emit('sound:missing', { soundId }, (err, sound) => {
        if (err != null) return reject(new OSBError(err))
        this._cacheManager.add(sound).then(() => {
          resolve(sound)
        }).catch(/* istanbul ignore next */ (err) => reject(err))
      })
    })
  }

  private sendSound (soundId: string, callback: (err: OSBError | null, sound: Sound<SoundData>) => void): void {
    void this._cacheManager.get(soundId).then((sound) => {
      if (sound == null) return callback(new OSBError(OSBError.Errors.SoundNotCached, soundId), null as any)
      callback(null, sound)
    })
  }

  /**
   * Update the board.
   * @param options board options
   */
  public async updateBoard (options: BoardOptions<BoardData>): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (this._board == null) return reject(new OSBError(OSBError.Errors.NotInABoard))
      const to = this.setTimeoutReject(reject)
      this._socket.emit('board:update', { options }, (err, updatedBoard) => {
        clearTimeout(to)
        /* istanbul ignore next */
        if (err != null) return reject(new OSBError(err))
        this._board = updatedBoard
        resolve()
      })
    })
  }

  /**
   * Update a sound.
   * @param sound sound to update
   */
  public async updateSound (sound: Sound<SoundData>): Promise<void> {
    const cachedSound = await this._cacheManager.get(sound.id)
    return await new Promise((resolve, reject) => {
      const to = this.setTimeoutReject(reject)
      if (cachedSound == null) {
        clearTimeout(to)
        reject(new OSBError(OSBError.Errors.SoundNotCached, sound.id))
        return
      }
      this._socket.emit('sound:update', { sound: { id: sound.id, data: sound.data, ext: sound.ext } }, () => {
        clearTimeout(to)
        resolve()
      })
    })
  }

  private updateSoundData (sound: Sound<SoundData>): void {
    void this._cacheManager.add(sound)
    this.emit('sound:update', sound)
  }

  /**
   * Delete a sound from the cache and in the board.
   * @param soundId the id of the sound to delete
   */
  public async delete (soundId: string): Promise<void>
  /**
   * Delete a sound from the cache and in the board.
   * @param sound the sound to delete
   */
  public async delete (sound: Sound<SoundData>): Promise<void>
  public async delete (sound: Sound<SoundData> | string): Promise<void> {
    const soundId = typeof sound === 'string' ? sound : sound.id
    return await new Promise((resolve, reject) => {
      const to = this.setTimeoutReject(reject)
      this._socket.emit('sound:delete', { soundId }, () => {
        clearTimeout(to)
        resolve()
      })
    })
  }

  private deleteSound (soundId: string): void {
    void this._cacheManager.get(soundId).then((removedSound) => {
      if (removedSound == null) return
      void this._cacheManager.remove(soundId).then(() => {
        this.emit('sound:remove', soundId)
      })
    })
  }

  /**
   * Fetch and cache all sounds from the board.
   */
  public async fetchSounds (): Promise<Array<Sound<SoundData>>> {
    return await new Promise((resolve) => {
      this._socket.emit('sound:fetch', async (sounds) => {
        await Promise.allSettled(sounds.map(async (s) => await this.cache(s)))
        resolve(sounds)
      })
    })
  }

  private updateBoardData (board: Board): void {
    this._board = {
      id: board.id,
      auth: board.auth,
      locked: board.locked,
      data: board.data
    }
    this.emit('board:update', {
      locked: this._board.locked,
      auth: this._board.auth,
      data: this._board.data
    })
  }

  private setTimeoutReject (reject: (reason?: any) => void): NodeJS.Timeout {
    return setTimeout(() => {
      reject(new OSBError(OSBError.Errors.Timeout))
    }, this._timeout)
  }

  /** The client id. */
  public get id (): string {
    return this._socket.id
  }

  /** The current board. */
  public get board (): Board<BoardData> | null {
    return this._board
  }

  /** Data shared to others clients. */
  public get data (): ClientData {
    return this._clientData
  }

  public set data (value) {
    if (Object.keys(value ?? {}).length === 0) value = {} as any
    if (this._board == null) return
    this._socket.emit('board:client:update', { clientData: this._clientData }, (_, data) => {
      this._clientData = data
    })
  }

  /** The list of cached sounds. */
  public get sounds (): Array<Sound<SoundData>> {
    return this._cacheManager.list()
  }

  /** Whether the socket is currently connected. */
  public get connected (): boolean {
    return this._socket.connected
  }

  /** Whether the socket is currently disconnected. */
  public get disconnected (): boolean {
    return this._socket.disconnected
  }
}

export { Client }
export default Client
