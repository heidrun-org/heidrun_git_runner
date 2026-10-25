import * as Three from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MountainTerrain } from './mountain_terrain.ts';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GothicTrees — dark, twisted trees with no leaves on the slopes of the mountain
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Dark, twisted trees with no leaves, on the grass of the ground around the mountain. Every tree is in one mesh,
 * so that the trees cost only one draw call. The same seed always gives the same trees at the same places.
 */
export class GothicTrees {
	/**
	 * The number of trees.
	 */
	static readonly TREE_COUNT = 45;

	/**
	 * The seed of the random numbers that place and shape the trees.
	 */
	static readonly SEED = 1987;

	/**
	 * The number of times that a branch splits into smaller branches, from the trunk to the thinnest branches.
	 */
	static readonly BRANCH_DEPTH = 4;

	/**
	 * A tree grows only where the ground is lower than this height, so that no tree grows on the rock or on the
	 * snow.
	 */
	static readonly MAXIMUM_GROUND_HEIGHT = 4;

	/**
	 * A tree grows only where the slope is gentler than this slope, in units up per unit across.
	 */
	static readonly MAXIMUM_SLOPE = 0.7;

	/**
	 * No tree grows nearer than this distance to the start point of the goat, in units.
	 */
	static readonly START_CLEARANCE = 4;

