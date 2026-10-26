///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GoatMusic — the 8-bit lo-fi music in the background, made with the Web Audio API
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * One note of the melody: the sixteenth note of the loop where the note starts, from 0 to
 * `GoatMusic.LOOP_STEP_COUNT - 1`, the pitch as a MIDI number where 60 is the middle C, and the length in sixteenth
 * notes.
 */
type MelodyNote = readonly [step: number, midi: number, length: number];

/**
 * One chord of the loop. Each chord lasts one bar.
 */
type MusicChord = {
	/**
	 * The pitch of the bass, as a MIDI number.
	 */
	bass: number;

	/**
	 * The notes of the chord, from low to high, as MIDI numbers. The arpeggio plays them one after the other.
	 */
	notes: readonly number[];
};

/**
 * The music in the background: a slow loop of 4 bars in the style of an old game console, with a lo-fi feel. The
 * code makes every note with oscillators and noise, so the package has no sound file.
 * - A pulse wave plays the melody, with a small shake of the pitch.
 * - A thin pulse wave plays the notes of each chord one after the other.
 * - A triangle wave plays the bass.
 * - Noise and a falling sine wave play the drums.
 * A filter takes away the high sounds, the timing swings, and a slow change of pitch on every note sounds like an
 * old tape: these give the lo-fi feel. The music schedules its notes a little ahead of time with the clock of the
 * audio context, so a slow frame of the game does not change the rhythm.
 */
export class GoatMusic {
	/**
	 * The speed of the music, in beats per minute.
	 */
	static readonly BEATS_PER_MINUTE = 78;

	/**
	 * The number of sixteenth notes in the loop: 4 bars of 16.
	 */
	static readonly LOOP_STEP_COUNT = 64;

	/**
	 * The volume of the music, from 0 to 1, before the volume of the whole game.
	 */
	static readonly VOLUME = 0.32;

	/**
	 * How late the second sixteenth note of each pair comes, as a part of a sixteenth note.
	 */
	static readonly SWING = 0.28;

	/**
	 * How far ahead the music schedules its notes, in seconds.
	 */
	static readonly SCHEDULE_AHEAD_SECONDS = 0.2;

	/**
	 * The chords of the loop, one for each bar: F major 7, E minor 7, D minor 7, and C major 7.
	 */
	static readonly CHORDS: readonly MusicChord[] = [
		{
			bass: 41,
			notes: [65, 69, 72, 76],
		},
		{
			bass: 40,
			notes: [64, 67, 71, 74],
		},
		{
			bass: 38,
			notes: [62, 65, 69, 72],
		},
		{
			bass: 36,
			notes: [60, 64, 67, 71],
		},
	];

	/**
	 * The melody of the loop.
	 */
	static readonly MELODY: readonly MelodyNote[] = [
		[0, 84, 3],
		[4, 81, 2],
		[6, 84, 2],
		[8, 88, 6],
		[14, 86, 2],
		[16, 86, 4],
		[20, 83, 2],
		[22, 79, 4],
		[28, 81, 4],
		[32, 84, 3],
		[36, 81, 2],
		[38, 77, 2],
		[40, 81, 4],
		[44, 84, 2],
		[46, 86, 2],
		[48, 88, 6],
		[56, 86, 2],
		[58, 84, 2],
		[60, 79, 4],
	];

	/**
	 * The audio context of the game.
	 */
	private readonly _audioContext: AudioContext;

	/**
	 * The gain node of the music, which fades the music in and out.
	 */
	private readonly _musicGain: GainNode;

	/**
	 * The filter that takes away the high sounds of the music.
	 */
	private readonly _lowpassFilter: BiquadFilterNode;

	/**
	 * The gain node of the slow change of pitch. Every note connects it to the pitch of its oscillator.
	 */
	private readonly _wobbleGain: GainNode;

	/**
	 * One second of white noise, for the drums.
	 */
	private readonly _noiseBuffer: AudioBuffer;

	/**
	 * The pulse wave of the melody, with a quarter of each cycle high.
	 */
	private readonly _leadWave: PeriodicWave;

	/**
	 * The pulse wave of the arpeggio, with an eighth of each cycle high.
	 */
	private readonly _arpeggioWave: PeriodicWave;

	/**
	 * The timer that schedules the notes, or null while the music stops.
	 */
	private _timerId: number | null = null;

	/**
	 * The next sixteenth note of the loop to schedule.
	 */
	private _nextStep = 0;

	/**
	 * The time of the audio context when the next sixteenth note starts, in seconds.
	 */
	private _nextStepTime = 0;

