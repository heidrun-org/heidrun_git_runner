import * as Three from 'three';
import { MountainTerrain } from './mountain_terrain.ts';
import { ToonStyle } from './toon_style.ts';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SummitFire — the campfire at the top of the mountain, with a volume fire like webgpu_volume_fire
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The campfire at the top of the mountain, next to the flag. The flame looks like the Three.js example
 * `webgpu_volume_fire`, with the same three colors, but it works with WebGL: a shader walks along the ray of each
 * pixel through a box, and adds the light of a moving noise that has the shape of a flame. The example runs a
 * real simulation of the air with WebGPU, which the WebGL renderer of the game cannot run. Logs and stones in the
 * cartoon style hold the flame, and an orange light flickers on the ground around it.
 */
export class SummitFire {
	/**
	 * The place of the fire, from the flag at the top of the mountain, in meters on the x axis and the z axis.
	 */
	static readonly OFFSET_FROM_FLAG = new Three.Vector2(-1.3, 0.6);

	/**
	 * The width and the depth of the box of the flame, in meters.
	 */
	static readonly FLAME_WIDTH = 1.2;

	/**
	 * The height of the box of the flame, in meters.
	 */
	static readonly FLAME_HEIGHT = 2.2;

	/**
	 * The brightness of the flame when the page starts.
	 */
	static readonly FLAME_INTENSITY = 7;

	/**
	 * The brightness of the orange light of the fire when the page starts, in candelas.
	 */
	static readonly LIGHT_INTENSITY = 6;

	/**
	 * The largest number of steps along the ray of a pixel. The shader loops to this number and stops at
	 * `stepCount`.
	 */
	static readonly MAXIMUM_STEP_COUNT = 64;

	/**
	 * The largest number of layers of noise. The shader loops to this number and stops at `octaveCount`.
	 */
	static readonly MAXIMUM_OCTAVE_COUNT = 5;

	/**
	 * The color of the coolest part of the flame, at the top. It is the end color of the example.
	 */
	static readonly END_COLOR = 0xff0000;

	/**
	 * The color of the middle of the flame. It is the middle color of the example.
	 */
	static readonly MIDDLE_COLOR = 0xff7305;

	/**
	 * The color of the hottest part of the flame, at the bottom. It is the start color of the example.
	 */
	static readonly START_COLOR = 0xffe68c;

	/**
	 * The group that holds the flame, the logs, the stones, and the light. Add it to the scene.
	 */
	readonly group = new Three.Group();

	/**
	 * The brightness of the flame. The Tweakpane panel changes it.
	 */
	flameIntensity = SummitFire.FLAME_INTENSITY;

	/**
	 * The brightness of the orange light, before the flicker, in candelas. The Tweakpane panel changes it.
	 */
	lightIntensity = SummitFire.LIGHT_INTENSITY;

	/**
	 * The number of steps along the ray of each pixel. Fewer steps are faster but show more grain. The Tweakpane
	 * panel changes it.
	 */
	stepCount = 20;

	/**
	 * The number of layers of noise, from coarse to fine. Fewer layers are faster but give a smoother flame. The
	 * Tweakpane panel changes it.
	 */
	octaveCount = 3;

	/**
	 * The size of the noise across the flame. A larger number gives more, thinner tongues. The Tweakpane panel
	 * changes it.
	 */
	noiseScale = 5;

	/**
	 * How fast the noise goes up, in units of the noise each second. The Tweakpane panel changes it.
	 */
	riseSpeed = 3;

	/**
	 * How strongly the noise cuts the flame into tongues. The Tweakpane panel changes it.
	 */
	contrast = 2.6;

	/**
	 * How much the flame hides what is behind it. The Tweakpane panel changes it.
	 */
	absorption = 6;

	/**
	 * The width of the flame at its bottom, as a part of the box. The Tweakpane panel changes it.
	 */
	flameWidth = 0.42;

	/**
	 * How far the flame sways, as a part of the box. The Tweakpane panel changes it.
	 */
	sway = 0.05;

	/**
	 * The color of the hottest part of the flame. The Tweakpane panel changes it.
	 */
	readonly startColor = new Three.Color(SummitFire.START_COLOR);

