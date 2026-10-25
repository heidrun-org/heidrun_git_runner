import * as Three from 'three';
import type { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { Pane } from 'tweakpane';
import { ToonStyle } from './toon_style.ts';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	TuningPane — the Tweakpane panel that tunes the cartoon look of the scene
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The objects of the scene that the panel changes.
 */
export type TuningPaneTargets = {
	/**
	 * The effect that draws the black outlines.
	 */
	outlineEffect: OutlineEffect;

	/**
	 * The light of the sky, which lights every side of every object.
	 */
	hemisphereLight: Three.HemisphereLight;

	/**
	 * The light of the sun, which gives the bands of light and the shadows.
	 */
	directionalLight: Three.DirectionalLight;
};

/**
 * The Tweakpane panel at the top right of the page. It tunes the bands of light of the cartoon materials, the
 * black outlines, and the lights.
 */
export class TuningPane {
	/**
	 * Makes the panel.
	 * @param tuningPaneTargets the objects of the scene that the panel changes.
	 * @returns the panel.
	 */
	static create(tuningPaneTargets: TuningPaneTargets): Pane {
		const { outlineEffect, hemisphereLight, directionalLight } = tuningPaneTargets;
		const settings = {
			darkBand: ToonStyle.BAND_BRIGHTNESSES[0],
			middleBand: ToonStyle.BAND_BRIGHTNESSES[1],
			brightBand: ToonStyle.BAND_BRIGHTNESSES[2],
			isOutlineVisible: outlineEffect.enabled,
			outlineThickness: ToonStyle.OUTLINE_THICKNESS,
			outlineColor: '#000000',
			skyLight: hemisphereLight.intensity,
			sunLight: directionalLight.intensity,
		};

		const pane = new Pane({
			title: 'Tuning',
		});

		const bandsFolder = pane.addFolder({
			title: 'Bands of light',
		});
		const bandOptions = {
			min: 0,
			max: 255,
			step: 1,
		};
		bandsFolder.addBinding(settings, 'darkBand', {
			...bandOptions,
			label: 'dark band',
		});
		bandsFolder.addBinding(settings, 'middleBand', {
			...bandOptions,
			label: 'middle band',
		});
		bandsFolder.addBinding(settings, 'brightBand', {
			...bandOptions,
			label: 'bright band',
		});
		bandsFolder.on('change', () => {
			ToonStyle.setBandBrightnesses([settings.darkBand, settings.middleBand, settings.brightBand]);
		});

		const outlineFolder = pane.addFolder({
			title: 'Outline',
		});
		outlineFolder.addBinding(settings, 'isOutlineVisible', {
			label: 'visible',
		});
		outlineFolder.addBinding(settings, 'outlineThickness', {
			label: 'thickness',
			min: 0,
			max: 0.02,
			step: 0.0005,
		});
		outlineFolder.addBinding(settings, 'outlineColor', {
			label: 'color',
		});
		outlineFolder.on('change', () => {
			outlineEffect.enabled = settings.isOutlineVisible;
			ToonStyle.setOutline(settings.outlineThickness, new Three.Color(settings.outlineColor));
		});

		const lightsFolder = pane.addFolder({
			title: 'Lights',
		});
		lightsFolder.addBinding(settings, 'skyLight', {
			label: 'sky light',
			min: 0,
			max: 4,
			step: 0.05,
		});
		lightsFolder.addBinding(settings, 'sunLight', {
			label: 'sun light',
			min: 0,
			max: 6,
			step: 0.05,
		});
		lightsFolder.on('change', () => {
			hemisphereLight.intensity = settings.skyLight;
			directionalLight.intensity = settings.sunLight;
		});

		return pane;
	}
}