	/**
	 * Builds the chain of the music: the notes go through the filter, then the gain of the music, then the output.
	 * @param audioContext the audio context of the game.
	 * @param output the node where the music goes, for example the volume of the whole game.
	 * @param noiseBuffer one second of white noise, for the drums.
	 */
	constructor(audioContext: AudioContext, output: AudioNode, noiseBuffer: AudioBuffer) {
		this._audioContext = audioContext;
		this._noiseBuffer = noiseBuffer;

		this._musicGain = audioContext.createGain();
		this._musicGain.gain.value = 0;
		this._musicGain.connect(output);

		this._lowpassFilter = audioContext.createBiquadFilter();
		this._lowpassFilter.type = 'lowpass';
		this._lowpassFilter.frequency.value = 2400;
		this._lowpassFilter.Q.value = 0.5;
		this._lowpassFilter.connect(this._musicGain);

		// The slow change of pitch of an old tape, in cents.
		const wobbleOscillator = audioContext.createOscillator();
		wobbleOscillator.frequency.value = 0.35;
		this._wobbleGain = audioContext.createGain();
		this._wobbleGain.gain.value = 9;
		wobbleOscillator.connect(this._wobbleGain);
		wobbleOscillator.start();

		this._leadWave = GoatMusic._createPulseWave(audioContext, 0.25);
		this._arpeggioWave = GoatMusic._createPulseWave(audioContext, 0.125);
	}

	/**
	 * Starts or stops the music. The music fades in and out, and starts again at the beginning of the loop.
	 * @param isPlaying true to start the music, false to stop it.
	 */
	setPlaying(isPlaying: boolean): void {
		const now = this._audioContext.currentTime;
		this._musicGain.gain.cancelScheduledValues(now);
		this._musicGain.gain.setValueAtTime(this._musicGain.gain.value, now);
		if (isPlaying === false) {
			this._musicGain.gain.linearRampToValueAtTime(0, now + 0.3);
			if (this._timerId !== null) {
				window.clearInterval(this._timerId);
				this._timerId = null;
			}
			return;
		}
		this._musicGain.gain.linearRampToValueAtTime(GoatMusic.VOLUME, now + 1);
		if (this._timerId !== null) {
			return;
		}
		this._nextStep = 0;
		this._nextStepTime = now + 0.1;
		this._timerId = window.setInterval(() => {
			this._scheduleAhead();
		}, 50);
		this._scheduleAhead();
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Schedules every sixteenth note that starts before the end of the time ahead.
	 */
	private _scheduleAhead(): void {
		const stepSeconds = 60 / GoatMusic.BEATS_PER_MINUTE / 4;
		// After a long pause of the timer, for example in a hidden tab, the music starts again from now.
		if (this._nextStepTime < this._audioContext.currentTime) {
			this._nextStepTime = this._audioContext.currentTime + 0.05;
		}
		while (this._nextStepTime < this._audioContext.currentTime + GoatMusic.SCHEDULE_AHEAD_SECONDS) {
			const swingSeconds = this._nextStep % 2 === 1 ? GoatMusic.SWING * stepSeconds : 0;
			this._scheduleStep(this._nextStep, this._nextStepTime + swingSeconds, stepSeconds);
			this._nextStep = (this._nextStep + 1) % GoatMusic.LOOP_STEP_COUNT;
			this._nextStepTime += stepSeconds;
		}
	}

	/**
	 * Schedules the notes and the drums of one sixteenth note of the loop.
	 * @param step the sixteenth note of the loop.
	 * @param time the time of the audio context when the sixteenth note starts, in seconds.
	 * @param stepSeconds the length of a sixteenth note, in seconds.
	 */
	private _scheduleStep(step: number, time: number, stepSeconds: number): void {
		const barStep = step % 16;
		const musicChord = GoatMusic.CHORDS[Math.floor(step / 16)];

		for (const [noteStep, midi, length] of GoatMusic.MELODY) {
			if (noteStep === step) {
				this._note(this._leadWave, midi, time, length * stepSeconds * 0.9, 0.09, true);
			}
		}
		if (barStep % 2 === 0) {
			const arpeggioMidi = musicChord.notes[(barStep / 2) % musicChord.notes.length];
			this._note(this._arpeggioWave, arpeggioMidi, time, stepSeconds * 1.6, 0.035, false);
		}
		if (barStep === 0 || barStep === 7 || barStep === 10) {
			const bassMidi = barStep === 10 ? musicChord.bass + 7 : musicChord.bass;
			this._note('triangle', bassMidi, time, stepSeconds * (barStep === 0 ? 6 : 2.5), 0.22, false);
		}

		if (barStep === 0 || barStep === 8 || barStep === 11) {
			this._kick(time);
		}
		if (barStep === 4 || barStep === 12) {
			this._drumNoise(time, 0.14, 0.12, 'bandpass', 1800);
		}
		if (barStep % 2 === 0) {
			this._drumNoise(time, 0.03, barStep % 4 === 0 ? 0.04 : 0.025, 'highpass', 7000);
		}
	}

	/**
	 * Plays one note with a short attack and a soft end.
	 * @param wave the shape of the wave: a built-in type, or a pulse wave.
	 * @param midi the pitch, as a MIDI number.
	 * @param time the time of the audio context when the note starts, in seconds.
	 * @param seconds the length of the note, in seconds.
	 * @param volume the volume of the note, from 0 to 1.
	 * @param isVibrato true to shake the pitch a little, like the melody of an old game.
	 */
	private _note(
		wave: OscillatorType | PeriodicWave,
		midi: number,
		time: number,
		seconds: number,
		volume: number,
		isVibrato: boolean,
	): void {
		const oscillator = this._audioContext.createOscillator();
		if (wave instanceof PeriodicWave) {
			oscillator.setPeriodicWave(wave);
		} else {
			oscillator.type = wave;
		}
		oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
		this._wobbleGain.connect(oscillator.detune);

		let vibratoOscillator: OscillatorNode | null = null;
		if (isVibrato === true) {
			vibratoOscillator = this._audioContext.createOscillator();
			vibratoOscillator.frequency.value = 5.5;
			const vibratoGain = this._audioContext.createGain();
			vibratoGain.gain.value = 0;
			// The shake starts a little after the note, like on an old game console.
			vibratoGain.gain.setValueAtTime(0, time + 0.12);
			vibratoGain.gain.linearRampToValueAtTime(18, time + 0.3);
			vibratoOscillator.connect(vibratoGain);
			vibratoGain.connect(oscillator.detune);
		}

		const gain = this._audioContext.createGain();
		gain.gain.setValueAtTime(0.0001, time);
		gain.gain.exponentialRampToValueAtTime(volume, time + 0.008);
		gain.gain.setValueAtTime(volume, time + seconds * 0.7);
		gain.gain.exponentialRampToValueAtTime(0.0001, time + seconds);
		oscillator.connect(gain);
		gain.connect(this._lowpassFilter);

		oscillator.start(time);
		oscillator.stop(time + seconds + 0.02);
		if (vibratoOscillator !== null) {
			vibratoOscillator.start(time);
			vibratoOscillator.stop(time + seconds + 0.02);
		}
		oscillator.onended = () => {
			this._wobbleGain.disconnect(oscillator.detune);
		};
	}

	/**
	 * Plays a soft bass drum: a sine wave that falls fast in pitch.
	 * @param time the time of the audio context when the drum starts, in seconds.
	 */
	private _kick(time: number): void {
		const oscillator = this._audioContext.createOscillator();
		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(130, time);
		oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.14);
		const gain = this._audioContext.createGain();
		gain.gain.setValueAtTime(0.45, time);
		gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
		oscillator.connect(gain);
		gain.connect(this._lowpassFilter);
		oscillator.start(time);
		oscillator.stop(time + 0.22);
	}

