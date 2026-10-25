///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SoundButton — the speaker button that turns the sound on and off
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The speaker button at the bottom left of the page. A click turns the sound on and off. The two pictures are the
 * icons "volume-up-fill" and "volume-mute-fill" of Bootstrap Icons (MIT license), written in the code, so the package
 * has no image file.
 */
export class SoundButton {
	/** The picture of the speaker when the sound is on. */
	private static readonly _SOUND_ON_SVG = /* html */`
		<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
			<path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
			<path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z"/>
			<path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06"/>
		</svg>
	`;

	/** The picture of the speaker when the sound is off. */
	private static readonly _SOUND_OFF_SVG = /* html */`
		<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
			<path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06m7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0"/>
		</svg>
	`;

	/** The button on the page. */
	private _button: HTMLButtonElement;

	/**
	 * @param button The button on the page.
	 */
	private constructor(button: HTMLButtonElement) {
		this._button = button;
	}

	/**
	 * Finds the button on the page and calls a function at each click.
	 * @param onClick The function that turns the sound on or off, and gives true when the sound is off now.
	 * @param isMuted True when the sound is off at the start.
	 * @returns The sound button.
	 */
	static attach(onClick: () => boolean, isMuted: boolean): SoundButton {
		const button = document.getElementById('sound-button');
		if (button instanceof HTMLButtonElement === false) {
			throw new Error('The page has no button with the identifier "sound-button".');
		}
		const soundButton = new SoundButton(button);
		// The button never takes the focus, so the key Space jumps and never clicks the button.
		button.addEventListener('mousedown', (event: MouseEvent) => {
			event.preventDefault();
		});
		button.addEventListener('click', () => {
			soundButton.show(onClick());
		});
		soundButton.show(isMuted);
		return soundButton;
	}

	/**
	 * Shows the picture that agrees with the sound.
	 * @param isMuted True when the sound is off.
	 */
	show(isMuted: boolean): void {
		this._button.innerHTML = isMuted === true ? SoundButton._SOUND_OFF_SVG : SoundButton._SOUND_ON_SVG;
		this._button.title = isMuted === true ? 'Turn the sound on (M)' : 'Turn the sound off (M)';
		this._button.setAttribute('aria-pressed', isMuted === true ? 'true' : 'false');
	}
}
