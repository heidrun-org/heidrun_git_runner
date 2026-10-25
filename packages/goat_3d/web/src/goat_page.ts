import * as Three from 'three';
import { GoatJump } from './goat_jump.ts';
import { GoatKeyboard } from './goat_keyboard.ts';
import { GoatModel } from './goat_model.ts';
import { MountainTerrain } from './mountain_terrain.ts';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GoatPage — the low poly goat climbs the mountain with the arrow keys and jumps with the space key
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The page of the game Goat 3D. The goat starts at the foot of a mountain, and the player makes the goat climb to
 * the flag at the top. The up arrow walks forward, the down arrow walks backward, the left arrow and the right
 * arrow turn the goat, and the space key makes the goat jump.
 */
export class GoatPage {
	/**
	 * The speed of the goat when it walks, in units per second.
	 */
	static readonly WALK_SPEED = 1.6;

	/**
	 * The speed of the goat when it turns, in radians per second.
	 */
	static readonly TURN_SPEED = 2.2;

	/**
	 * The number of steps per unit of distance, in radians of the step angle per unit.
	 */
	static readonly STEP_ANGLE_PER_UNIT = 7;

	/**
	 * The largest angle of a leg swing, in radians.
	 */
	static readonly LEG_SWING_ANGLE = 0.45;

	/**
	 * The distance from the goat to the edge of the ground, below which the goat cannot go, in units.
	 */
	static readonly EDGE_MARGIN = 1;

	/**
	 * The distance of the camera behind the goat, in units.
	 */
	static readonly CAMERA_DISTANCE = 5.5;

	/**
	 * The height of the camera above the feet of the goat, in units.
	 */
	static readonly CAMERA_HEIGHT = 2.6;

	/**
	 * The smallest height of the camera above the ground, so that the camera never goes into the mountain.
	 */
	static readonly CAMERA_GROUND_CLEARANCE = 0.6;

	/**
	 * How fast the camera follows the goat. A larger number gives a faster camera.
	 */
	static readonly CAMERA_SPEED = 4;

	/**
	 * How fast the goat leans to follow the slope under it. A larger number gives a faster lean.
	 */
	static readonly SLOPE_SPEED = 10;

	/**
	 * The position of the sun light, from the goat.
	 */
	static readonly LIGHT_OFFSET = new Three.Vector3(3, 5, 4);

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

		scene.add(MountainTerrain.create());

		// The goat starts at the foot of the mountain and looks to the top, in the -z direction.
		const goatModel = new GoatModel();
		const goat = goatModel.group;
		goat.position.set(0, 0, 20);
		goat.rotation.y = Math.PI / 2;
		scene.add(goat);
		const goatKeyboard = new GoatKeyboard();
		const goatJump = new GoatJump();

		scene.add(new Three.HemisphereLight(0xcfe3ff, 0x5a6b3a, 1.2));
		const directionalLight = new Three.DirectionalLight(0xfff4e0, 2);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.set(2048, 2048);
		directionalLight.shadow.camera.left = -3;
		directionalLight.shadow.camera.right = 3;
		directionalLight.shadow.camera.top = 3;
		directionalLight.shadow.camera.bottom = -3;
		scene.add(directionalLight);
		scene.add(directionalLight.target);

		window.addEventListener('resize', () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});

		let walkPhase = 0;
		let legSwingAngle = 0;
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
			const walkDistance = walkDirection * GoatPage.WALK_SPEED * deltaSeconds;
			goat.position.x += Math.cos(goat.rotation.y) * walkDistance;
			goat.position.z -= Math.sin(goat.rotation.y) * walkDistance;
			const maximumCoordinate = MountainTerrain.SIZE / 2 - GoatPage.EDGE_MARGIN;
			goat.position.x = Math.min(maximumCoordinate, Math.max(-maximumCoordinate, goat.position.x));
			goat.position.z = Math.min(maximumCoordinate, Math.max(-maximumCoordinate, goat.position.z));

			const groundY = MountainTerrain.heightAt(goat.position.x, goat.position.z);
			goatJump.update(deltaSeconds, goatKeyboard.isPressed(' '), groundY);
			goat.position.y = goatJump.positionY;

			// The goat leans with the slope in the direction that it looks: the head goes up when the goat
			// climbs.
			const forwardX = Math.cos(goat.rotation.y);
			const forwardZ = -Math.sin(goat.rotation.y);
			const halfLength = 0.5;
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
			const isMoving = (walkDirection !== 0 || turnDirection !== 0) && goatJump.isStanding() === true;
			const stepDistance = walkDirection !== 0 ? walkDistance : turnDirection * 0.5 * deltaSeconds;
			walkPhase += stepDistance * GoatPage.STEP_ANGLE_PER_UNIT;
			const targetSwingAngle = isMoving === true ? GoatPage.LEG_SWING_ANGLE : 0;
			legSwingAngle += (targetSwingAngle - legSwingAngle) * Math.min(1, deltaSeconds * 10);
			goatModel.applyPose(goatJump.pose, walkPhase, legSwingAngle);

			// The camera follows the goat from behind, on the ground under the goat, but not up in a jump.
			const groundPosition = new Three.Vector3(goat.position.x, groundY, goat.position.z);
			const cameraPosition = new Three.Vector3(
				goat.position.x - forwardX * GoatPage.CAMERA_DISTANCE,
				groundY + GoatPage.CAMERA_HEIGHT,
				goat.position.z - forwardZ * GoatPage.CAMERA_DISTANCE,
			);
			const cameraGroundY = MountainTerrain.heightAt(cameraPosition.x, cameraPosition.z);
			cameraPosition.y = Math.max(cameraPosition.y, cameraGroundY + GoatPage.CAMERA_GROUND_CLEARANCE);
			const lookPosition = groundPosition.clone().add(new Three.Vector3(0, 1, 0));
			if (isCameraPlaced === false) {
				camera.position.copy(cameraPosition);
				cameraTarget.copy(lookPosition);
				isCameraPlaced = true;
			}
			const cameraRatio = Math.min(1, deltaSeconds * GoatPage.CAMERA_SPEED);
			camera.position.lerp(cameraPosition, cameraRatio);
			cameraTarget.lerp(lookPosition, cameraRatio);
			camera.lookAt(cameraTarget);

			// The sun light follows the goat, so that the shadow of the goat is always sharp.
			directionalLight.position.copy(groundPosition).add(GoatPage.LIGHT_OFFSET);
			directionalLight.target.position.copy(groundPosition);

			renderer.render(scene, camera);
		});
	}
}

GoatPage.start();
