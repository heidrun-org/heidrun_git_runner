import { GoatMusic } from './goat_music.ts';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GoatSoundPlayer — makes the sounds of the goat with the Web Audio API
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The events that make a sound.
 * - `soundOn`: the player turned the sound on, and the goat bleats.
 * - `footstep`: a hoof touches the ground during a walk or a run.
 * - `jump`: the goat leaves the ground.
 * - `land`: the goat touches the ground after a jump.
 */
export type GoatSoundEvent = 'soundOn' | 'footstep' | 'jump' | 'land';

/**
 * Makes the sounds of the goat and plays the music in the background. The code builds every sound from oscillators
 * and from noise, so the package has no sound file. The page remembers if the sound and the music are on, for the
 * next visit. A browser lets a page make sound only after a key or a click, so the audio context starts at the
 * first key or click on the page.
 */
export class GoatSoundPlayer {
	/**
	 * The volume of the whole game, from 0 to 1.
	 */
	static readonly MASTER_VOLUME = 0.4;

	/**
	 * The key in the storage of the browser that remembers if the sound is on.
	 */
	static readonly SOUND_STORAGE_KEY = 'heidrun_3d.isSoundOn';

	/**
	 * The key in the storage of the browser that remembers if the music is on.
	 */
	static readonly MUSIC_STORAGE_KEY = 'heidrun_3d.isMusicOn';

	/**
	 * The audio context, or null before the first click of the speaker button.
	 */
	private _audioContext: AudioContext | null = null;

	/**
	 * The gain node that every sound goes through, or null before the first click of the speaker button.
	 */
	private _masterGain: GainNode | null = null;

	/**
	 * One second of white noise, which every noise sound reads, or null before the first click of the speaker
	 * button.
	 */
	private _noiseBuffer: AudioBuffer | null = null;

	/**
	 * The music in the background, or null before the first key or click.
	 */
	private _goatMusic: GoatMusic | null = null;

	/**
	 * True when the sounds of the goat are on. The page remembers it for the next visit.
	 */
	private _isSoundOn: boolean;

	/**
	 * True when the music is on. The page remembers it for the next visit.
	 */
	private _isMusicOn: boolean;

	/**
	 * Reads the settings of the previous visit. When the sound or the music was on, the audio context starts at
	 * the first key or click on the page, because the browser blocks sound before that.
	 */
	constructor() {
		this._isSoundOn = GoatSoundPlayer._loadSetting(GoatSoundPlayer.SOUND_STORAGE_KEY);
		this._isMusicOn = GoatSoundPlayer._loadSetting(GoatSoundPlayer.MUSIC_STORAGE_KEY);
		const onFirstGesture = () => {
			window.removeEventListener('keydown', onFirstGesture, true);
			window.removeEventListener('pointerdown', onFirstGesture, true);
			if (this._isSoundOn === true || this._isMusicOn === true) {
				this._resume();
			}
		};
		window.addEventListener('keydown', onFirstGesture, true);
		window.addEventListener('pointerdown', onFirstGesture, true);
	}

	/**
	 * Tells if the sounds of the goat are on.
	 * @returns true when the sound is on.
	 */
	isSoundOn(): boolean {
		return this._isSoundOn;
	}

	/**
	 * Tells if the music is on.
	 * @returns true when the music is on.
	 */
	isMusicOn(): boolean {
		return this._isMusicOn;
	}

	/**
	 * Turns the sounds of the goat on when they are off, and off when they are on, and remembers it. Call it from a
	 * key or a click, so that the browser lets the page make sound. When the sound turns on, the goat bleats.
	 * @returns true when the sound is on now.
	 */
	toggleSound(): boolean {
		this._isSoundOn = this._isSoundOn === false;
		GoatSoundPlayer._saveSetting(GoatSoundPlayer.SOUND_STORAGE_KEY, this._isSoundOn);
		this._resume();
		if (this._isSoundOn === true) {
			this.play('soundOn');
		}
		return this._isSoundOn;
	}

