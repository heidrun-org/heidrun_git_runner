import * as Three from 'three';
import { ComicBursts } from './comic_bursts.ts';
import { DustPuffs } from './dust_puffs.ts';
import { CSM } from 'three/addons/csm/CSM.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GoatJump } from './goat_jump.ts';
import { GoatKeyboard } from './goat_keyboard.ts';
import { GoatModel } from './goat_model.ts';
import { GoatScreens } from './goat_screens.ts';
import { GoatSoundPlayer } from './goat_sound_player.ts';
import { GoatToggleButton } from './goat_toggle_button.ts';
import { GothicTrees } from './gothic_trees.ts';
import { MountainTerrain } from './mountain_terrain.ts';
import { SummitFire } from './summit_fire.ts';
import { ToonStyle } from './toon_style.ts';
import { TuningPane } from './tuning_pane.ts';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GoatPage — the low poly goat climbs the mountain with the arrow keys and jumps with the space key
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The page of the game Heidrun 3D. The goat starts at the foot of a mountain, and the player makes the goat climb to
 * the flag at the top. The up arrow walks forward, the down arrow walks backward, the left arrow and the right
 * arrow turn the goat, the shift key makes the goat run, and the space key makes the goat jump. In the air, the
 * goat goes faster, so that a jump while running goes far.
 */
export class GoatPage {
	/**
	 * The speed of the goat when it walks, in meters per second.
	 */
	static readonly WALK_SPEED = 1.4;

	/**
	 * The speed of the goat when it runs, in meters per second.
	 */
	static readonly RUN_SPEED = 4;

	/**
	 * How much faster the goat goes forward in the air than on the ground.
	 */
	static readonly JUMP_SPEED_RATIO = 1.5;

	/**
	 * How fast the speed of the goat goes to the speed of the keys on the ground. A larger number gives a faster
	 * change. In the air, the goat keeps its speed.
	 */
	static readonly SPEED_CHANGE_RATE = 6;

	/**
	 * The speed of the goat when it turns, in radians per second.
	 */
	static readonly TURN_SPEED = 2.2;

	/**
	 * The largest angle of a leg swing when the goat walks, in radians.
	 */
	static readonly LEG_SWING_ANGLE = 0.45;

	/**
	 * The largest angle of a leg swing when the goat runs, in radians. A larger swing gives longer steps.
	 */
	static readonly RUN_LEG_SWING_ANGLE = 0.75;

	/**
	 * The smallest swing angle that sets the speed of the steps, in radians. While the swing grows from 0 at the
	 * start of a walk, the steps follow the real swing, but never faster than with this angle.
	 */
	static readonly MINIMUM_STEP_SWING_ANGLE = 0.15;

	/**
	 * The distance from the goat to the edge of the ground, below which the goat cannot go, in meters.
	 */
	static readonly EDGE_MARGIN = 1;

	/**
	 * The distance of the camera behind the goat, in meters.
	 */
	static readonly CAMERA_DISTANCE = 2.3;

	/**
	 * The height of the camera above the feet of the goat, in meters.
	 */
	static readonly CAMERA_HEIGHT = 1.1;

	/**
	 * The angle from the back of the goat to the camera, toward the right side of the goat, in radians.
	 */
	static readonly CAMERA_ANGLE = 25 * Math.PI / 180;

	/**
	 * The smallest height of the camera above the ground, so that the camera never goes into the mountain.
	 */
	static readonly CAMERA_GROUND_CLEARANCE = 0.4;

	/**
	 * How fast the camera follows the goat. A larger number gives a faster camera.
	 */
	static readonly CAMERA_SPEED = 8;

	/**
	 * How fast the goat leans to follow the slope under it. A larger number gives a faster lean.
	 */
	static readonly SLOPE_SPEED = 10;

	/**
	 * The distance of the camera from the goat on the start screen, in meters.
	 */
	static readonly START_ORBIT_RADIUS = 2.8;

	/**
	 * The height of the camera above the feet of the goat on the start screen, in meters.
	 */
	static readonly START_ORBIT_HEIGHT = 0.9;

	/**
	 * The speed of the turn of the camera around the goat on the start screen, in radians per second.
	 */
	static readonly START_ORBIT_SPEED = 0.25;

