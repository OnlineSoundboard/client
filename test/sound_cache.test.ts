import { beforeEach, describe, expect, it } from 'vitest'
import { InputSound, Sound, SoundCache } from '../src/index'

const cache = new SoundCache()
const audiosBuffer: Record<typeof SoundCache.AllowedAudioFormats[number], Uint8Array[]> = {
  flac: [new Uint8Array([102, 76, 97, 67])],
  m4a: [new Uint8Array([77, 52, 65, 32, 0, 0, 0, 0]), new Uint8Array([0, 0, 0, 0, 102, 116, 121, 112])],
  mp3: [new Uint8Array([73, 68, 51]), new Uint8Array([255, 251, 0]), new Uint8Array([255, 250, 0])],
  wav: [new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69])],
  ogg: [new Uint8Array([79, 103, 103, 83])]
}

describe('SoundCache', () => {
  beforeEach(() => {
    cache.clear()
  })

  describe('new', () => {
    it('should create a sound cache with default values', () => {
      expect(cache instanceof SoundCache).toBe(true)
    })
  })

  describe('#get()', () => {
    it('should get sound', async () => {
      const sound: Sound = { id: 'sound_id', buffer: audiosBuffer.flac[0], ext: 'flac', data: null }
      await cache.add(sound)
      const soundById = await cache.get(sound.id)
      const soundByObject = await cache.get(sound)
      expect(soundById).toEqual(sound)
      expect(soundByObject).toEqual(sound)
    })
    it('should not get unknown sound', async () => {
      const sound: Sound = { id: 'unknown_sound_id', buffer: audiosBuffer.flac[0], ext: 'mp3', data: null }
      const soundById = await cache.get(sound.id)
      const soundByObject = await cache.get(sound)
      expect(soundById).toBe(null)
      expect(soundByObject).toBe(null)
    })
  })

  describe('#list()', () => {
    it('should return the cached sounds list', () => {
      const sounds: Sound[] = [
        { id: 'sound_list1', buffer: audiosBuffer.flac[0], ext: 'flac', data: null },
        { id: 'sound_list2', buffer: audiosBuffer.flac[0], ext: 'flac', data: null },
        { id: 'sound_list3', buffer: audiosBuffer.flac[0], ext: 'flac', data: null }
      ]
      sounds.forEach(s => cache.add(s))
      const list = cache.list()
      expect(list).toEqual(sounds)
    })
  })

  describe('#add()', () => {
    it('should cache sound', async () => {
      const sound: Sound = { id: 'sound_cache', buffer: audiosBuffer.flac[0], ext: 'flac', data: null }
      await cache.add(sound)
      const cachedSound = await cache.get(sound.id)
      expect(cachedSound).toEqual(sound)
    })
    it('should update sound data', async () => {
      const sound: Sound = { id: 'sound_data', buffer: audiosBuffer.flac[0], ext: 'flac', data: { name: 'name', duration: 159 } }
      const updatedSound: Sound = { id: 'sound_data', ext: 'flac', data: { name: 'name2', duration: 26 } }
      await cache.add(sound)
      await cache.add(updatedSound)
      const cachedSound = await cache.get(sound.id)
      expect(cachedSound).toEqual({ ...updatedSound, buffer: sound.buffer })
    })
    it('should not update sound buffer', async () => {
      const sound: Sound = { id: 'sound_data', buffer: audiosBuffer.flac[0], ext: 'flac', data: { name: 'name', duration: 159 } }
      const updatedSound: Sound = { id: 'sound_data', buffer: new ArrayBuffer(1), ext: 'flac', data: { name: 'name2', duration: 26 } }
      await cache.add(sound)
      await cache.add(updatedSound)
      const cachedSound = await cache.get(sound.id)
      expect(cachedSound).toEqual({ ...updatedSound, buffer: sound.buffer })
    })
    it('should throw when caching sound with null buffer', () => {
      const sound = { id: 'sound_buffer_null', data: null }
      return expect(cache.add(sound)).rejects.toEqual(new Error('Sound buffer is null'))
    })
    it('should throw when caching sound with empty buffer', () => {
      const sound = { id: 'sound_buffer_empty', buffer: new ArrayBuffer(0), data: null }
      return expect(cache.add(sound)).rejects.toEqual(new Error('Sound buffer is empty'))
    })
    it('should throw when caching invalid sound format', () => {
      const sound = { id: 'invalid_sound_format', buffer: new Uint8Array([0, 1, 2, 3]), data: null }
      return expect(cache.add(sound)).rejects.toEqual(new Error(`Invalid sound format [${SoundCache.AllowedAudioFormats.join(', ')}]`))
    })
  })

  describe('#remove()', () => {
    it('should remove sound', async () => {
      const sound: Sound = { id: 'sound_remove', buffer: audiosBuffer.flac[0], ext: 'mp3', data: null }
      let isCached = await cache.cached(sound.id)
      expect(isCached).toBe(false)
      await cache.add(sound)
      isCached = await cache.cached(sound.id)
      expect(isCached).toBe(true)
      await cache.remove(sound)
      isCached = await cache.cached(sound.id)
      expect(isCached).toBe(false)
      await cache.remove(sound.id)
      isCached = await cache.cached(sound.id)
      expect(isCached).toBe(false)
        // @ts-expect-error
      isCached = await cache.cached(null)
      expect(isCached).toBe(false)
    })
  })

  describe('#clear()', () => {
    it('should clear the cache', async () => {
      const sound = { id: 'sound_clear', buffer: audiosBuffer.flac[0], data: null }
      await cache.add(sound)
      let list = cache.list()
      expect(list.length).toBeGreaterThan(0)
      cache.clear()
      list = cache.list()
      expect(list).toEqual([])
    })
  })

  describe('#isAudio()', () => {
    it('should not be an allowed audio format', async () => {
      expect(SoundCache.isAudio(new Uint8Array([0, 1, 2, 3]))).toBe(false)
    })
    it('should be allowed audios format', async () => {
      Object.values(audiosBuffer).forEach((bufs) => {
        expect(bufs.every((buf) => SoundCache.isAudio(buf))).toBe(true)
      })
    })
  })
})