	/**
	 * Turns the music on when it is off, and off when it is on, and remembers it. Call it from a key or a click,
	 * so that the browser lets the page make sound.
	 * @returns true when the music is on now.
	 */
	toggleMusic(): boolean {
		this._isMusicOn = this._isMusicOn === false;
		GoatSoundPlayer._saveSetting(GoatSoundPlayer.MUSIC_STORAGE_KEY, this._isMusicOn);
		this._resume();
		return this._isMusicOn;
	}

	/**
	 * Plays the sound of one event. Nothing happens when the sound is off.
	 * @param goatSoundEvent the event.
	 * @param volumeRatio the volume of this sound, from 0 to 1. A run gives louder footsteps than a walk.
	 */
	play(goatSoundEvent: GoatSoundEvent, volumeRatio = 1): void {
		if (this._isSoundOn === false || this._audioContext === null) {
			return;
		}
		if (goatSoundEvent === 'soundOn') {
			this._bleat();
		} else if (goatSoundEvent === 'footstep') {
			// A small random change of pitch makes each hoof sound a little different.
			const pitch = 0.85 + Math.random() * 0.3;
			this._tone('triangle', 900 * pitch, 260 * pitch, 0.06, 0.12 * volumeRatio, 0);
			this._noise(0.05, 0.08 * volumeRatio, 3200, 700, 0);
		} else if (goatSoundEvent === 'jump') {
			this._tone('triangle', 240, 680, 0.22, 0.16, 0);
			this._noise(0.18, 0.06, 1600, 400, 0);
		} else if (goatSoundEvent === 'land') {
			this._tone('sine', 150, 45, 0.22, 0.35, 0);
			this._noise(0.16, 0.18, 1400, 160, 0);
			this._tone('triangle', 700, 240, 0.05, 0.1, 0);
		}
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Starts the audio context at the first call, wakes it up when the browser stopped it, and starts or stops the
	 * music as the setting asks.
	 */
	private _resume(): void {
		if (this._audioContext === null) {
			this._audioContext = new AudioContext();
			this._masterGain = this._audioContext.createGain();
			this._masterGain.gain.value = GoatSoundPlayer.MASTER_VOLUME;
			this._masterGain.connect(this._audioContext.destination);
			this._noiseBuffer = GoatSoundPlayer._createNoiseBuffer(this._audioContext);
			this._goatMusic = new GoatMusic(this._audioContext, this._masterGain, this._noiseBuffer);
		}
		if (this._audioContext.state === 'suspended') {
			void this._audioContext.resume();
		}
		this._goatMusic?.setPlaying(this._isMusicOn);
	}

	/**
	 * Reads a setting of the previous visit from the storage of the browser.
	 * @param key the key of the setting.
	 * @returns true when the setting was on. A setting that was never saved, or a storage that the browser blocks,
	 * gives false.
	 */
	private static _loadSetting(key: string): boolean {
		try {
			return window.localStorage.getItem(key) === 'true';
		} catch {
			return false;
		}
	}

	/**
	 * Saves a setting for the next visit in the storage of the browser. Nothing happens when the browser blocks the
	 * storage.
	 * @param key the key of the setting.
	 * @param isOn the value of the setting.
	 */
	private static _saveSetting(key: string, isOn: boolean): void {
		try {
			window.localStorage.setItem(key, isOn === true ? 'true' : 'false');
		} catch {
			// The setting is only a convenience, so the game works without it.
		}
	}

	/**
	 * Plays the bleat of a goat: a buzzy note that shakes fast and goes a little down.
	 */
	private _bleat(): void {
		if (this._audioContext === null || this._masterGain === null) {
			return;
		}
		const startTime = this._audioContext.currentTime;
		const seconds = 0.55;
		const oscillator = this._audioContext.createOscillator();
		oscillator.type = 'sawtooth';
		oscillator.frequency.setValueAtTime(560, startTime);
		oscillator.frequency.linearRampToValueAtTime(440, startTime + seconds);

		// The shake of the pitch.
		const shakeOscillator = this._audioContext.createOscillator();
		const shakeGain = this._audioContext.createGain();
		shakeOscillator.frequency.value = 11;
		shakeGain.gain.value = 35;
		shakeOscillator.connect(shakeGain);
		shakeGain.connect(oscillator.frequency);

		const filter = this._audioContext.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 1800;
		const gain = this._audioContext.createGain();
		gain.gain.setValueAtTime(0.0001, startTime);
		gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.0001, startTime + seconds);

		oscillator.connect(filter);
		filter.connect(gain);
		gain.connect(this._masterGain);
		oscillator.start(startTime);
		shakeOscillator.start(startTime);
		oscillator.stop(startTime + seconds + 0.02);
		shakeOscillator.stop(startTime + seconds + 0.02);
	}