	/**
	 * The color of the middle of the flame. The Tweakpane panel changes it.
	 */
	readonly middleColor = new Three.Color(SummitFire.MIDDLE_COLOR);

	/**
	 * The color of the coolest part of the flame. The Tweakpane panel changes it.
	 */
	readonly endColor = new Three.Color(SummitFire.END_COLOR);

	/**
	 * The box of the flame, which the shader fills.
	 */
	private readonly _flame: Three.Mesh;

	/**
	 * The material of the flame.
	 */
	private readonly _flameMaterial: Three.ShaderMaterial;

	/**
	 * The orange light of the fire.
	 */
	private readonly _light: Three.PointLight;

	/**
	 * Builds the fire at the top of the mountain. Make it before `ToonStyle.setupCascadedShadows`, so that the
	 * logs and the stones get the shadows.
	 */
	constructor() {
		const x = SummitFire.OFFSET_FROM_FLAG.x;
		const z = SummitFire.OFFSET_FROM_FLAG.y;
		this.group.position.set(x, MountainTerrain.heightAt(x, z), z);

		this._flameMaterial = SummitFire._createFlameMaterial();
		this._flame = new Three.Mesh(new Three.BoxGeometry(1, 1, 1), this._flameMaterial);
		this._flame.scale.set(SummitFire.FLAME_WIDTH, SummitFire.FLAME_HEIGHT, SummitFire.FLAME_WIDTH);
		this._flame.position.y = SummitFire.FLAME_HEIGHT / 2 - 0.05;
		// The flame is drawn after the other objects, because it adds its light to what is behind it.
		this._flame.renderOrder = 1;
		this.group.add(this._flame);

		this.group.add(SummitFire._createLogsAndStones());

		this._light = new Three.PointLight(0xff8a2a, this.lightIntensity, 14, 2);
		this._light.position.y = 0.6;
		this.group.add(this._light);
	}