	/**
	 * Plays a drum made of filtered noise: the snare drum or the hi-hat.
	 * @param time the time of the audio context when the drum starts, in seconds.
	 * @param seconds the length of the drum, in seconds.
	 * @param volume the volume of the drum, from 0 to 1.
	 * @param filterType the filter of the noise: a band of middle sounds for the snare drum, the high sounds for
	 * the hi-hat.
	 * @param frequency the frequency of the filter, in hertz.
	 */
	private _drumNoise(
		time: number,
		seconds: number,
		volume: number,
		filterType: BiquadFilterType,
		frequency: number,
	): void {
		const source = this._audioContext.createBufferSource();
		source.buffer = this._noiseBuffer;
		const filter = this._audioContext.createBiquadFilter();
		filter.type = filterType;
		filter.frequency.value = frequency;
		const gain = this._audioContext.createGain();
		gain.gain.setValueAtTime(volume, time);
		gain.gain.exponentialRampToValueAtTime(0.0001, time + seconds);
		source.connect(filter);
		filter.connect(gain);
		// The hi-hat skips the filter of the music, so that it stays crisp.
		gain.connect(filterType === 'highpass' ? this._musicGain : this._lowpassFilter);
		// Each drum reads the noise from a random place, so that no two drums sound the same.
		source.start(time, Math.random() * 0.5, seconds + 0.02);
	}

	/**
	 * Makes a pulse wave: a square wave whose high part is shorter than its low part, which gives the thin sound
	 * of an old game console.
	 * @param audioContext the audio context of the game.
	 * @param dutyCycle the part of each cycle that is high, from 0 to 1. A square wave has 0.5.
	 * @returns the wave, for `OscillatorNode.setPeriodicWave`.
	 */
	private static _createPulseWave(audioContext: AudioContext, dutyCycle: number): PeriodicWave {
		const harmonicCount = 48;
		const real = new Float32Array(harmonicCount);
		const imaginary = new Float32Array(harmonicCount);
		for (let harmonic = 1; harmonic < harmonicCount; harmonic++) {
			real[harmonic] = (2 * Math.sin(Math.PI * harmonic * dutyCycle)) / (Math.PI * harmonic);
		}
		return audioContext.createPeriodicWave(real, imaginary);
	}
}