	/**
	 * Makes the mesh that holds every tree.
	 * @param goatStart the start point of the goat, which stays free of trees.
	 * @returns the mesh of the trees.
	 */
	static create(goatStart: Three.Vector3): Three.Mesh {
		const randomFn = GothicTrees._createRandomFn(GothicTrees.SEED);
		const geometries: Three.BufferGeometry[] = [];
		const halfSize = MountainTerrain.SIZE / 2 - 2;

		let placedCount = 0;
		let attemptCount = 0;
		while (placedCount < GothicTrees.TREE_COUNT && attemptCount < GothicTrees.TREE_COUNT * 50) {
			attemptCount++;
			const x = (randomFn() * 2 - 1) * halfSize;
			const z = (randomFn() * 2 - 1) * halfSize;
			if (GothicTrees._canGrowAt(x, z, goatStart) === false) {
				continue;
			}
			// The trunk goes a little into the ground, so that no gap shows on a slope.
			const base = new Three.Vector3(x, MountainTerrain.heightAt(x, z) - 0.2, z);
			const trunkLeanX = (randomFn() - 0.5) * 0.3;
			const trunkLeanZ = (randomFn() - 0.5) * 0.3;
			const trunkDirection = new Three.Vector3(trunkLeanX, 1, trunkLeanZ).normalize();
			const trunkLength = 1.6 + randomFn() * 0.9;
			const trunkRadius = 0.12 + randomFn() * 0.06;
			GothicTrees._addBranch(geometries, randomFn, base, trunkDirection, trunkLength, trunkRadius, 0);
			placedCount++;
		}

		const geometry = BufferGeometryUtils.mergeGeometries(geometries);
		for (const branchGeometry of geometries) {
			branchGeometry.dispose();
		}
		const mesh = new Three.Mesh(geometry, new Three.MeshStandardMaterial({
			color: 0x2b2522,
			flatShading: true,
			roughness: 1,
		}));
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Tells if a tree can grow at a point: the ground is grass, the slope is gentle, and the point is far from
	 * the start point of the goat.
	 * @param x the position on the x axis.
	 * @param z the position on the z axis.
	 * @param goatStart the start point of the goat.
	 * @returns true when a tree can grow at the point.
	 */
	private static _canGrowAt(x: number, z: number, goatStart: Three.Vector3): boolean {
		if (Math.hypot(x - goatStart.x, z - goatStart.z) < GothicTrees.START_CLEARANCE) {
			return false;
		}
		if (MountainTerrain.heightAt(x, z) > GothicTrees.MAXIMUM_GROUND_HEIGHT) {
			return false;
		}
		const step = 0.5;
		const differenceX = MountainTerrain.heightAt(x + step, z) - MountainTerrain.heightAt(x - step, z);
		const differenceZ = MountainTerrain.heightAt(x, z + step) - MountainTerrain.heightAt(x, z - step);
		const slopeX = differenceX / (2 * step);
		const slopeZ = differenceZ / (2 * step);
		return Math.hypot(slopeX, slopeZ) < GothicTrees.MAXIMUM_SLOPE;
	}

	/**
	 * Adds one branch, and then the smaller branches that grow from its end. Each smaller branch turns away
	 * from its parent and bends down a little more, which gives the twisted shape.
	 * @param geometries the list that gets the geometry of each branch.
	 * @param randomFn the function that gives the next random number, from 0 to 1.
	 * @param start the point where the branch starts.
	 * @param direction the direction of the branch, as a unit vector.
	 * @param length the length of the branch, in units.
	 * @param radius the radius of the branch at its start, in units.
	 * @param depth the number of splits from the trunk to this branch. The trunk has a depth of 0.
	 */
	private static _addBranch(
		geometries: Three.BufferGeometry[],
		randomFn: () => number,
		start: Three.Vector3,
		direction: Three.Vector3,
		length: number,
		radius: number,
		depth: number,
	): void {
		const end = start.clone().addScaledVector(direction, length);
		const endRadius = radius * 0.65;
		geometries.push(GothicTrees._createSegmentGeometry(start, end, radius, endRadius));
		if (depth >= GothicTrees.BRANCH_DEPTH) {
			return;
		}

		const childCount = depth === 0 ? 3 : 2 + Math.floor(randomFn() * 2);
		for (let childIndex = 0; childIndex < childCount; childIndex++) {
			const randomVector = new Three.Vector3(randomFn() - 0.5, randomFn() - 0.5, randomFn() - 0.5);
			const axis = new Three.Vector3().crossVectors(direction, randomVector).normalize();
			const angle = 0.5 + randomFn() * 0.5;
			const childDirection = direction.clone().applyAxisAngle(axis, angle);
			childDirection.y -= 0.08 * depth;
			childDirection.normalize();
			const childLength = length * (0.6 + randomFn() * 0.2);
			GothicTrees._addBranch(
				geometries,
				randomFn,
				end,
				childDirection,
				childLength,
				endRadius,
				depth + 1,
			);
		}
	}

	/**
	 * Makes the geometry of a cylinder that goes from one point to another point, with a radius at each end.
	 * @param start the point at the start of the cylinder.
	 * @param end the point at the end of the cylinder.
	 * @param startRadius the radius at the start of the cylinder.
	 * @param endRadius the radius at the end of the cylinder.
	 * @returns the geometry, already moved to its place.
	 */
	private static _createSegmentGeometry(
		start: Three.Vector3,
		end: Three.Vector3,
		startRadius: number,
		endRadius: number,
	): Three.BufferGeometry {
		const direction = new Three.Vector3().subVectors(end, start);
		const geometry = new Three.CylinderGeometry(endRadius, startRadius, direction.length(), 5);
		const upDirection = new Three.Vector3(0, 1, 0);
		const quaternion = new Three.Quaternion().setFromUnitVectors(upDirection, direction.normalize());
		const center = new Three.Vector3().addVectors(start, end).multiplyScalar(0.5);
		geometry.applyMatrix4(new Three.Matrix4().compose(center, quaternion, new Three.Vector3(1, 1, 1)));
		return geometry;
	}

	/**
	 * Makes a function that gives random numbers from a seed. The same seed always gives the same numbers.
	 * @param seed the seed.
	 * @returns the function that gives the next random number, from 0 to 1.
	 */
	private static _createRandomFn(seed: number): () => number {
		let state = seed;
		return () => {
			state = (state + 0x6d2b79f5) | 0;
			let value = Math.imul(state ^ (state >>> 15), 1 | state);
			value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
			return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
		};
	}
}
