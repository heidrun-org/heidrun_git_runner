import * as Three from 'three';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ComicBursts — the comic words, like "POW!", that show the sounds of the goat
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The look of a comic word.
 * - `blueStar`: a yellow word on a blue star with spikes, inside a red star with spikes.
 * - `darkStar`: a red word on a black star with spikes and a yellow edge.
 * - `wordOnly`: a big red, yellow, or green word with no star.
 */
type ComicBurstStyle = 'blueStar' | 'darkStar' | 'wordOnly';

/**
 * The comic words that show the sounds of the goat on the screen, like the "POW!", "WHAM!", and "BANG!" of a
 * comic book. Each word has a black outline and a random look among the looks of `ComicBurstStyle`. Each word
 * appears at the place of the goat on the screen, pops, and fades away. The words show even when the sound is
 * off. The style and the animation are in `index.html`.
 */
export class ComicBursts {
	/**
	 * The number of spikes of the star.
	 */
	static readonly SPIKE_COUNT = 14;

	/**
	 * The time that a word stays on the screen, in milliseconds. It agrees with the animation in `index.html`.
	 */
	static readonly LIFE_MILLISECONDS = 900;

	/**
	 * The size of a word of size 1, in pixels.
	 */
	static readonly BASE_SIZE = 170;

	/**
	 * The point of the word, from the 3D scene to the screen.
	 */
	private readonly _screenPoint = new Three.Vector3();

	/**
	 * The looks of the comic words. Each word takes one at random.
	 */
	static readonly STYLES: readonly ComicBurstStyle[] = ['blueStar', 'darkStar', 'wordOnly'];

	/**
	 * The colors of a word with no star: the red, the yellow, and the green of a comic book.
	 */
	static readonly WORD_ONLY_COLORS: readonly string[] = ['#e5484d', '#f5d33f', '#4caf50'];

	/**
	 * Shows one comic word, taken at random, at a point of the 3D scene.
	 * @param wordChoices the words to take from, for example "POW!" and "WHAM!".
	 * @param worldPoint the point of the 3D scene where the word appears.
	 * @param camera the camera that draws the scene.
	 * @param sizeRatio the size of the word, where 1 is the normal size.
	 */
	show(wordChoices: readonly string[], worldPoint: Three.Vector3, camera: Three.Camera, sizeRatio: number): void {
		this._screenPoint.copy(worldPoint).project(camera);
		// A point behind the camera has no place on the screen.
		if (this._screenPoint.z > 1) {
			return;
		}
		const left = (this._screenPoint.x + 1) / 2 * window.innerWidth;
		const top = (1 - this._screenPoint.y) / 2 * window.innerHeight;
		const size = Math.round(ComicBursts.BASE_SIZE * sizeRatio);
		// Each word leans a little to the left or to the right.
		const tilt = Math.round((Math.random() * 2 - 1) * 12);

		const element = document.createElement('div');
		element.className = 'comic-burst';
		element.style.left = `${Math.round(left)}px`;
		element.style.top = `${Math.round(top)}px`;
		element.style.width = `${size}px`;
		element.style.height = `${Math.round(size * 0.78)}px`;
		element.style.setProperty('--tilt', `${tilt}deg`);
		const word = ComicBursts._pick(wordChoices);
		const comicBurstStyle = ComicBursts._pick(ComicBursts.STYLES);
		element.innerHTML = ComicBursts._createHtml(word, size, comicBurstStyle);
		document.body.appendChild(element);
		window.setTimeout(() => {
			element.remove();
		}, ComicBursts.LIFE_MILLISECONDS);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Makes the markup of one comic word: the stars with spikes of the look, and the word.
	 * @param word the word. The code gives it, so it needs no escape.
	 * @param size the width of the word, in pixels.
	 * @param comicBurstStyle the look of the word.
	 * @returns the markup.
	 */
	private static _createHtml(word: string, size: number, comicBurstStyle: ComicBurstStyle): string {
		if (comicBurstStyle === 'wordOnly') {
			const color = ComicBursts._pick(ComicBursts.WORD_ONLY_COLORS);
			const wordFontSize = Math.round(size * 0.42);
			const wordHtmlContent = /* html */`
				<span style="font-size: ${wordFontSize}px; color: ${color}">${word}</span>
			`;
			return wordHtmlContent;
		}
		const fontSize = Math.round(size * 0.3);
		const outerPoints = ComicBursts._starPoints(1);
		if (comicBurstStyle === 'darkStar') {
			const darkHtmlContent = /* html */`
				<svg viewBox="-110 -86 220 172" aria-hidden="true">
					<polygon
						points="${outerPoints}"
						fill="#1b1b1b"
						stroke="#ffd23f"
						stroke-width="6"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="comic-burst-dark-word" style="font-size: ${fontSize}px">${word}</span>
			`;
			return darkHtmlContent;
		}
		const innerPoints = ComicBursts._starPoints(0.74);
		const htmlContent = /* html */`
			<svg viewBox="-110 -86 220 172" aria-hidden="true">
				<polygon
					points="${outerPoints}"
					fill="#e63946"
					stroke="#1b1b1b"
					stroke-width="5"
					stroke-linejoin="round"
				/>
				<polygon
					points="${innerPoints}"
					fill="#4cc9f0"
					stroke="#1b1b1b"
					stroke-width="3"
					stroke-linejoin="round"
				/>
			</svg>
			<span style="font-size: ${fontSize}px">${word}</span>
		`;
		return htmlContent;
	}

	/**
	 * Takes one element of a list at random.
	 * @param choices the list. It is never empty.
	 * @returns the element.
	 */
	private static _pick<ChoiceType>(choices: readonly ChoiceType[]): ChoiceType {
		return choices[Math.floor(Math.random() * choices.length)];
	}

	/**
	 * Gives the points of a star with spikes of random lengths, in the box of the SVG picture.
	 * @param scale the size of the star, where 1 fills the box.
	 * @returns the points, as the attribute "points" of an SVG polygon.
	 */
	private static _starPoints(scale: number): string {
		const points: string[] = [];
		const cornerCount = ComicBursts.SPIKE_COUNT * 2;
		for (let index = 0; index < cornerCount; index++) {
			const angle = (index / cornerCount) * Math.PI * 2;
			const isSpike = index % 2 === 0;
			const radius = isSpike === true ? 0.82 + Math.random() * 0.18 : 0.55 + Math.random() * 0.08;
			const x = Math.cos(angle) * radius * 108 * scale;
			const y = Math.sin(angle) * radius * 84 * scale;
			points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
		}
		return points.join(' ');
	}
}
