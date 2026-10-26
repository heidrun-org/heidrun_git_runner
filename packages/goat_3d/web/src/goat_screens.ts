import type { Pane } from 'tweakpane';
import type { GoatKeyboard } from './goat_keyboard.ts';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GoatScreens — the start screen and the help window with the keys
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Shows and hides the start screen and the help window of the page. The markup of both is in `index.html`.
 * - The start screen shows when the page opens. A key or a click hides it and starts the game.
 * - The key `?` opens and closes the help window, which lists every key. The key `Escape` and a click also close
 *   it.
 * The keyboard of the goat works only while the game runs and the help window is closed.
 */
export class GoatScreens {
	/**
	 * The start screen, which covers the 3D scene.
	 */
	private readonly _startScreen: HTMLElement;

	/**
	 * The help window, which lists every key.
	 */
	private readonly _helpDialog: HTMLElement;

	/**
	 * The keyboard of the goat, which this class turns on and off.
	 */
	private readonly _goatKeyboard: GoatKeyboard;

	/**
	 * The Tweakpane panel, which hides while the start screen shows.
	 */
	private readonly _pane: Pane;

	/**
	 * True after the player left the start screen.
	 */
	private _isPlaying = false;

	/**
	 * True while the help window shows.
	 */
	private _isHelpOpen = false;

	/**
	 * The physical keys that went down while the start screen showed. The game starts when one of these keys
	 * goes up, so that the key that starts the game does not also move the goat.
	 */
	private readonly _startKeyCodes = new Set<string>();

	/**
	 * Finds the start screen and the help window in the page, and starts to listen to the keyboard and the mouse.
	 * @param goatKeyboard the keyboard of the goat.
	 * @param pane the Tweakpane panel.
	 */
	constructor(goatKeyboard: GoatKeyboard, pane: Pane) {
		this._startScreen = GoatScreens._getElement('start-screen');
		this._helpDialog = GoatScreens._getElement('help-dialog');
		this._goatKeyboard = goatKeyboard;
		this._pane = pane;
		this._update();

		window.addEventListener('keydown', (event: KeyboardEvent) => {
			this._onKeyDown(event);
		});
		window.addEventListener('keyup', (event: KeyboardEvent) => {
			this._onKeyUp(event);
		});
		this._startScreen.addEventListener('click', () => {
			this._startGame();
		});
		this._helpDialog.addEventListener('click', () => {
			this._setHelpOpen(false);
		});
	}

	/**
	 * Tells if the player left the start screen.
	 * @returns true when the game runs.
	 */
	isPlaying(): boolean {
		return this._isPlaying;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Opens or closes the help window with the key `?`, closes it with the key `Escape`, and remembers the other
	 * keys that go down on the start screen.
	 * @param event the keyboard event.
	 */
	private _onKeyDown(event: KeyboardEvent): void {
		if (event.key === '?') {
			event.preventDefault();
			this._setHelpOpen(this._isHelpOpen === false);
			return;
		}
		if (event.key === 'Escape') {
			this._setHelpOpen(false);
			return;
		}
		// The shift key is part of the key `?` on many keyboards, so it does not start the game. The key M turns the
		// sound on and off, so it does not start the game either.
		const isStartKey = event.key !== 'Shift' && event.key.toLowerCase() !== 'm';
		if (this._isPlaying === false && this._isHelpOpen === false && isStartKey === true) {
			this._startKeyCodes.add(event.code);
		}
	}

	/**
	 * Starts the game when a key that went down on the start screen goes up.
	 * @param event the keyboard event.
	 */
	private _onKeyUp(event: KeyboardEvent): void {
		if (this._startKeyCodes.has(event.code) === false) {
			return;
		}
		this._startKeyCodes.clear();
		this._startGame();
	}

	/**
	 * Hides the start screen and starts the game.
	 */
	private _startGame(): void {
		if (this._isPlaying === true || this._isHelpOpen === true) {
			return;
		}
		this._isPlaying = true;
		this._update();
	}

	/**
	 * Opens or closes the help window.
	 * @param isOpen true to open the help window, false to close it.
	 */
	private _setHelpOpen(isOpen: boolean): void {
		this._isHelpOpen = isOpen;
		// A key that went down before the help window opened must not start the game after it closes.
		this._startKeyCodes.clear();
		this._update();
	}

	/**
	 * Shows the screens, the panel, and the keyboard of the goat as the state asks.
	 */
	private _update(): void {
		this._startScreen.classList.toggle('is-hidden', this._isPlaying === true);
		this._helpDialog.classList.toggle('is-hidden', this._isHelpOpen === false);
		this._pane.hidden = this._isPlaying === false;
		this._goatKeyboard.isEnabled = this._isPlaying === true && this._isHelpOpen === false;
	}

	/**
	 * Finds an element of the page by its identifier.
	 * @param id the identifier of the element.
	 * @returns the element.
	 */
	private static _getElement(id: string): HTMLElement {
		const element = document.getElementById(id);
		if (element === null) {
			throw new Error(`GoatScreens: the page has no element with the identifier "${id}"`);
		}
		return element;
	}
}
