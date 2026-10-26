///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GoatKeyboard — knows which arrow keys, space key, and shift key the player holds down
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Knows which arrow keys, space key, and shift key the player holds down at this moment.
 */
export class GoatKeyboard {
	/**
	 * The names of the keys that the player holds down, as `KeyboardEvent.key` gives them.
	 */
	private readonly _pressedKeys = new Set<string>();

	/**
	 * False while the start screen or the help window shows. Then every key counts as released.
	 */
	isEnabled = true;

	/**
	 * Starts to listen to the keyboard of the window.
	 */
	constructor() {
		window.addEventListener('keydown', (event: KeyboardEvent) => {
			if (event.key.startsWith('Arrow') === false && event.key !== ' ' && event.key !== 'Shift') {
				return;
			}
			// The arrow keys and the space key must move the goat, not scroll the page.
			event.preventDefault();
			this._pressedKeys.add(event.key);
		});
		window.addEventListener('keyup', (event: KeyboardEvent) => {
			this._pressedKeys.delete(event.key);
		});
		// When the window loses the focus, the window gets no keyup event, so every key counts as released.
		window.addEventListener('blur', () => {
			this._pressedKeys.clear();
		});
	}

	/**
	 * Tells if the player holds down a key.
	 * @param key the name of the key, as `KeyboardEvent.key` gives it, for example `ArrowUp`, or `' '` for the
	 * space key.
	 * @returns true when the player holds down the key, and the keyboard is enabled.
	 */
	isPressed(key: string): boolean {
		if (this.isEnabled === false) {
			return false;
		}
		return this._pressedKeys.has(key);
	}
}
