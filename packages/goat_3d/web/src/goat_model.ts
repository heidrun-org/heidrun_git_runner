import * as Three from 'three';
import type { GoatPose } from './goat_jump.ts';
import { ToonStyle } from './toon_style.ts';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GoatModel — builds a low poly goat from simple Three.js shapes and puts it in a pose
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The groups of the legs of the goat, in this order: back left, back right, front left, front right.
 */
type GoatLegs = {
	/**
	 * The groups at the hips. Each group turns the whole leg.
	 */
	hips: Three.Group[];

	/**
	 * The groups at the knees. Each group turns the lower leg and the hoof.
	 */
	knees: Three.Group[];
};

/**
 * The 3D model of the goat. The goat stands on the ground at y = 0 and looks to the +x direction.
 */
export class GoatModel {
	/**
	 * The height of the center of the body above the ground, when the goat stands. The body turns around this
	 * point when the goat leans forward or backward.
	 */
	static readonly BODY_CENTER_Y = 0.95;

	/**
	 * The group that holds every part of the goat. Move and turn this group to move and turn the goat.
	 */
	readonly group: Three.Group;

	/**
	 * The group at the center of the body. It moves down when the goat crouches, and it turns when the goat
	 * leans forward or backward.
	 */
	private readonly _bodyCenter: Three.Group;

	/**
	 * The four legs, in this order: back left, back right, front left, front right. Each leg turns at its hip.
	 */
	private readonly _hips: Three.Group[];

	/**
	 * The four lower legs, in the same order as the hips. Each lower leg turns at its knee.
	 */
	private readonly _knees: Three.Group[];

	/**
	 * Makes a new goat.
	 */
	constructor() {
		const furMaterial = GoatModel._material(0xf1ece2);
		const snoutMaterial = GoatModel._material(0xd8c3b8);
		const hornMaterial = GoatModel._material(0x7a6650);
		const hoofMaterial = GoatModel._material(0x3a332c);
		const eyeMaterial = GoatModel._material(0xc8962d);
		const pupilMaterial = GoatModel._material(0x111111);

		// The parts are placed as if the goat stands on the ground, and the group "parts" moves them down so
		// that the center of the body is at the origin of the group "bodyCenter".
		const goat = new Three.Group();
		const bodyCenter = new Three.Group();
		bodyCenter.position.y = GoatModel.BODY_CENTER_Y;
		goat.add(bodyCenter);
		const parts = new Three.Group();
		parts.position.y = -GoatModel.BODY_CENTER_Y;
		bodyCenter.add(parts);

		const body = GoatModel._mesh(new Three.CapsuleGeometry(0.36, 0.75, 4, 12), furMaterial, 0, 0.95, 0);
		body.rotation.z = Math.PI / 2;
		body.scale.set(1, 1, 0.85);
		parts.add(body);

		const legs = GoatModel._addLegs(parts, furMaterial, hoofMaterial);
		GoatModel._addHead(parts, furMaterial, snoutMaterial, eyeMaterial, pupilMaterial);
		GoatModel._addHorns(parts, hornMaterial);

		const tail = GoatModel._mesh(new Three.ConeGeometry(0.05, 0.18, 6), furMaterial, -0.75, 1.15, 0);
		tail.rotation.z = 0.9;
		parts.add(tail);

		goat.traverse((object: Three.Object3D) => {
			object.castShadow = true;
		});

		this.group = goat;
		this._bodyCenter = bodyCenter;
		this._hips = legs.hips;
		this._knees = legs.knees;
	}