	/**
	 * The comic words of a jump.
	 */
	static readonly JUMP_WORDS: readonly string[] = ['BOING!', 'HOP!', 'ZOING!'];

	/**
	 * The comic words of a landing after a fall of a normal height.
	 */
	static readonly LANDING_WORDS: readonly string[] = ['POW!', 'BANG!', 'THUD!', 'WHAM!'];

	/**
	 * The comic words of a landing after a high fall.
	 */
	static readonly BIG_LANDING_WORDS: readonly string[] = ['KA-POW!', 'KA-BOOM!', 'WHAM!!', 'KRAKOOM!'];

	/**
	 * The height of a jump on flat ground, in meters: the jump speed squared, divided by two times the gravity.
	 */
	static readonly FLAT_JUMP_HEIGHT = GoatJump.JUMP_SPEED * GoatJump.JUMP_SPEED / (2 * GoatJump.GRAVITY);

	/**
	 * The part of the height of a jump that the camera follows, from 0 for no move to 1 for the whole height.
	 */
	static readonly CAMERA_JUMP_FOLLOW_RATIO = 0.8;

	/**
	 * The height of the point that the camera looks at, above the feet of the goat, in meters.
	 */
	static readonly CAMERA_LOOK_HEIGHT = 0.6;

	/**
	 * The direction in which the light of the sun goes, from the sun to the ground.
	 */
	static readonly SUN_DIRECTION = new Three.Vector3(-3, -5, -4).normalize();

	/**
	 * The distance from the camera up to which objects get shadows, in meters.
	 */
	static readonly SHADOW_DISTANCE = 80;

	/**
	 * The number of shadow maps, from near the camera to far from the camera. Each map covers a wider zone than
	 * the map before it, so the shadows are sharp near the camera and still exist far from the camera.
	 */
	static readonly SHADOW_CASCADE_COUNT = 4;

	/**
	 * The distance from the shadow camera of the sun to the zone of a shadow map, in meters. It must be larger
	 * than the height of the tallest object that casts a shadow into the zone.
	 */
	static readonly SHADOW_LIGHT_MARGIN = 40;

	/**
	 * The depth of the shadow camera of the sun, in meters. It must hold the margin and the deepest zone of a
	 * shadow map. The shadow bias is a part of this depth, so a smaller depth keeps the shadows on their objects.
	 */
	static readonly SHADOW_LIGHT_FAR = 300;

	/**
	 * Makes the scene, the camera, the renderer, the ground, and the goat, and starts the loop that draws them.
	 * @returns nothing.
	 */
	static start(): void {
		const scene = new Three.Scene();
		scene.background = new Three.Color(0x9cc9e8);
		scene.fog = new Three.Fog(0x9cc9e8, 30, 80);

		const camera = new Three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 150);

