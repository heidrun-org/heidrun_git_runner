import * as Three from 'three';
import type { CSM } from 'three/addons/csm/CSM.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ToonStyle — makes the cartoon materials of the scene, like the Three.js example webgl_materials_toon
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Makes the cartoon materials of the scene. Each material shows the light in a few flat bands of brightness,
 * like the Three.js example `webgl_materials_toon`. The page draws a black outline around each object with the
 * Three.js add-on `OutlineEffect`.
 */
export class ToonStyle {
	/**
	 * The brightness of each band of light, from the darkest band to the brightest band, from 0 to 255.
	 */
	static readonly BAND_BRIGHTNESSES = [90, 170, 255];

	/**
	 * The thickness of the black outline when the page starts, as a part of the size of the screen.
	 */
	static readonly OUTLINE_THICKNESS = 0.005;

	/**
	 * The texture that gives the bands of light. Every material shares the same texture.
	 */
	private static _gradientMap: Three.DataTexture | null = null;

	/**
	 * Every material that this class made, so that a change of the outline reaches every material.
	 */
	private static readonly _materials: Three.MeshToonMaterial[] = [];

	/**
	 * Makes a cartoon material.
	 * @param color the color of the material. Use white with `isVertexColors`, so that the colors of the points
	 * show unchanged.
	 * @param isVertexColors true when the geometry gives one color to each point.
	 * @returns the material.
	 */
	static createMaterial(color: number, isVertexColors = false): Three.MeshToonMaterial {
		const material = new Three.MeshToonMaterial({
			color: color,
			vertexColors: isVertexColors,
			gradientMap: ToonStyle._getGradientMap(),
		});
		ToonStyle._materials.push(material);
		return material;
	}

	/**
	 * Changes the brightness of each band of light, on every material at once.
	 * @param brightnesses the brightness of each band, from the darkest band to the brightest band, from 0 to
	 * 255. The number of bands stays the same as in `BAND_BRIGHTNESSES`.
	 */
	static setBandBrightnesses(brightnesses: number[]): void {
		const gradientMap = ToonStyle._getGradientMap();
		const data = gradientMap.image.data as Uint8Array;
		for (let index = 0; index < data.length; index++) {
			data[index] = Math.round(brightnesses[index]);
		}
		gradientMap.needsUpdate = true;
	}

	/**
	 * Changes the thickness and the color of the black outline, on every material that shows an outline.
	 * @param thickness the thickness of the outline, as a part of the size of the screen.
	 * @param color the color of the outline.
	 */
	static setOutline(thickness: number, color: Three.Color): void {
		for (const material of ToonStyle._materials) {
			if (material.userData.outlineParameters?.visible === false) {
				continue;
			}
			material.userData.outlineParameters = {
				thickness: thickness,
				color: color.toArray(),
			};
		}
	}

	/**
	 * Gives the cascaded shadow maps of the sun to every material that this class made.
	 * @param csm the cascaded shadow maps of the sun.
	 */
	static setupCascadedShadows(csm: CSM): void {
		for (const material of ToonStyle._materials) {
			csm.setupMaterial(material);
		}
	}

	/**
	 * Hides the black outline of a material. The page uses it for the ground, which is too large for an outline.
	 * @param material the material that gets no outline.
	 */
	static hideOutline(material: Three.Material): void {
		material.userData.outlineParameters = {
			visible: false,
		};
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Gives the texture of the bands of light, and makes the texture the first time.
	 * @returns the texture of the bands of light.
	 */
	private static _getGradientMap(): Three.DataTexture {
		if (ToonStyle._gradientMap !== null) {
			return ToonStyle._gradientMap;
		}
		const brightnesses = new Uint8Array(ToonStyle.BAND_BRIGHTNESSES);
		const gradientMap = new Three.DataTexture(brightnesses, brightnesses.length, 1, Three.RedFormat);
		// The nearest filter keeps sharp steps between the bands, with no smooth blend.
		gradientMap.minFilter = Three.NearestFilter;
		gradientMap.magFilter = Three.NearestFilter;
		gradientMap.generateMipmaps = false;
		gradientMap.needsUpdate = true;
		ToonStyle._gradientMap = gradientMap;
		return gradientMap;
	}
}