	/**
	 * Plays one note: an oscillator whose pitch slides and whose volume fades out.
	 * @param waveform the shape of the wave.
	 * @param startFrequency the pitch at the start, in hertz.
	 * @param endFrequency the pitch at the end, in hertz.
	 * @param seconds the duration of the note, in seconds.
	 * @param volume the volume at the start, from 0 to 1.
	 * @param delaySeconds the time to wait before the note starts, in seconds.
	 */
	private _tone(
		waveform: OscillatorType,
		startFrequency: number,
		endFrequency: number,
		seconds: number,
		volume: number,
		delaySeconds: number,
	): void {
		if (this._audioContext === null || this._masterGain === null || volume <= 0) {
			return;
		}
		const startTime = this._audioContext.currentTime + delaySeconds;
		const oscillator = this._audioContext.createOscillator();
		const gain = this._audioContext.createGain();
		oscillator.type = waveform;
		oscillator.frequency.setValueAtTime(startFrequency, startTime);
		oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + seconds);
		gain.gain.setValueAtTime(volume, startTime);
		gain.gain.exponentialRampToValueAtTime(0.0001, startTime + seconds);
		oscillator.connect(gain);
		gain.connect(this._masterGain);
		oscillator.start(startTime);
		oscillator.stop(startTime + seconds + 0.02);
	}

	/**
	 * Plays one burst of noise: white noise through a low-pass filter that closes, with a volume that fades out.
	 * @param seconds the duration of the burst, in seconds.
	 * @param volume the volume at the start, from 0 to 1.
	 * @param startCutoff the cutoff of the filter at the start, in hertz.
	 * @param endCutoff the cutoff of the filter at the end, in hertz.
	 * @param delaySeconds the time to wait before the burst starts, in seconds.
	 */
	private _noise(
		seconds: number,
		volume: number,
		startCutoff: number,
		endCutoff: number,
		delaySeconds: number,
	): void {
		const isReady = this._audioContext !== null && this._masterGain !== null && this._noiseBuffer !== null;
		if (isReady === false || this._audioContext === null || this._masterGain === null || volume <= 0) {
			return;
		}
		const startTime = this._audioContext.currentTime + delaySeconds;
		const source = this._audioContext.createBufferSource();
		const filter = this._audioContext.createBiquadFilter();
		const gain = this._audioContext.createGain();
		source.buffer = this._noiseBuffer;
		filter.type = 'lowpass';
		filter.frequency.setValueAtTime(startCutoff, startTime);
		filter.frequency.exponentialRampToValueAtTime(endCutoff, startTime + seconds);
		gain.gain.setValueAtTime(volume, startTime);
		gain.gain.exponentialRampToValueAtTime(0.0001, startTime + seconds);
		source.connect(filter);
		filter.connect(gain);
		gain.connect(this._masterGain);
		source.start(startTime);
		source.stop(startTime + seconds + 0.02);
	}

	/**
	 * Makes one second of white noise.
	 * @param audioContext the audio context.
	 * @returns the buffer of noise.
	 */
	private static _createNoiseBuffer(audioContext: AudioContext): AudioBuffer {
		const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
		const samples = buffer.getChannelData(0);
		for (let index = 0; index < samples.length; index++) {
			samples[index] = Math.random() * 2 - 1;
		}
		return buffer;
	}
}
