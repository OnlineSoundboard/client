import { CacheManager } from './cache.js';
export type DefaultSoundData = any;
export interface Sound<SoundData = DefaultSoundData> {
    id: string;
    data: SoundData;
    ext: AudioFormat;
    buffer?: ArrayBuffer;
}
export interface InputSound<SoundData = DefaultSoundData> {
    id?: string;
    data?: SoundData;
    ext?: AudioFormat;
    buffer?: ArrayBuffer;
}
declare const ALLOWED_AUDIO_FORMATS: readonly ["mp3", "flac", "m4a", "wav", "ogg"];
type AudioFormat = typeof ALLOWED_AUDIO_FORMATS[number];
/**
 * Class for caching sounds.
 */
declare class SoundCache<SoundData = DefaultSoundData> extends CacheManager<Sound<SoundData>> {
    static readonly AllowedAudioFormats: readonly ["mp3", "flac", "m4a", "wav", "ogg"];
    static isAudio(buffer: Uint8Array): boolean;
    static getAudioExt(buffer: Uint8Array): AudioFormat | null;
    /**
     * Caches a sound.
     * @param sound the sound to cache
     */
    add(sound: InputSound): Promise<Sound<SoundData>>;
    /**
     * Gets a sound from the cache.
     * @param soundId the id of the sound to get
     */
    get(soundId: string): Promise<Sound | null>;
    /**
     * Gets a sound from the cache.
     * @param sound the sound to get
     */
    get(sound: InputSound): Promise<Sound | null>;
    /**
     * Whether the sound is cached.
     * @param soundId id of the sound to check
     */
    cached(soundId?: string): Promise<boolean>;
    /**
     * Removes a sound from the cache.
     * @param soundId id of the sound to remove
     */
    remove(soundId: string): Promise<void>;
    /**
     * Removes a sound from the cache.
     * @param sound the sound to remove
     */
    remove(sound: Sound): Promise<void>;
    clear(): Promise<void>;
}
export { SoundCache };
export default SoundCache;
