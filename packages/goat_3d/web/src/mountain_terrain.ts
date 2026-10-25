import * as Three from 'three';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	MountainTerrain — the low poly ground with a mountain in the middle
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The low poly ground with a mountain in the middle. The top of the mountain is at x = 0 and z = 0, and a flag
 * marks the top. The same function gives the height of the ground to the drawing and to the goat.
 */
export class MountainTerrain {
	/**
	 * The length of a side of the square ground, in units.
	 */
	static readonly SIZE = 60;

	/**
	 * The number of squares on a side of the ground. Each square has two triangles.
	 */
	static readonly SEGMENT_COUNT = 90;

	/**
	 * The height of the top of the mountain, before the bumps, in units.
	 */
	static readonly PEAK_HEIGHT = 10;

	/**
	 * How wide the mountain is, in units. A larger number gives a wider mountain with gentler slopes.
	 */
	static readonly SPREAD = 7;

	/**
	 * Above this height, the ground is snow.
	 */
	static readonly SNOW_HEIGHT = 7.5;

	/**
	 * When the upward part of the normal of a triangle is smaller than this number, the triangle is steep, and
	 * the ground is rock.
	 */
	static readonly ROCK_NORMAL_Y = 0.78;

	/**
	 * Gives the height of the ground at a point.
	 * @param x the position on the x axis.
	 * @param z the position on the z axis.
	 * @returns the height of the ground, in units.
	 */
	static heightAt(x: number, z: number): number {
		// The mountain is a little longer on the x axis than on the z axis.
		const distanceSquared = x * x + (z * 1.2) * (z * 1.2);
		const mountainHeight = MountainTerrain.PEAK_HEIGHT * Math.exp(
			-distanceSquared / (2 * MountainTerrain.SPREAD * MountainTerrain.SPREAD),
		);
		// The bumps are larger on the mountain than on the plain.
		const bumpSize = 0.25 + 0.06 * mountainHeight;
		const bumps = Math.sin(x * 0.55) * Math.cos(z * 0.5) + 0.5 * Math.sin(x * 1.3 + z * 0.9);
		return mountainHeight + bumpSize * bumps;
	}

	/**
	 * Makes the 3D object of the ground, with the flag at the top of the mountain.
	 * @returns the group that holds the ground and the flag.
	 */
	static create(): Three.Group {
		const group = new Three.Group();
		group.add(MountainTerrain._createGround());
		group.add(MountainTerrain._createSummitFlag());
		return group;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Makes the mesh of the ground. Each triangle has one color: grass on the gentle slopes, rock on the steep
	 * slopes, and snow at the top.
	 * @returns the mesh of the ground.
	 */
	private static _createGround(): Three.Mesh {
		const planeGeometry = new Three.PlaneGeometry(
			MountainTerrain.SIZE,
			MountainTerrain.SIZE,
			MountainTerrain.SEGMENT_COUNT,
			MountainTerrain.SEGMENT_COUNT,
		);
		planeGeometry.rotateX(-Math.PI / 2);
		// Each triangle gets its own three points, so that each triangle can have its own color.
		const geometry = planeGeometry.toNonIndexed();
		planeGeometry.dispose();

		const positions = geometry.getAttribute('position') as Three.BufferAttribute;
		for (let index = 0; index < positions.count; index++) {
			positions.setY(index, MountainTerrain.heightAt(positions.getX(index), positions.getZ(index)));
		}
		geometry.computeVertexNormals();

		const normals = geometry.getAttribute('normal') as Three.BufferAttribute;
		const colors = new Float32Array(positions.count * 3);
		const grassColor = new Three.Color(0x6f9a4a);
		const highGrassColor = new Three.Color(0x56763a);
		const rockColor = new Three.Color(0x8a8580);
		const snowColor = new Three.Color(0xf2f5f8);
		const triangleColor = new Three.Color();
		for (let firstIndex = 0; firstIndex < positions.count; firstIndex += 3) {
			const sumY = positions.getY(firstIndex)
				+ positions.getY(firstIndex + 1)
				+ positions.getY(firstIndex + 2);
			const averageY = sumY / 3;
			const normalY = normals.getY(firstIndex);
			if (averageY > MountainTerrain.SNOW_HEIGHT) {
				triangleColor.copy(snowColor);
			} else if (normalY < MountainTerrain.ROCK_NORMAL_Y) {
				triangleColor.copy(rockColor);
			} else {
				const heightRatio = Math.min(1, Math.max(0, averageY / MountainTerrain.SNOW_HEIGHT));
				triangleColor.copy(grassColor).lerp(highGrassColor, heightRatio);
			}
			// A small change of brightness on each triangle shows the low poly faces.
			const brightness = 0.94 + 0.06 * Math.sin(firstIndex * 12.9898);
			triangleColor.multiplyScalar(brightness);
			for (let corner = 0; corner < 3; corner++) {
				colors[(firstIndex + corner) * 3] = triangleColor.r;
				colors[(firstIndex + corner) * 3 + 1] = triangleColor.g;
				colors[(firstIndex + corner) * 3 + 2] = triangleColor.b;
			}
		}
		geometry.setAttribute('color', new Three.BufferAttribute(colors, 3));

		const ground = new Three.Mesh(geometry, new Three.MeshStandardMaterial({
			vertexColors: true,
			flatShading: true,
			roughness: 0.95,
		}));
		ground.receiveShadow = true;
		return ground;
	}

	/**
	 * Makes the flag at the top of the mountain.
	 * @returns the group that holds the pole and the cloth of the flag.
	 */
	private static _createSummitFlag(): Three.Group {
		const flag = new Three.Group();
		flag.position.set(0, MountainTerrain.heightAt(0, 0), 0);

		const pole = new Three.Mesh(
			new Three.CylinderGeometry(0.04, 0.04, 1.6, 6),
			new Three.MeshStandardMaterial({
				color: 0x6b5a45,
				flatShading: true,
			}),
		);
		pole.position.y = 0.8;
		pole.castShadow = true;
		flag.add(pole);

		const cloth = new Three.Mesh(
			new Three.BoxGeometry(0.6, 0.38, 0.02),
			new Three.MeshStandardMaterial({
				color: 0xd8432f,
				flatShading: true,
			}),
		);
		cloth.position.set(0.3, 1.38, 0);
		cloth.castShadow = true;
		flag.add(cloth);

		return flag;
	}
}
