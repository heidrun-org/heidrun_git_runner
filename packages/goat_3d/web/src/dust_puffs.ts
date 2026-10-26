import * as Three from 'three';
import { ToonStyle } from './toon_style.ts';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	DustPuffs — the cartoon puffs of dust when the goat lands after a jump
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * One puff of dust.
 */
type DustPuff = {
	/**
	 * The mesh of the puff.
	 */
	mesh: Three.Mesh;

	/**
	 * The speed of the puff, in meters per second.
	 */
	velocity: Three.Vector3;

	/**
	 * The speed of the turn of the puff, in radians per second, on each axis.
	 */
	spin: Three.Vector3;

	/**
	 * The time since the puff appeared, in seconds.
	 */
	ageSeconds: number;

	/**
	 * The time that the puff lives, in seconds.
	 */
	lifeSeconds: number;

	/**
	 * The largest size of the puff, as a scale of the puff geometry.
	 */
	maximumScale: number;
};

/**
 * The cartoon puffs of dust when the goat lands after a jump. The puffs go out in a ring around the hooves, grow
 * fast, slow down, and shrink to nothing. A puff shrinks instead of fading, so that it keeps the black outline of
 * the cartoon style. The puffs come from a fixed pool of meshes, so a landing makes no new object.
 */
export class DustPuffs {
	/**
	 * The number of meshes in the pool, which is the largest number of puffs at one time.
	 */
	static readonly POOL_SIZE = 70;

	/**
	 * The number of puffs of one landing, for an intensity of 1.
	 */
	static readonly PUFFS_PER_LANDING = 14;

	/**
	 * How fast a puff slows down. A larger number stops the puff sooner.
	 */
	static readonly DRAG = 4;

	/**
	 * The color of the dust.
	 */
	static readonly DUST_COLOR = 0xe6d8bd;

	/**
	 * The group that holds every puff. Add it to the scene.
	 */
	readonly group = new Three.Group();

	/**
	 * Every puff of the pool. A puff with a hidden mesh is free.
	 */
	private readonly _puffs: DustPuff[] = [];

	/**
	 * Makes the pool of puffs. Make it before `ToonStyle.setupCascadedShadows`, so that the dust gets the shadows.
	 */
	constructor() {
		// The detail of 1 gives a round puff with a few faces, which looks like a cloud and not like a rock.
		const geometry = new Three.IcosahedronGeometry(0.12, 1);
		const material = ToonStyle.createMaterial(DustPuffs.DUST_COLOR);
		for (let index = 0; index < DustPuffs.POOL_SIZE; index++) {
			const mesh = new Three.Mesh(geometry, material);
			mesh.visible = false;
			mesh.receiveShadow = true;
			this.group.add(mesh);
			this._puffs.push({
				mesh: mesh,
				velocity: new Three.Vector3(),
				spin: new Three.Vector3(),
				ageSeconds: 0,
				lifeSeconds: 1,
				maximumScale: 1,
			});
		}
	}

	/**
	 * Makes a ring of puffs around a point of the ground.
	 * @param center the point of the ground under the goat.
	 * @param intensity the strength of the landing. 1 is a fall from the height of a jump on flat ground, and a
	 * larger number gives more, bigger, and faster puffs.
	 */
	burst(center: Three.Vector3, intensity: number): void {
		const puffCount = Math.round(DustPuffs.PUFFS_PER_LANDING * (0.4 + 0.6 * intensity));
		for (let count = 0; count < puffCount; count++) {
			const dustPuff = this._puffs.find((candidate) => candidate.mesh.visible === false);
			if (dustPuff === undefined) {
				return;
			}
			const angle = (count / puffCount) * Math.PI * 2 + Math.random() * 0.4;
			const outwardSpeed = (1.2 + Math.random() * 1.4) * Math.sqrt(intensity);
			dustPuff.velocity.set(
				Math.cos(angle) * outwardSpeed,
				0.3 + Math.random() * 0.6,
				Math.sin(angle) * outwardSpeed,
			);
			dustPuff.spin.set(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2);
			dustPuff.ageSeconds = 0;
			dustPuff.lifeSeconds = 0.6 + Math.random() * 0.4;
			dustPuff.maximumScale = (1 + Math.random() * 1.2) * (0.4 + 0.6 * intensity);
			dustPuff.mesh.position.set(
				center.x + Math.cos(angle) * 0.25,
				center.y + 0.08,
				center.z + Math.sin(angle) * 0.25,
			);
			dustPuff.mesh.scale.setScalar(0.001);
			dustPuff.mesh.visible = true;
		}
	}

	/**
	 * Moves, turns, grows, and shrinks every puff, and frees each puff at the end of its life.
	 * @param deltaSeconds the time since the previous update, in seconds.
	 */
	update(deltaSeconds: number): void {
		const dragRatio = Math.exp(-DustPuffs.DRAG * deltaSeconds);
		for (const dustPuff of this._puffs) {
			if (dustPuff.mesh.visible === false) {
				continue;
			}
			dustPuff.ageSeconds += deltaSeconds;
			const lifeRatio = dustPuff.ageSeconds / dustPuff.lifeSeconds;
			if (lifeRatio >= 1) {
				dustPuff.mesh.visible = false;
				continue;
			}
			dustPuff.mesh.position.addScaledVector(dustPuff.velocity, deltaSeconds);
			dustPuff.velocity.multiplyScalar(dragRatio);
			dustPuff.mesh.rotation.x += dustPuff.spin.x * deltaSeconds;
			dustPuff.mesh.rotation.y += dustPuff.spin.y * deltaSeconds;
			dustPuff.mesh.rotation.z += dustPuff.spin.z * deltaSeconds;
			// The puff grows in the first fifth of its life, and then shrinks slowly to nothing.
			const growRatio = 0.2;
			const sizeRatio = lifeRatio < growRatio
				? lifeRatio / growRatio
				: 1 - Math.pow((lifeRatio - growRatio) / (1 - growRatio), 2);
			dustPuff.mesh.scale.setScalar(Math.max(0.001, dustPuff.maximumScale * sizeRatio));
		}
	}
}
