import { CacheManager } from './cache.js';
const ALLOWED_AUDIO_FORMATS = ['mp3', 'flac', 'm4a', 'wav', 'ogg'];
const AudioFormatRules = {
    flac: (buf) => buf.length >= 4 && (buf[0] === 102 && buf[1] === 76 && buf[2] === 97 && buf[3] === 67),
    m4a: (buf) => buf.length >= 8 && ((buf[4] === 102 && buf[5] === 116 && buf[6] === 121 && buf[7] === 112) || (buf[0] === 77 && buf[1] === 52 && buf[2] === 65 && buf[3] === 32)),
    mp3: (buf) => buf.length >= 3 && ((buf[0] === 73 && buf[1] === 68 && buf[2] === 51) || (buf[0] === 255 && (buf[1] === 251 || buf[1] === 250))),
    wav: (buf) => buf.length >= 12 && (buf[0] === 82 && buf[1] === 73 && buf[2] === 70 && buf[3] === 70 && buf[8] === 87 && buf[9] === 65 && buf[10] === 86 && buf[11] === 69),
    ogg: (buf) => buf.length >= 4 && (buf[0] === 79 && buf[1] === 103 && buf[2] === 103 && buf[3] === 83)
};
/**
 * Class for caching sounds.
 */
class SoundCache extends CacheManager {
    static AllowedAudioFormats = ALLOWED_AUDIO_FORMATS;
    static isAudio(buffer) {
        return SoundCache.getAudioExt(buffer) != null;
    }
    static getAudioExt(buffer) {
        for (const ext in AudioFormatRules) {
            if (AudioFormatRules[ext](buffer))
                return ext;
        }
        return null;
    }
    /**
     * Caches a sound.
     * @param sound the sound to cache
     */
    async add(sound) {
        if (sound.id == null || sound.id === '')
            sound.id = (Math.random() + 1).toString(36).substring(2);
        const cachedSound = this._items.get(sound.id);
        if (cachedSound != null) {
            cachedSound.data = sound.data;
            return cachedSound;
        }
        if (sound.buffer == null)
            throw new Error('Sound buffer is null');
        if (sound.buffer.byteLength <= 0)
            throw new Error('Sound buffer is empty');
        if (!SoundCache.isAudio(new Uint8Array(sound.buffer)))
            throw new Error(`Invalid sound format [${SoundCache.AllowedAudioFormats.join(', ')}]`);
        const soundToCache = {
            id: sound.id,
            ext: SoundCache.getAudioExt(new Uint8Array(sound.buffer)),
            buffer: sound.buffer,
            data: sound.data
        };
        this._items.set(sound.id, soundToCache);
        return soundToCache;
    }
    async get(sound) {
        const soundId = typeof sound === 'string' ? sound : sound.id;
        if (soundId == null || soundId === '')
            return null;
        const isCached = await this.cached(soundId);
        if (!isCached)
            return null;
        return this._items.get(soundId);
    }
    /**
     * Whether the sound is cached.
     * @param soundId id of the sound to check
     */
    async cached(soundId) {
        if (soundId == null)
            return false;
        return this._items.get(soundId) != null;
    }
    async remove(sound) {
        const soundId = typeof sound === 'string' ? sound : sound.id;
        const isCached = await this.cached(soundId);
        if (!isCached)
            return;
        this._items.delete(soundId);
    }
    async clear() {
        this._items.clear();
    }
}
export { SoundCache };
export default SoundCache;