	/**
	 * Puts the goat in a pose, and adds the swing of the legs of the walk on top of the pose. The back left leg
	 * and the front right leg swing together, and the two other legs swing the opposite way, like the walk of a
	 * real goat.
	 * @param goatPose the pose of the body and of the legs.
	 * @param walkPhase the angle of the step, in radians. One step is 2 * PI.
	 * @param swingAngle the largest angle of a swing of the walk, in radians. 0 stops the swing.
	 */
	applyPose(goatPose: GoatPose, walkPhase: number, swingAngle: number): void {
		this._bodyCenter.position.y = GoatModel.BODY_CENTER_Y - goatPose.crouch;
		this._bodyCenter.rotation.z = goatPose.pitch;

		const swingSigns = [1, -1, -1, 1];
		for (let index = 0; index < this._hips.length; index++) {
			// The first two legs are the back legs.
			const isBackLeg = index < 2;
			const hipAngle = isBackLeg === true ? goatPose.backHip : goatPose.frontHip;
			const kneeAngle = isBackLeg === true ? goatPose.backKnee : goatPose.frontKnee;
			this._hips[index].rotation.z = hipAngle + swingSigns[index] * Math.sin(walkPhase) * swingAngle;
			this._knees[index].rotation.z = kneeAngle;
		}
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Parts
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Adds the four legs, each with an upper leg, a knee, a lower leg, and a hoof. Each leg is a group at its hip,
	 * so that the leg turns at the hip, and each lower leg is a group at its knee, so that the lower leg turns at
	 * the knee.
	 * @param goat the group of the goat.
	 * @param furMaterial the material of the fur.
	 * @param hoofMaterial the material of the hooves.
	 * @returns the hips and the knees, in this order: back left, back right, front left, front right.
	 */
	private static _addLegs(
		goat: Three.Group,
		furMaterial: Three.Material,
		hoofMaterial: Three.Material,
	): GoatLegs {
		const goatLegs: GoatLegs = {
			hips: [],
			knees: [],
		};
		const kneeGeometry = new Three.SphereGeometry(0.065, 8, 6);
		const hoofGeometry = new Three.CylinderGeometry(0.055, 0.07, 0.08, 8);
		const hipY = 0.9;
		const kneeY = 0.42;
		for (const legX of [-0.42, 0.42]) {
			// The back legs bend backward at the hock, and the front legs stand straight.
			const kneeOffsetX = legX < 0 ? -0.06 : 0.02;
			for (const legZ of [-0.17, 0.17]) {
				const hip = new Three.Group();
				hip.position.set(legX, hipY, legZ);
				hip.add(GoatModel._segment(
					new Three.Vector3(0, 0, 0),
					new Three.Vector3(kneeOffsetX, kneeY - hipY, 0),
					0.11,
					0.065,
					furMaterial,
				));

				const knee = new Three.Group();
				knee.position.set(kneeOffsetX, kneeY - hipY, 0);
				knee.add(GoatModel._mesh(kneeGeometry, furMaterial, 0, 0, 0));
				knee.add(GoatModel._segment(
					new Three.Vector3(0, 0, 0),
					new Three.Vector3(-kneeOffsetX, 0.08 - kneeY, 0),
					0.06,
					0.05,
					furMaterial,
				));
				knee.add(GoatModel._mesh(hoofGeometry, hoofMaterial, -kneeOffsetX, 0.04 - kneeY, 0));
				hip.add(knee);

				goat.add(hip);
				goatLegs.hips.push(hip);
				goatLegs.knees.push(knee);
			}
		}
		return goatLegs;
	}

	/**
	 * Adds the neck, the head, the snout, the eyes, the ears, and the beard.
	 * @param goat the group of the goat.
	 * @param furMaterial the material of the fur.
	 * @param snoutMaterial the material of the end of the snout.
	 * @param eyeMaterial the material of the eyes.
	 * @param pupilMaterial the material of the pupils.
	 */
	private static _addHead(
		goat: Three.Group,
		furMaterial: Three.Material,
		snoutMaterial: Three.Material,
		eyeMaterial: Three.Material,
		pupilMaterial: Three.Material,
	): void {
		const neckStart = new Three.Vector3(0.5, 1.05, 0);
		const neckEnd = new Three.Vector3(0.85, 1.5, 0);
		goat.add(GoatModel._segment(neckStart, neckEnd, 0.2, 0.13, furMaterial));

		const head = GoatModel._mesh(new Three.SphereGeometry(0.2, 12, 8), furMaterial, 0.92, 1.58, 0);
		head.scale.set(1.15, 1, 0.9);
		goat.add(head);

		const snoutStart = new Three.Vector3(1.0, 1.55, 0);
		const snoutEnd = new Three.Vector3(1.25, 1.45, 0);
		goat.add(GoatModel._segment(snoutStart, snoutEnd, 0.13, 0.085, furMaterial));
		const noseGeometry = new Three.SphereGeometry(0.085, 10, 6);
		goat.add(GoatModel._mesh(noseGeometry, snoutMaterial, snoutEnd.x, snoutEnd.y, snoutEnd.z));

		const beard = GoatModel._mesh(new Three.ConeGeometry(0.05, 0.22, 6), furMaterial, 1.15, 1.32, 0);
		beard.rotation.z = Math.PI + 0.2;
		goat.add(beard);

		const eyeGeometry = new Three.SphereGeometry(0.035, 10, 8);
		// A goat has a pupil that is a horizontal slit.
		const pupilGeometry = new Three.BoxGeometry(0.045, 0.012, 0.01);
		const earGeometry = new Three.ConeGeometry(0.06, 0.22, 8);
		for (const side of [-1, 1]) {
			goat.add(GoatModel._mesh(eyeGeometry, eyeMaterial, 1.02, 1.64, side * 0.15));
			goat.add(GoatModel._mesh(pupilGeometry, pupilMaterial, 1.025, 1.64, side * 0.183));

			const ear = GoatModel._mesh(earGeometry, furMaterial, 0.84, 1.63, side * 0.2);
			ear.scale.set(1, 1, 0.45);
			ear.rotation.x = side * (Math.PI / 2 + 0.3);
			goat.add(ear);
		}
	}

	/**
	 * Adds the two horns, which curve backward and become thinner to the tip.
	 * @param goat the group of the goat.
	 * @param hornMaterial the material of the horns.
	 */
	private static _addHorns(goat: Three.Group, hornMaterial: Three.Material): void {
		const segmentCount = 8;
		const curveRadius = 0.22;
		const maximumAngle = 1.9;
		for (const side of [-1, 1]) {
			const points: Three.Vector3[] = [];
			for (let index = 0; index <= segmentCount; index++) {
				const ratio = index / segmentCount;
				const angle = ratio * maximumAngle;
				points.push(new Three.Vector3(
					0.88 - curveRadius * (1 - Math.cos(angle)),
					1.72 + curveRadius * Math.sin(angle),
					side * (0.08 + 0.08 * ratio),
				));
			}
			for (let index = 0; index < segmentCount; index++) {
				const startRadius = 0.05 - 0.038 * (index / segmentCount);
				const endRadius = 0.05 - 0.038 * ((index + 1) / segmentCount);
				const start = points[index];
				const end = points[index + 1];
				goat.add(GoatModel._segment(start, end, startRadius, endRadius, hornMaterial));
			}
		}
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Makes a cartoon material.
	 * @param color the color of the material.
	 * @returns the material.
	 */
	private static _material(color: number): Three.MeshToonMaterial {
		return ToonStyle.createMaterial(color);
	}

	/**
	 * Makes a mesh at a position.
	 * @param geometry the shape of the mesh.
	 * @param material the material of the mesh.
	 * @param x the position on the x axis.
	 * @param y the position on the y axis.
	 * @param z the position on the z axis.
	 * @returns the mesh.
	 */
	private static _mesh(
		geometry: Three.BufferGeometry,
		material: Three.Material,
		x: number,
		y: number,
		z: number,
	): Three.Mesh {
		const mesh = new Three.Mesh(geometry, material);
		mesh.position.set(x, y, z);
		return mesh;
	}

	/**
	 * Makes a cylinder that goes from one point to another point, with a radius at each end.
	 * @param start the point at the start of the cylinder.
	 * @param end the point at the end of the cylinder.
	 * @param startRadius the radius at the start of the cylinder.
	 * @param endRadius the radius at the end of the cylinder.
	 * @param material the material of the cylinder.
	 * @returns the mesh of the cylinder.
	 */
	private static _segment(
		start: Three.Vector3,
		end: Three.Vector3,
		startRadius: number,
		endRadius: number,
		material: Three.Material,
	): Three.Mesh {
		const direction = new Three.Vector3().subVectors(end, start);
		const geometry = new Three.CylinderGeometry(endRadius, startRadius, direction.length(), 8);
		const center = new Three.Vector3().addVectors(start, end).multiplyScalar(0.5);
		const mesh = GoatModel._mesh(geometry, material, center.x, center.y, center.z);
		mesh.quaternion.setFromUnitVectors(new Three.Vector3(0, 1, 0), direction.normalize());
		return mesh;
	}
}
