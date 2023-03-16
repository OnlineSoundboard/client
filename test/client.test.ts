import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Client, InputSound, OSBError, Sound, SoundCache, type ClientOptions } from '../src/index'

const SERVER_URL = 'ws://localhost:1212'

const clients: Array<Client> = []
const createClient = (options?: ClientOptions) => {
  const client = new Client(SERVER_URL, options)
  clients.push(client)
  return client
}
const wait = (delay = 100) => new Promise((resolve) => setTimeout(resolve, delay))

describe('Client', () => {
  afterAll(() => {
    clients.forEach(c => c.disconnect())
    clients.splice(0, clients.length)
  })

  describe('new', () => {
    it('should throw when url is empty', () => {
      expect(() => new Client('')).toThrowError(new OSBError(OSBError.Errors.ServerUrlMissing))
    })
    it('should emit error when server url is wrong', () => {
      return new Promise<void>((resolve) => {
        const client = new Client('invalid')
        client.once('disconnect', (err) => {
          expect(err?.code).toBe(OSBError.Errors.ConnectionRefused)
          expect(err?.message).toBe(OSBError.Messages[OSBError.Errors.ConnectionRefused])
          client.disconnect()
          resolve()
        })
      })
    })
  })

  describe('#create()', () => {
    it('should create and join a board', async () => {
      const client = createClient()
      await client.create()
      expect(client.board !== null).toBe(true)
    })
    it('should not create a new board', async () => {
      const client = createClient()
      await client.create()
      const boardId = client.board?.id
      await client.create()
      const newBoardId = client.board?.id
      expect(newBoardId).toBe(boardId)
    })
    it('should reconnect to the server when creating a board', async () => {
      const client = createClient()
      client.disconnect()
      expect(client.disconnected).toBe(true)
      await client.create()
      expect(client.connected).toBe(true)
    })
    it('should reject when passing invalid auth type', () => {
      const client = createClient()
      return expect(async () => {
        // @ts-expect-error
        await client.create({ auth: 4 })
      }).rejects.toEqual(new OSBError(OSBError.Errors.InvalidArguments, { clientData: client.data, auth: 4 }))
    })
    it('should create a board with auth', async () => {
      const passwd = 'secret'
      const client = createClient()
      await client.create({ auth: passwd })
      expect(client.board?.auth).not.toBe(null)
    })
    it('should create a locked board', async () => {
      const client = createClient()
      await client.create({ locked: true })
      expect(client.board?.locked).toBe(true)
    })
  })

  describe('#join()', () => {
    it('should reject when joining invalid board id', () => {
      const boardId = '123456'
      return expect(async () => {
        const client = createClient()
        await client.join(boardId)
      }).rejects.toEqual(new OSBError(OSBError.Errors.InvalidBoardId, boardId))
    })
    it('should join a board', async () => {
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      expect(client2.board?.id).toBe(client1.board?.id)
    })
    it('should join another board', async () => {
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      await client2.create()
      const boardId = client2.board?.id
      // @ts-expect-error
      await client2.join(client1.board?.id)
      expect(client2.board?.id).not.toBe(boardId)
      expect(client2.board?.id).toBe(client1.board?.id)
    })
    it('should reconnect to the server when joining a board', async () => {
      const client1 = createClient()
      const client2 = createClient()
      client2.disconnect()
      expect(client2.disconnected).toBe(true)
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      expect(client2.connected).toBe(true)
    })
    it('should broadcast event [join] when joining board', async () => {
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      return await new Promise<void>(async (resolve) => {
        client1.once('client:join', (clientData) => {
          expect(clientData).toEqual({ id: client2.id, data: client2.data })
          resolve()
        })
        // @ts-expect-error
        await client2.join(client1.board?.id)
      })
    })
    it('should join a board with auth', async () => {
      const passwd = 'secret'
      const client1 = createClient()
      const client2 = createClient()
      await client1.create({ auth: passwd })
      // @ts-expect-error
      await client2.join(client1.board?.id, passwd)
      expect(client2.board).toEqual(client1.board)
    })
    it('should reject when joining a board with wrong auth', async () => {
      const auth = 'secret'
      const wrongAuth = 'wrong_secret'
      const client1 = createClient()
      const client2 = createClient()
      await client1.create({ auth })
      return expect(async () => {
        // @ts-expect-error
        await client2.join(client1.board?.id, wrongAuth)
      }).rejects.toEqual(new OSBError(OSBError.Errors.AuthFailed, wrongAuth))
    })
    it('should reject when joining a locked board', async () => {
      const client1 = createClient()
      const client2 = createClient()
      await client1.create({ locked: true })
      return expect(async () => {
        // @ts-expect-error
        await client2.join(client1.board?.id)
      }).rejects.toEqual(new OSBError(OSBError.Errors.BoardLocked, client1.board?.id))
    })
  })

  describe('#leave()', () => {
    it('should leave the current board', async () => {
      const client = createClient()
      await client.create()
      await client.leave()
      expect(client.board).toBe(null)
    })
    it('should broadcast event [leave] when leaving a board', async () => {
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      return await new Promise<void>(async (resolve) => {
        client1.once('client:leave', (clientData) => {
          expect(clientData).toEqual({ id: client2.id, data: client2.data })
          resolve()
        })
        await client2.leave()
      })
    })
  })

  describe('#disconnect()', () => {
    it('should disconnect from the server', async () => {
      const client = new Client(SERVER_URL)
      return await new Promise<void>(async (resolve) => {
        await wait(100)
        expect(client.disconnected).toBe(false)
        client.disconnect()
        await wait(100)
        expect(client.disconnected).toBe(true)
        resolve()
      })
    })
    it('should broadcast event [leave] when disconnecting', async () => {
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      const client2Id = client2.id
      return await new Promise<void>((resolve) => {
        client1.once('client:leave', (clientData) => {
          expect(clientData).toEqual({ id: client2Id, data: client2.data })
          resolve()
        })
        client2.disconnect()
      })
    })
  })

  describe('#data', () => {
    it('should broadcast event [client:update] when updating client data', async () => {
      const client1 = createClient()
      const client2 = createClient()
      client2.data = { name: 'john doe', age: 24 }
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      return await new Promise<void>((resolve) => {
        const data = { name: 'johnathan doe', age: 21 }
        client1.once('client:update', (clientData) => {
          expect(clientData).toEqual({ id: client2.id, data: client2.data })
          resolve()
        })
        client2.data = data
      })
    })
    it('should broadcast event [client:update] when updating client data to null', async () => {
      const client1 = createClient()
      const client2 = createClient()
      client2.data = { name: 'john doe', age: 24 }
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      return await new Promise<void>((resolve) => {
        client1.once('client:update', (clientData) => {
          expect(clientData).toEqual({ id: client2.id, data: {} })
          resolve()
        })
        // @ts-expect-error
        client2.data = null
      })
    })
  })

  describe('#sounds', () => {
    it('should return the correct list of cached sounds', async () => {
      const client = createClient()
      const sounds: Sound[] = [
        { id: 'sound1', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: null },
        { id: 'sound2', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: null },
        { id: 'sound3', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: null }
      ]
      await Promise.all(sounds.map(s => client.cache(s)))
      expect(sounds).toEqual(client.sounds)
    })
  })

  describe('#cache()', () => {
    it('should cache a sound', async () => {
      const client = createClient()
      const sound: InputSound = { id: 'sound', buffer: new Uint8Array([73, 68, 51]) }
      const soundId = await client.cache(sound)
      expect(soundId).toBe('sound')
    })
    it('should cache a sound without id', async () => {
      const client = createClient()
      const sound: InputSound = { buffer: new Uint8Array([73, 68, 51]) }
      const soundId = await client.cache(sound)
      expect(typeof soundId).toBe('string')
      expect(await client.isCached(soundId)).toBe(true)
      // @ts-expect-error
      expect(await client.isCached(sound)).toBe(true)
      expect(sound).toEqual({ id: soundId, buffer: sound.buffer })
    })
    it('should reject when caching an invalid sound', async () => {
      const client = createClient()
      const sound1 = { id: 'sound1' }
      expect(client.cache(sound1)).rejects.toEqual(new OSBError(OSBError.Errors.SoundCacheFailed, 'Sound buffer is null'))
      const sound2 = { id: 'sound2', buffer: new Uint8Array() }
      expect(client.cache(sound2)).rejects.toEqual(new OSBError(OSBError.Errors.SoundCacheFailed, 'Sound buffer is empty'))
      const sound3 = { id: 'sound3', buffer: new Uint8Array([0, 1, 2, 3]) }
      expect(client.cache(sound3)).rejects.toEqual(new OSBError(OSBError.Errors.SoundCacheFailed, `Invalid sound format [${SoundCache.AllowedAudioFormats.join(', ')}]`))
    })
  })

  describe('#play()', () => {
    it('should broadcast [sound:play] when playing a sound', async () => {
      const sound1: Sound = { id: 'sound1', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: null }
      const sound2: Sound = { id: 'sound2', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: null }
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      await client1.cache(sound1)
      await client2.cache(sound1)
      await client1.cache(sound2)
      await client2.cache(sound2)
      return await new Promise<void>(async (resolve) => {
        client2.once('sound:play', async (sound1Played) => {
          expect(sound1).toEqual({ ...sound1Played, buffer: new Uint8Array(sound1Played.buffer ?? []) })
          resolve()
          client2.once('sound:play', async (sound2Played) => {
            expect(sound2).toEqual({ ...sound2Played, buffer: new Uint8Array(sound2Played.buffer ?? []) })
            resolve()
          })
          client1.play(sound2)
        })
        client1.play(sound1.id)
      })
    })
    it('should cache missing sound', async () => {
      const sound: Sound = { id: 'sound', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: undefined }
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      await client1.cache(sound)
      return await new Promise<void>(async (resolve) => {
        client2.once('sound:play', async (soundPlayed) => {
          expect(await client1.isCached(soundPlayed)).toBe(true)
          resolve()
        })
        client1.play(sound)
      })
    })
    it('should not emit [sound:play] when playing a sound that is not cached', async () => {
      const soundId = 'sound_not_cached'
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      return await new Promise<void>(async (resolve) => {
        const to = setTimeout(resolve, Client.Timeout)
        client2.once('sound:play', () => {
          clearTimeout(to)
          throw 'was not supposed to emit [sound:play]'
        })
        expect(() => client1.play(soundId)).toThrowError(new OSBError(OSBError.Errors.SoundNotCached, soundId))
      })
    })
    it('should reject when sending a sound that is not cached', async () => {
      const sound = { id: 'sound', buffer: new Uint8Array([73, 68, 51]) }
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      await client1.cache(sound)
      return await new Promise<void>(async (resolve) => {
        const to = setTimeout(resolve, Client.Timeout)
        client2.once('sound:play', () => {
          clearTimeout(to)
          throw 'was not supposed to emit [sound:play]'
        })
        client1.delete(sound.id)
        expect(() => client1.play(sound.id)).toThrowError(new OSBError(OSBError.Errors.SoundNotCached, sound.id))
      })
    })
  })

  describe('#updateSound()', () => {
    it('should not update sound data when playing a sound', async () => {
      const sound: Sound = { id: 'sound', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: 'super sound!' }
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      await client2.cache(sound)
      await client1.cache({ ...sound, data: 'awesome sound!' })
      return await new Promise<void>(async (resolve) => {
        client2.once('sound:play', (soundPlayed) => {
          expect(sound).toEqual(soundPlayed)
          resolve()
        })
        client1.play(sound)
      })
    })
    it('should update sound data', async () => {
      const sound: Sound = { id: 'sound', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: 'super sound!' }
      const newSound = { ...sound, data: 'awesome sound!' }
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      await client1.cache(sound)
      await client2.cache(sound)
      return await new Promise<void>(async (resolve) => {
        client2.once('sound:play', (soundPlayed) => {
          expect(soundPlayed).toEqual({ ...newSound, buffer: new Uint8Array(soundPlayed.buffer ?? []) })
          resolve()
        })
        await client1.updateSound(newSound)
        client1.play(sound)
      })
    })
    it('should broadcast event [sound:update] when updating sound data', async () => {
      const sound: Sound = { id: 'sound', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: 'super sound!' }
      const newSound: Sound = { ...sound, data: 'awesome sound!' }
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      await client1.cache(sound)
      await client2.cache(sound)
      return await new Promise<void>(async (resolve) => {
        client2.once('sound:update', (soundUpdated) => {
          expect(soundUpdated.data).toEqual(newSound.data)
          resolve()
        })
        await client1.updateSound(newSound)
      })
    })
    it('should reject when updating a sound that is not cached', async () => {
      const sound: Sound = { id: 'unknown', ext: 'mp3', data: undefined }
      const client = createClient()
      expect(client.updateSound(sound)).rejects.toEqual(new OSBError(OSBError.Errors.SoundNotCached, sound.id))
    })
  })

  describe('#updateBoard()', () => {
    it('should update board data', async () => {
      const boardUpdate = { locked: true, data: { name: 'board' } }
      const client = createClient()
      await client.create()
      const board = client.board
      await client.updateBoard(boardUpdate)
      expect(client.board).toEqual({ ...board, ...boardUpdate })
    })
    it('should delete board auth', async () => {
      const boardUpdate = { auth: null }
      const client = createClient()
      await client.create({ auth: 'password' })
      expect(client.board?.auth != null).toBe(true)
      await client.updateBoard(boardUpdate)
      expect(client.board?.auth).toBe(undefined)
    })
    it('should broadcast event [board:update] when updating board data', async () => {
      const boardUpdate = { data: { name: 'board' } }
      const client1 = createClient()
      const client2 = createClient()
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      return await new Promise<void>(async (resolve) => {
        client2.once('board:update', (updatedBoardOptions) => {
          expect(client1.board?.locked).toBe(updatedBoardOptions.locked)
          expect(client1.board?.auth).toBe(updatedBoardOptions.auth)
          expect(client1.board?.data).toEqual(updatedBoardOptions.data)
          resolve()
        })
        await client1.updateBoard(boardUpdate)
      })
    })
    it('should reject not update board when not in a board', async () => {
      const client = createClient()
      expect(async () => {
        // @ts-expect-error
        await client.updateBoard('')
      }).rejects.toEqual(new OSBError(OSBError.Errors.NotInABoard))
    })
  })

  describe('#delete()', () => {
    it('should delete a sound', async () => {
      const client1 = createClient()
      const client2 = createClient()
      const client3 = createClient()
      const sound1: Sound = { id: 'sound1', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: undefined }
      const sound2: Sound = { id: 'sound2', buffer: new Uint8Array([73, 68, 51]), ext: 'mp3', data: undefined }
      await client1.create()
      // @ts-expect-error
      await client2.join(client1.board?.id)
      // @ts-expect-error
      await client3.join(client1.board?.id)
      await client1.cache(sound1)
      await client2.cache(sound1)
      await client1.cache(sound2)
      await client3.cache(sound2)
      expect(await client1.isCached(sound1)).toBe(true)
      expect(await client2.isCached(sound1)).toBe(true)
      expect(await client1.isCached(sound2)).toBe(true)
      expect(await client3.isCached(sound2)).toBe(true)
      await client1.delete(sound1)
      await client1.delete(sound2.id)
      await wait(Client.Timeout)
      await wait(Client.Timeout)
      expect(await client1.isCached(sound1)).toBe(false)
      expect(await client2.isCached(sound1)).toBe(false)
      expect(await client1.isCached(sound2)).toBe(false)
      expect(await client3.isCached(sound2)).toBe(false)
    })
  })
})