		const renderer = new Three.WebGLRenderer({
			antialias: true,
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = Three.PCFSoftShadowMap;
		document.body.appendChild(renderer.domElement);
		// The outline effect draws a black outline around each object, like the Three.js example
		// webgl_materials_toon.
		const outlineEffect = new OutlineEffect(renderer, {
			defaultThickness: ToonStyle.OUTLINE_THICKNESS,
		});

		scene.add(MountainTerrain.create());

		// The goat starts at the foot of the mountain and looks to the top, in the -z direction.
		const goatModel = new GoatModel();
		const goat = goatModel.group;
		goat.position.set(0, 0, 20);
		goat.rotation.y = Math.PI / 2;
		scene.add(goat);
		scene.add(GothicTrees.create(goat.position));
		const goatKeyboard = new GoatKeyboard();
		const goatJump = new GoatJump();
		const dustPuffs = new DustPuffs();
		scene.add(dustPuffs.group);
		const comicBursts = new ComicBursts();
		const summitFire = new SummitFire();
		scene.add(summitFire.group);

		const hemisphereLight = new Three.HemisphereLight(0xcfe3ff, 0x5a6b3a, 0.8);
		scene.add(hemisphereLight);
		// The sun gives cascaded shadow maps, like the Three.js example webgl_shadowmap_csm, so that the
		// shadows reach far from the camera.
		const csm = new CSM({
			camera: camera,
			parent: scene,
			cascades: GoatPage.SHADOW_CASCADE_COUNT,
			maxFar: GoatPage.SHADOW_DISTANCE,
			mode: 'practical',
			shadowMapSize: 2048,
			// The bias of -0.00005 of the depth of 300 meters is 1.5 centimeters. The default depth of 2000 meters
			// with a bias of -0.0003 moved every shadow about 60 centimeters away from its object.
			shadowBias: -0.00005,
			lightMargin: GoatPage.SHADOW_LIGHT_MARGIN,
			lightFar: GoatPage.SHADOW_LIGHT_FAR,
			lightDirection: GoatPage.SUN_DIRECTION,
			lightIntensity: 2,
		});
		for (const light of csm.lights) {
			light.color.set(0xfff4e0);
			// The normal bias moves the test of the shadow a little out of the surface, so that the slopes of the
			// low poly ground do not shadow themselves in stripes.
			light.shadow.normalBias = 0.02;
		}
		ToonStyle.setupCascadedShadows(csm);

		const pane = TuningPane.create({
			outlineEffect: outlineEffect,
			summitFire: summitFire,
			hemisphereLight: hemisphereLight,
			csm: csm,
		});
		const goatScreens = new GoatScreens(goatKeyboard, pane);
		const goatSoundPlayer = new GoatSoundPlayer();

		// The frame counter at the bottom left shows the frames per second.
		const stats = new Stats();
		stats.dom.style.top = 'auto';
		stats.dom.style.bottom = '16px';
		stats.dom.style.left = '16px';
		document.body.appendChild(stats.dom);
		new GoatToggleButton({
			buttonId: 'sound-button',
			onSvg: GoatToggleButton.SOUND_ON_SVG,
			offSvg: GoatToggleButton.SOUND_OFF_SVG,
			onTitle: 'Turn the sound off (M)',
			offTitle: 'Turn the sound on (M)',
			key: 'm',
			onToggle: () => goatSoundPlayer.toggleSound(),
			isOn: goatSoundPlayer.isSoundOn(),
		});
		new GoatToggleButton({
			buttonId: 'music-button',
			onSvg: GoatToggleButton.MUSIC_ON_SVG,
			offSvg: GoatToggleButton.MUSIC_OFF_SVG,
			onTitle: 'Turn the music off',
			offTitle: 'Turn the music on',
			key: null,
			onToggle: () => goatSoundPlayer.toggleMusic(),
			isOn: goatSoundPlayer.isMusicOn(),
		});

		window.addEventListener('resize', () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
			// The shadow maps cover the view of the camera, so they follow its new shape.
			csm.updateFrustums();
		});

		let walkPhase = 0;
		let legSwingAngle = 0;
		let forwardSpeed = 0;
		const cameraTarget = new Three.Vector3();
		let isCameraPlaced = false;
		const timer = new Three.Timer();
		renderer.setAnimationLoop((timestamp: number) => {
			timer.update(timestamp);
			const deltaSeconds = timer.getDelta();

			let turnDirection = 0;
			if (goatKeyboard.isPressed('ArrowLeft') === true) {
				turnDirection += 1;
			}
			if (goatKeyboard.isPressed('ArrowRight') === true) {
				turnDirection -= 1;
			}
			let walkDirection = 0;
			if (goatKeyboard.isPressed('ArrowUp') === true) {
				walkDirection += 1;
			}
			if (goatKeyboard.isPressed('ArrowDown') === true) {
				walkDirection -= 1;
			}

			goat.rotation.y += turnDirection * GoatPage.TURN_SPEED * deltaSeconds;

			// The goat looks to its local +x direction.
			// On the ground, the speed goes to the speed of the keys. When the goat leaves the ground, the
			// speed grows by JUMP_SPEED_RATIO, and the goat keeps this speed until it lands.
			const isRunning = goatKeyboard.isPressed('Shift') === true;
			const keySpeed = isRunning === true ? GoatPage.RUN_SPEED : GoatPage.WALK_SPEED;
			const groundSpeed = walkDirection * keySpeed;
			const wasFlying = goatJump.isFlying();
			if (wasFlying === false) {
				const speedRatio = Math.min(1, deltaSeconds * GoatPage.SPEED_CHANGE_RATE);
				forwardSpeed += (groundSpeed - forwardSpeed) * speedRatio;
			}
			const walkDistance = forwardSpeed * deltaSeconds;
			goat.position.x += Math.cos(goat.rotation.y) * walkDistance;
			goat.position.z -= Math.sin(goat.rotation.y) * walkDistance;
			const maximumCoordinate = MountainTerrain.SIZE / 2 - GoatPage.EDGE_MARGIN;
			goat.position.x = Math.min(maximumCoordinate, Math.max(-maximumCoordinate, goat.position.x));
			goat.position.z = Math.min(maximumCoordinate, Math.max(-maximumCoordinate, goat.position.z));

			const groundY = MountainTerrain.heightAt(goat.position.x, goat.position.z);
			goatJump.update(deltaSeconds, goatKeyboard.isPressed(' '), groundY);
			if (wasFlying === false && goatJump.isFlying() === true) {
				forwardSpeed *= GoatPage.JUMP_SPEED_RATIO;
				goatSoundPlayer.play('jump');
				const jumpWordPoint = GoatPage._abovePoint(goat.position, 1.2);
				comicBursts.show(GoatPage.JUMP_WORDS, jumpWordPoint, camera, 0.7);
			}
			if (wasFlying === true && goatJump.isFlying() === false) {
				goatSoundPlayer.play('land');
				// A higher fall makes more dust and a bigger word. A jump on flat ground gives 1.
				const fallRatio = goatJump.lastFallHeight / GoatPage.FLAT_JUMP_HEIGHT;
				const landingIntensity = Math.min(3.5, Math.max(0.25, fallRatio));
				const landingPoint = new Three.Vector3(goat.position.x, groundY, goat.position.z);
				dustPuffs.burst(landingPoint, landingIntensity);
				const isBigLanding = landingIntensity > 1.6;
				const landingWords = isBigLanding === true
					? GoatPage.BIG_LANDING_WORDS
					: GoatPage.LANDING_WORDS;
				const wordSize = 0.6 + 0.35 * landingIntensity;
				const wordPoint = GoatPage._abovePoint(landingPoint, 0.7);
				comicBursts.show(landingWords, wordPoint, camera, wordSize);
			}
			goat.position.y = goatJump.positionY;

			// The goat leans with the slope in the direction that it looks: the head goes up when the goat
			// climbs.
			const forwardX = Math.cos(goat.rotation.y);
			const forwardZ = -Math.sin(goat.rotation.y);
			// Half the length of the goat, from its back hooves to its front hooves, in meters.
			const halfLength = 0.25;
			const frontY = MountainTerrain.heightAt(
				goat.position.x + forwardX * halfLength,
				goat.position.z + forwardZ * halfLength,
			);
			const backY = MountainTerrain.heightAt(
				goat.position.x - forwardX * halfLength,
				goat.position.z - forwardZ * halfLength,
			);
			const slopeAngle = Math.atan2(frontY - backY, 2 * halfLength);
			const slopeRatio = Math.min(1, deltaSeconds * GoatPage.SLOPE_SPEED);
			goat.rotation.z += (slopeAngle - goat.rotation.z) * slopeRatio;

			// The legs swing while the goat walks or turns on the ground, and go back to straight when the
			// goat stops or jumps.
			const isWalking = Math.abs(forwardSpeed) > 0.05;
			const isMoving = (isWalking === true || turnDirection !== 0) && goatJump.isStanding() === true;
			const stepDistance = isWalking === true ? walkDistance : turnDirection * 0.5 * deltaSeconds;
			// The steps per meter come from the length of the legs and from the swing at this moment, so
			// that a hoof on the ground does not slide.
			const stepSwingAngle = Math.max(legSwingAngle, GoatPage.MINIMUM_STEP_SWING_ANGLE);
			const previousWalkPhase = walkPhase;
			walkPhase += stepDistance * GoatModel.stepAnglePerMeter(stepSwingAngle);
			// Two hooves touch the ground at each half step, when the walk phase goes past a multiple of
			// PI.
			const halfStepIndex = Math.floor(walkPhase / Math.PI);
			const isHalfStepDone = halfStepIndex !== Math.floor(previousWalkPhase / Math.PI);
			if (isHalfStepDone === true && isMoving === true) {
				const footstepVolume = Math.min(1, 0.4 + Math.abs(forwardSpeed) / GoatPage.RUN_SPEED);
				goatSoundPlayer.play('footstep', footstepVolume);
			}
			const movingSwingAngle = isRunning === true
				? GoatPage.RUN_LEG_SWING_ANGLE
				: GoatPage.LEG_SWING_ANGLE;
			const targetSwingAngle = isMoving === true ? movingSwingAngle : 0;
			legSwingAngle += (targetSwingAngle - legSwingAngle) * Math.min(1, deltaSeconds * 10);
			goatModel.applyPose(goatJump.pose, walkPhase, legSwingAngle);
			dustPuffs.update(deltaSeconds);
			summitFire.update(timestamp / 1000, camera);

			// The camera follows the goat, and follows only a part of the height of a jump, so that the
			// goat stays on the screen without a big shake of the camera.
			const jumpHeight = goat.position.y - groundY;
			const followY = groundY + jumpHeight * GoatPage.CAMERA_JUMP_FOLLOW_RATIO;
			const groundPosition = new Three.Vector3(goat.position.x, followY, goat.position.z);
			// The camera is behind the goat, turned by CAMERA_ANGLE toward the right side of the goat. The
			// right side of the goat is its local +z direction.
			const rightX = Math.sin(goat.rotation.y);
			const rightZ = Math.cos(goat.rotation.y);
			const backRatio = Math.cos(GoatPage.CAMERA_ANGLE);
			const rightRatio = Math.sin(GoatPage.CAMERA_ANGLE);
			const cameraDirectionX = -forwardX * backRatio + rightX * rightRatio;
			const cameraDirectionZ = -forwardZ * backRatio + rightZ * rightRatio;
			const cameraPosition = new Three.Vector3(
				goat.position.x + cameraDirectionX * GoatPage.CAMERA_DISTANCE,
				followY + GoatPage.CAMERA_HEIGHT,
				goat.position.z + cameraDirectionZ * GoatPage.CAMERA_DISTANCE,
			);
			const cameraGroundY = MountainTerrain.heightAt(cameraPosition.x, cameraPosition.z);
			cameraPosition.y = Math.max(cameraPosition.y, cameraGroundY + GoatPage.CAMERA_GROUND_CLEARANCE);
			const lookPosition = groundPosition.clone();
			lookPosition.y += GoatPage.CAMERA_LOOK_HEIGHT;
			// On the start screen, the camera turns slowly around the goat.
			if (goatScreens.isPlaying() === false) {
				const orbitAngle = timestamp / 1000 * GoatPage.START_ORBIT_SPEED;
				cameraPosition.set(
					goat.position.x + Math.cos(orbitAngle) * GoatPage.START_ORBIT_RADIUS,
					groundY + GoatPage.START_ORBIT_HEIGHT,
					goat.position.z + Math.sin(orbitAngle) * GoatPage.START_ORBIT_RADIUS,
				);
				const orbitGroundY = MountainTerrain.heightAt(cameraPosition.x, cameraPosition.z);
				const lowestOrbitY = orbitGroundY + GoatPage.CAMERA_GROUND_CLEARANCE;
				cameraPosition.y = Math.max(cameraPosition.y, lowestOrbitY);
			}
			if (isCameraPlaced === false) {
				camera.position.copy(cameraPosition);
				cameraTarget.copy(lookPosition);
				isCameraPlaced = true;
			}
			const cameraRatio = Math.min(1, deltaSeconds * GoatPage.CAMERA_SPEED);
			camera.position.lerp(cameraPosition, cameraRatio);
			cameraTarget.lerp(lookPosition, cameraRatio);
			camera.lookAt(cameraTarget);

			// The shadow maps follow the camera.
			camera.updateMatrixWorld();
			csm.update();

			outlineEffect.render(scene, camera);
			stats.update();
		});
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Gives a point above another point.
	 * @param point the point.
	 * @param height the height above the point, in meters.
	 * @returns the new point.
	 */
	private static _abovePoint(point: Three.Vector3, height: number): Three.Vector3 {
		return new Three.Vector3(point.x, point.y + height, point.z);
	}
}

GoatPage.start();
