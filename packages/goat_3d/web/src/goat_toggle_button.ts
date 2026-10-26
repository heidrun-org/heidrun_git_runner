///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GoatToggleButton — a round button at the top right that turns the sound or the music on and off
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The settings of one toggle button.
 */
export type GoatToggleButtonOptions = {
	/**
	 * The identifier of the button in `index.html`.
	 */
	buttonId: string;

	/**
	 * The picture of the button when the thing is on.
	 */
	onSvg: string;

	/**
	 * The picture of the button when the thing is off.
	 */
	offSvg: string;

	/**
	 * The text that shows when the mouse is over the button and the thing is on.
	 */
	onTitle: string;

	/**
	 * The text that shows when the mouse is over the button and the thing is off.
	 */
	offTitle: string;

	/**
	 * The key that does the same as a click, in lower case, or null when no key does it.
	 */
	key: string | null;

	/**
	 * The function that turns the thing on or off, and gives true when the thing is on now.
	 */
	onToggle: () => boolean;

	/**
	 * True when the thing is on at the start.
	 */
	isOn: boolean;
};

/**
 * A round button at the top right of the page, over the 3D scene, that turns a thing on and off: the speaker
 * button turns the sound on and off, and the music button turns the music on and off. The pictures are icons of
 * Bootstrap Icons (MIT license), written in the code, so the package has no image file.
 */
export class GoatToggleButton {
	/**
	 * The icon "volume-up-fill": the sound is on.
	 */
	static readonly SOUND_ON_SVG = /* html */`
		<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
			<path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
			<path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z"/>
			<path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06"/>
		</svg>
	`;

	/**
	 * The icon "volume-mute-fill": the sound is off.
	 */
	static readonly SOUND_OFF_SVG = /* html */`
		<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
			<path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06m7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0"/>
		</svg>
	`;

	/**
	 * The icon "music-note-beamed": the music is on.
	 */
	static readonly MUSIC_ON_SVG = /* html */`
		<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
			<path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/>
			<path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/>
			<path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/>
		</svg>
	`;

	/**
	 * The icon "music-note-beamed" with a line across it: the music is off.
	 */
	static readonly MUSIC_OFF_SVG = /* html */`
		<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
			<path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/>
			<path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/>
			<path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/>
			<path d="M1.5 1.5l13 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
		</svg>
	`;

	/**
	 * The button on the page.
	 */
	private readonly _button: HTMLButtonElement;

	/**
	 * The settings of the button.
	 */
	private readonly _options: GoatToggleButtonOptions;

	/**
	 * Finds the button on the page, and calls `onToggle` at each click and at each press of the key.
	 * @param options the settings of the button.
	 */
	constructor(options: GoatToggleButtonOptions) {
		const button = document.getElementById(options.buttonId);
		if (button instanceof HTMLButtonElement === false) {
			throw new Error(`GoatToggleButton: the page has no button with the identifier "${options.buttonId}"`);
		}
		this._button = button;
		this._options = options;
		// The button never takes the focus, so the space key makes the goat jump and never clicks the button.
		button.addEventListener('mousedown', (event: MouseEvent) => {
			event.preventDefault();
		});
		button.addEventListener('click', (event: MouseEvent) => {
			// A click on the button does not start the game behind it.
			event.stopPropagation();
			this._show(options.onToggle());
		});
		window.addEventListener('keydown', (event: KeyboardEvent) => {
			if (options.key === null || event.repeat === true || event.key.toLowerCase() !== options.key) {
				return;
			}
			this._show(options.onToggle());
		});
		this._show(options.isOn);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Shows the picture that agrees with the state.
	 * @param isOn true when the thing is on.
	 */
	private _show(isOn: boolean): void {
		const svgHtmlContent = isOn === true ? this._options.onSvg : this._options.offSvg;
		this._button.innerHTML = svgHtmlContent;
		this._button.title = isOn === true ? this._options.onTitle : this._options.offTitle;
		this._button.setAttribute('aria-pressed', isOn === true ? 'true' : 'false');
	}
}