	/**
	 * Moves the flame and makes the light flicker.
	 * @param seconds the time since the page started, in seconds.
	 * @param camera the camera, from which the shader casts its rays.
	 */
	update(seconds: number, camera: Three.Camera): void {
		const uniforms = this._flameMaterial.uniforms;
		uniforms.uTime.value = seconds;
		uniforms.uIntensity.value = this.flameIntensity;
		uniforms.uStepCount.value = Math.round(this.stepCount);
		uniforms.uOctaveCount.value = Math.round(this.octaveCount);
		uniforms.uNoiseScale.value = this.noiseScale;
		uniforms.uRiseSpeed.value = this.riseSpeed;
		uniforms.uContrast.value = this.contrast;
		uniforms.uAbsorption.value = this.absorption;
		uniforms.uFlameWidth.value = this.flameWidth;
		uniforms.uSway.value = this.sway;
		uniforms.uStartColor.value.copy(this.startColor);
		uniforms.uMiddleColor.value.copy(this.middleColor);
		uniforms.uEndColor.value.copy(this.endColor);
		this._flame.updateMatrixWorld();
		uniforms.uCameraLocal.value.copy(camera.position);
		this._flame.worldToLocal(uniforms.uCameraLocal.value);

		const flicker = 0.8
			+ 0.12 * Math.sin(seconds * 13.1) * Math.sin(seconds * 7.3 + 1.2)
			+ 0.08 * Math.sin(seconds * 23.7 + 0.4);
		this._light.intensity = this.lightIntensity * flicker;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Makes the material of the flame: a shader that walks along the ray of each pixel through the box of the
	 * flame, and adds the light of each step. The material adds its light to the picture, hides a part of what
	 * is behind the flame, writes no depth, and has no black outline.
	 * @returns the material of the flame.
	 */
	private static _createFlameMaterial(): Three.ShaderMaterial {
		const vertexShader = /* glsl */`
			varying vec3 vLocalPosition;

			void main() {
				vLocalPosition = position;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`;
		const fragmentShader = /* glsl */`
			#define MAXIMUM_STEP_COUNT ${SummitFire.MAXIMUM_STEP_COUNT}
			#define MAXIMUM_OCTAVE_COUNT ${SummitFire.MAXIMUM_OCTAVE_COUNT}

			uniform float uTime;
			uniform float uIntensity;
			uniform int uStepCount;
			uniform int uOctaveCount;
			uniform float uNoiseScale;
			uniform float uRiseSpeed;
			uniform float uContrast;
			uniform float uAbsorption;
			uniform float uFlameWidth;
			uniform float uSway;
			uniform vec3 uCameraLocal;
			uniform vec3 uStartColor;
			uniform vec3 uMiddleColor;
			uniform vec3 uEndColor;

			varying vec3 vLocalPosition;

			float hash(vec3 point) {
				point = fract(point * 0.3183099 + 0.1);
				point *= 17.0;
				return fract(point.x * point.y * point.z * (point.x + point.y + point.z));
			}

			float valueNoise(vec3 point) {
				vec3 cell = floor(point);
				vec3 ratio = fract(point);
				ratio = ratio * ratio * (3.0 - 2.0 * ratio);
				return mix(
					mix(
						mix(hash(cell + vec3(0.0, 0.0, 0.0)), hash(cell + vec3(1.0, 0.0, 0.0)), ratio.x),
						mix(hash(cell + vec3(0.0, 1.0, 0.0)), hash(cell + vec3(1.0, 1.0, 0.0)), ratio.x),
						ratio.y
					),
					mix(
						mix(hash(cell + vec3(0.0, 0.0, 1.0)), hash(cell + vec3(1.0, 0.0, 1.0)), ratio.x),
						mix(hash(cell + vec3(0.0, 1.0, 1.0)), hash(cell + vec3(1.0, 1.0, 1.0)), ratio.x),
						ratio.y
					),
					ratio.z
				);
			}

			float fractalNoise(vec3 point) {
				float sum = 0.0;
				float amplitude = 0.5;
				for (int octave = 0; octave < MAXIMUM_OCTAVE_COUNT; octave++) {
					if (octave >= uOctaveCount) {
						break;
					}
					sum += amplitude * valueNoise(point);
					point = point * 2.03 + vec3(1.7, 9.2, 3.1);
					amplitude *= 0.5;
				}
				return sum;
			}

			// The distances along the ray where the ray goes in the box and goes out of the box.
			vec2 hitBox(vec3 origin, vec3 direction) {
				vec3 inverseDirection = 1.0 / direction;
				vec3 first = (vec3(-0.5) - origin) * inverseDirection;
				vec3 second = (vec3(0.5) - origin) * inverseDirection;
				vec3 nearest = min(first, second);
				vec3 farthest = max(first, second);
				float enter = max(max(nearest.x, nearest.y), nearest.z);
				float leave = min(min(farthest.x, farthest.y), farthest.z);
				return vec2(enter, leave);
			}

			// The color of the flame, from the end color when cool to the start color when hot.
			vec3 fireColor(float temperature) {
				if (temperature < 0.5) {
					return mix(uEndColor, uMiddleColor, temperature * 2.0);
				}
				return mix(uMiddleColor, uStartColor, (temperature - 0.5) * 2.0);
			}

			void main() {
				vec3 origin = uCameraLocal;
				vec3 direction = normalize(vLocalPosition - origin);
				vec2 hit = hitBox(origin, direction);
				float enter = max(hit.x, 0.0);
				float leave = hit.y;
				if (leave <= enter) {
					discard;
				}

				float stepSize = (leave - enter) / float(uStepCount);
				// A random start on each pixel hides the bands of the steps.
				float jitter = hash(vec3(gl_FragCoord.xy, fract(uTime)));
				vec3 color = vec3(0.0);
				float transmittance = 1.0;
				for (int stepIndex = 0; stepIndex < MAXIMUM_STEP_COUNT; stepIndex++) {
					if (stepIndex >= uStepCount) {
						break;
					}
					vec3 point = origin + direction * (enter + (float(stepIndex) + jitter) * stepSize);
					// The height goes from 0 at the bottom of the box to 1 at the top.
					float height = point.y + 0.5;
					// The flame sways slowly, more at the top, and becomes thin toward the top.
					vec2 sway = vec2(sin(uTime * 1.3 + height * 3.0), cos(uTime * 1.1 + height * 2.5)) * uSway * height;
					float radius = length(point.xz - sway);
					float width = uFlameWidth * pow(1.0 - height, 0.8) + 0.02;
					float shape = 1.0 - smoothstep(width * 0.3, width, radius);
					// Most of the box is empty air: skip the costly noise there.
					if (shape < 0.001) {
						continue;
					}
					// The noise goes up with the time, like hot air. A strong contrast of the noise
					// cuts the flame into tongues that rise and die at the top.
					vec3 noisePoint = vec3(point.x, point.y * 0.52, point.z) * uNoiseScale - vec3(0.0, uTime * uRiseSpeed, 0.0);
					float noise = fractalNoise(noisePoint);
					float density = shape * smoothstep(0.0, 0.06, height);
					density *= clamp((noise - 0.3) * uContrast - height * 1.1 + 0.35, 0.0, 1.0);
					if (density > 0.001) {
						float temperature = clamp(density * 1.8 * (1.0 - height * 0.6), 0.0, 1.0);
						color += fireColor(temperature) * density * uIntensity * stepSize * transmittance;
						transmittance *= exp(-density * stepSize * uAbsorption);
						// Nothing behind a thick flame shows, so the ray can stop.
						if (transmittance < 0.03) {
							break;
						}
					}
				}
				// The alpha hides a part of what is behind the flame, so that the red of the flame does
				// not turn pink over the blue sky.
				gl_FragColor = vec4(color, 1.0 - transmittance);
			}
		`;
		const material = new Three.ShaderMaterial({
			uniforms: {
				uTime: {
					value: 0,
				},
				uIntensity: {
					value: SummitFire.FLAME_INTENSITY,
				},
				uStepCount: {
					value: 20,
				},
				uOctaveCount: {
					value: 3,
				},
				uNoiseScale: {
					value: 5,
				},
				uRiseSpeed: {
					value: 3,
				},
				uContrast: {
					value: 2.6,
				},
				uAbsorption: {
					value: 6,
				},
				uFlameWidth: {
					value: 0.42,
				},
				uSway: {
					value: 0.05,
				},
				uCameraLocal: {
					value: new Three.Vector3(),
				},
				uStartColor: {
					value: new Three.Color(SummitFire.START_COLOR),
				},
				uMiddleColor: {
					value: new Three.Color(SummitFire.MIDDLE_COLOR),
				},
				uEndColor: {
					value: new Three.Color(SummitFire.END_COLOR),
				},
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			// The back faces let the camera see the flame from inside the box too.
			side: Three.BackSide,
			transparent: true,
			// The color of the shader is already multiplied by its alpha: the flame adds its light, and its
			// alpha hides what is behind it.
			blending: Three.CustomBlending,
			blendSrc: Three.OneFactor,
			blendDst: Three.OneMinusSrcAlphaFactor,
			depthWrite: false,
		});
		ToonStyle.hideOutline(material);
		return material;
	}

	/**
	 * Makes the logs and the ring of stones under the flame, in the cartoon style.
	 * @returns the group of the logs and the stones.
	 */
	private static _createLogsAndStones(): Three.Group {
		const group = new Three.Group();

		const logMaterial = ToonStyle.createMaterial(0x5a3a22);
		const logGeometry = new Three.CylinderGeometry(0.07, 0.08, 0.8, 7);
		const logCount = 4;
		for (let index = 0; index < logCount; index++) {
			const log = new Three.Mesh(logGeometry, logMaterial);
			const angle = (index / logCount) * Math.PI;
			// Each log lies down, turned around the middle, and leans a little, like the logs of a teepee
			// fire.
			log.rotation.set(Math.PI / 2 - 0.35, angle, 0, 'YXZ');
			log.position.y = 0.12;
			log.castShadow = true;
			group.add(log);
		}

		const stoneMaterial = ToonStyle.createMaterial(0x77736e);
		const stoneGeometry = new Three.DodecahedronGeometry(0.11, 0);
		const stoneCount = 10;
		for (let index = 0; index < stoneCount; index++) {
			const stone = new Three.Mesh(stoneGeometry, stoneMaterial);
			const angle = (index / stoneCount) * Math.PI * 2;
			stone.position.set(Math.cos(angle) * 0.55, 0.04, Math.sin(angle) * 0.55);
			stone.rotation.set(angle * 1.7, angle * 2.3, angle);
			stone.scale.set(1.2, 0.8, 1);
			stone.castShadow = true;
			group.add(stone);
		}

		return group;
	}
}
