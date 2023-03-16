/* istanbul ignore file */

import {
  Client,
  type KeyValueObject,
  type SocketClient,
  type DefaultBoardData,
  type Board,
  type BoardOptions
} from './client.js'
import SoundCache, { type Sound, type DefaultSoundData } from './sound_cache.js'
import OSBError, { type OSBErrorSerialized } from './error.js'

export interface ClientToServerEvents<ClientData extends KeyValueObject = {}, BoardData = DefaultBoardData, SoundData = DefaultSoundData> {
  'board:create': (args: { clientData: ClientData, boardData: BoardData, auth?: string | null, locked?: boolean }, callback: (err: OSBErrorSerialized | null, board: Board) => void) => void
  'board:join': (args: { clientData: ClientData, boardId: string, auth?: string }, callback: (err: OSBErrorSerialized | null, board: Board) => void) => void
  'board:leave': (callback: () => void) => void
  'board:update': (args: { options: BoardOptions<BoardData> }, callback: (err: OSBErrorSerialized | null, board: Board<BoardData>) => void) => void
  'board:client:update': (args: { clientData: ClientData }, callback: (err: OSBErrorSerialized | null, clientData: ClientData) => void) => void

  'sound:play': (args: { soundId: string }) => void
  'sound:missing': (args: { soundId: string }, callback: (err: OSBErrorSerialized | null, sound: Sound<SoundData>) => void) => void
  'sound:update': (args: { sound: Sound<SoundData> }, callback: (err: OSBErrorSerialized | null) => void) => void
  'sound:delete': (args: { soundId: string }, callback: (err: OSBErrorSerialized | null) => void) => void
  'sound:fetch': (callback: (sounds: Array<Sound<SoundData>>) => void) => void
}

export interface ServerToClientEvents<ClientData extends KeyValueObject = {}, BoardData = DefaultBoardData, SoundData = DefaultSoundData> {
  'error': (code: number, cause?: any) => void

  'board:joined': (args: { client: SocketClient<ClientData> }) => void
  'board:left': (args: { client: SocketClient<ClientData> }) => void
  'board:updated': (args: { board: Board<BoardData> }) => void
  'board:client:updated': (args: { client: SocketClient<ClientData> }) => void

  'sound:played': (args: { soundId: string }) => void
  'sound:updated': (args: { sound: Sound<SoundData> }) => void
  'sound:missing': (args: { soundId: string }, callback: (err: OSBErrorSerialized | null, sound: Sound<SoundData>) => void) => void
  'sound:deleted': (args: { soundId: string }) => void
  'sound:fetch': (callback: (sounds: Array<Sound<SoundData>>) => void) => void
}

export declare type ServerSideEvents = Object

export interface SocketData<ClientData extends KeyValueObject = {}> {
  board: Board
  clientData: ClientData
  playedSounds: Record<string, boolean>
}

export * from './client.js'
export * from './sound_cache.js'
export * from './error.js'
export default { Client, SoundCache, OSBError }
