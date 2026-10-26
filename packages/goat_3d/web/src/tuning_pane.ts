import * as Three from 'three';
import type { CSM } from 'three/addons/csm/CSM.js';
import type { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { Pane } from 'tweakpane';
import { SummitFire } from './summit_fire.ts';
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
	 * The cascaded shadow maps of the sun. Their lights give the bands of light and the shadows.
	 */
	csm: CSM;

	/**
	 * The campfire at the top of the mountain.
	 */
	summitFire: SummitFire;
};

/**
 * The Tweakpane panel at the top right of the page. It tunes the bands of light of the cartoon materials, the
 * black outlines, the lights, the distance of the shadows, and the campfire at the top of the mountain.
 */
export class TuningPane {
	/**
	 * Makes the panel.
	 * @param tuningPaneTargets the objects of the scene that the panel changes.
	 * @returns the panel.
	 */
	static create(tuningPaneTargets: TuningPaneTargets): Pane {
		const { outlineEffect, hemisphereLight, csm, summitFire } = tuningPaneTargets;
		const settings = {
			darkBand: ToonStyle.BAND_BRIGHTNESSES[0],
			middleBand: ToonStyle.BAND_BRIGHTNESSES[1],
			brightBand: ToonStyle.BAND_BRIGHTNESSES[2],
			isOutlineVisible: outlineEffect.enabled,
			outlineThickness: ToonStyle.OUTLINE_THICKNESS,
			outlineColor: '#000000',
			skyLight: hemisphereLight.intensity,
			sunLight: csm.lightIntensity,
			shadowDistance: csm.maxFar,
			isFireVisible: summitFire.group.visible,
			flameIntensity: summitFire.flameIntensity,
			fireLight: summitFire.lightIntensity,
			fireStepCount: summitFire.stepCount,
			fireOctaveCount: summitFire.octaveCount,
			fireNoiseScale: summitFire.noiseScale,
			fireRiseSpeed: summitFire.riseSpeed,
			fireContrast: summitFire.contrast,
			fireAbsorption: summitFire.absorption,
			fireWidth: summitFire.flameWidth,
			fireSway: summitFire.sway,
			fireStartColor: `#${summitFire.startColor.getHexString()}`,
			fireMiddleColor: `#${summitFire.middleColor.getHexString()}`,
			fireEndColor: `#${summitFire.endColor.getHexString()}`,
		};

		const container = document.getElementById('tuning-pane-container');
		const pane = new Pane({
			title: 'Tuning',
			container: container ?? undefined,
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
		lightsFolder.addBinding(settings, 'shadowDistance', {
			label: 'shadow distance',
			min: 5,
			max: 150,
			step: 1,
		});
		lightsFolder.on('change', () => {
			hemisphereLight.intensity = settings.skyLight;
			for (const light of csm.lights) {
				light.intensity = settings.sunLight;
			}
			csm.maxFar = settings.shadowDistance;
			csm.updateFrustums();
		});

		const fireFolder = pane.addFolder({
			title: 'Fire',
		});
		fireFolder.addBinding(settings, 'isFireVisible', {
			label: 'visible',
		});
		fireFolder.addBinding(settings, 'flameIntensity', {
			label: 'flame',
			min: 0,
			max: 20,
			step: 0.1,
		});
		fireFolder.addBinding(settings, 'fireLight', {
			label: 'light',
			min: 0,
			max: 30,
			step: 0.5,
		});
		fireFolder.addBinding(settings, 'fireStepCount', {
			label: 'steps',
			min: 4,
			max: SummitFire.MAXIMUM_STEP_COUNT,
			step: 1,
		});
		fireFolder.addBinding(settings, 'fireOctaveCount', {
			label: 'noise layers',
			min: 1,
			max: SummitFire.MAXIMUM_OCTAVE_COUNT,
			step: 1,
		});
		fireFolder.addBinding(settings, 'fireNoiseScale', {
			label: 'noise size',
			min: 1,
			max: 12,
			step: 0.1,
		});
		fireFolder.addBinding(settings, 'fireRiseSpeed', {
			label: 'rise speed',
			min: 0,
			max: 10,
			step: 0.1,
		});
		fireFolder.addBinding(settings, 'fireContrast', {
			label: 'contrast',
			min: 0.5,
			max: 6,
			step: 0.1,
		});
		fireFolder.addBinding(settings, 'fireAbsorption', {
			label: 'thickness',
			min: 0,
			max: 20,
			step: 0.1,
		});
		fireFolder.addBinding(settings, 'fireWidth', {
			label: 'width',
			min: 0.05,
			max: 0.5,
			step: 0.01,
		});
		fireFolder.addBinding(settings, 'fireSway', {
			label: 'sway',
			min: 0,
			max: 0.3,
			step: 0.01,
		});
		fireFolder.addBinding(settings, 'fireStartColor', {
			label: 'hot color',
		});
		fireFolder.addBinding(settings, 'fireMiddleColor', {
			label: 'middle color',
		});
		fireFolder.addBinding(settings, 'fireEndColor', {
			label: 'cool color',
		});
		fireFolder.on('change', () => {
			summitFire.group.visible = settings.isFireVisible;
			summitFire.flameIntensity = settings.flameIntensity;
			summitFire.lightIntensity = settings.fireLight;
			summitFire.stepCount = settings.fireStepCount;
			summitFire.octaveCount = settings.fireOctaveCount;
			summitFire.noiseScale = settings.fireNoiseScale;
			summitFire.riseSpeed = settings.fireRiseSpeed;
			summitFire.contrast = settings.fireContrast;
			summitFire.absorption = settings.fireAbsorption;
			summitFire.flameWidth = settings.fireWidth;
			summitFire.sway = settings.fireSway;
			summitFire.startColor.set(settings.fireStartColor);
			summitFire.middleColor.set(settings.fireMiddleColor);
			summitFire.endColor.set(settings.fireEndColor);
		});

		return pane;
	}
}
