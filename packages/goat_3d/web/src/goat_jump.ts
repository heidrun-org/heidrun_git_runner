///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GoatJump — moves the goat up and down in a jump and gives the pose of each moment of the jump
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The pose of the goat. Every angle is in radians. A positive angle of a leg moves the hoof forward, and a
 * negative angle moves the hoof backward.
 */
export type GoatPose = {
	/**
	 * How far the body goes down, in units. 0 is the body of a goat that stands.
	 */
	crouch: number;

	/**
	 * How much the body leans. A positive angle lifts the head, and a negative angle lowers the head.
	 */
	pitch: number;

	/**
	 * The angle of the front legs at the hips.
	 */
	frontHip: number;

	/**
	 * The angle of the front lower legs at the knees.
	 */
	frontKnee: number;

	/**
	 * The angle of the back legs at the hips.
	 */
	backHip: number;

	/**
	 * The angle of the back lower legs at the knees.
	 */
	backKnee: number;
};

/**
 * The step of the jump that the goat is in.
 * - `standing`: the goat is on the ground and can walk and jump.
 * - `crouching`: the goat bends its legs just before it leaves the ground.
 * - `flying`: the goat is in the air.
 * - `landing`: the goat bends its legs when it touches the ground, and then stands up again.
 */
type GoatJumpState = 'standing' | 'crouching' | 'flying' | 'landing';

/**
 * Moves the goat up and down in a jump, and gives the pose of each moment of the jump: the goat crouches,
 * leaves the ground with the head up and the front legs folded, folds all its legs at the top, lowers the head
 * and stretches the front legs to land, and crouches again when it touches the ground.
 */
export class GoatJump {
	/**
	 * The upward speed of the goat when the goat leaves the ground, in units per second.
	 */
	static readonly JUMP_SPEED = 4.5;

	/**
	 * The gravity that pulls the goat back to the ground, in units per second per second.
	 */
	static readonly GRAVITY = 12;

	/**
	 * The time that the goat crouches before it leaves the ground, in seconds.
	 */
	static readonly CROUCH_SECONDS = 0.12;

	/**
	 * The time that the goat stays crouched after it touches the ground, in seconds.
	 */
	static readonly LANDING_CROUCH_SECONDS = 0.1;

	/**
	 * The time from the moment the goat touches the ground to the moment it can jump again, in seconds.
	 */
	static readonly LANDING_SECONDS = 0.25;

	/**
	 * How fast the pose goes to the pose of the step of the jump. A larger number gives a faster change.
	 */
	static readonly POSE_SPEED = 18;

	/**
	 * The pose of a goat that stands.
	 */
	static readonly STANDING_POSE: GoatPose = {
		crouch: 0,
		pitch: 0,
		frontHip: 0,
		frontKnee: 0,
		backHip: 0,
		backKnee: 0,
	};

	/**
	 * The pose of a goat that bends its legs, before it leaves the ground and after it lands. The angles keep the
	 * hooves on the ground.
	 */
	static readonly CROUCHING_POSE: GoatPose = {
		crouch: 0.15,
		pitch: 0,
		frontHip: 0.6,
		frontKnee: -1.23,
		backHip: -0.6,
		backKnee: 1.23,
	};

	/**
	 * The pose of a goat that leaves the ground: the head goes up, the front legs fold, and the back legs push.
	 */
	static readonly TAKEOFF_POSE: GoatPose = {
		crouch: 0,
		pitch: 0.35,
		frontHip: 1.1,
		frontKnee: -2.0,
		backHip: -0.7,
		backKnee: 0.2,
	};

	/**
	 * The pose of a goat at the top of the jump: the body is level, and all the legs fold under the body.
	 */
	static readonly TOP_POSE: GoatPose = {
		crouch: 0,
		pitch: 0,
		frontHip: 0.9,
		frontKnee: -1.9,
		backHip: 0.6,
		backKnee: -1.4,
	};

	/**
	 * The pose of a goat just before it lands: the head goes down, the front legs stretch forward to touch the
	 * ground, and the back legs stay behind.
	 */
	static readonly LANDING_POSE: GoatPose = {
		crouch: 0,
		pitch: -0.3,
		frontHip: 0.4,
		frontKnee: 0,
		backHip: -0.5,
		backKnee: 0.8,
	};

	/**
	 * The height of the feet of the goat, in units. While the goat is not in the air, it is the height of the
	 * ground under the goat.
	 */
	positionY = 0;

	/**
	 * The pose of the goat at this moment.
	 */
	pose: GoatPose = {
		...GoatJump.STANDING_POSE,
	};

	/**
	 * The upward speed of the goat, in units per second. A negative speed moves the goat down.
	 */
	private _verticalSpeed = 0;

	/**
	 * The step of the jump that the goat is in.
	 */
	private _state: GoatJumpState = 'standing';

	/**
	 * The time since the goat went in the current step of the jump, in seconds.
	 */
	private _stateSeconds = 0;

	/**
	 * Tells if the player held down the jump key at the previous update.
	 */
	private _wasJumpPressed = false;

	/**
	 * Tells if the goat stands on the ground, so that it can walk with its legs.
	 * @returns true when the goat stands on the ground.
	 */
	isStanding(): boolean {
		return this._state === 'standing';
	}

	/**
	 * Moves the jump forward in time. The goat starts a jump only when the player presses the jump key again,
	 * not while the player holds the jump key down.
	 * @param deltaSeconds the time since the previous update, in seconds.
	 * @param isJumpPressed true when the player holds down the jump key.
	 * @param groundY the height of the ground under the goat, in units.
	 */
	update(deltaSeconds: number, isJumpPressed: boolean, groundY: number): void {
		const isJumpStarted = isJumpPressed === true && this._wasJumpPressed === false;
		this._wasJumpPressed = isJumpPressed;
		this._stateSeconds += deltaSeconds;

		if (this._state === 'standing' && isJumpStarted === true) {
			this._changeState('crouching');
		}
		if (this._state === 'crouching' && this._stateSeconds >= GoatJump.CROUCH_SECONDS) {
			this._verticalSpeed = GoatJump.JUMP_SPEED;
			this._changeState('flying');
		}
		if (this._state === 'flying') {
			this._verticalSpeed -= GoatJump.GRAVITY * deltaSeconds;
			this.positionY += this._verticalSpeed * deltaSeconds;
			// The goat lands only while it comes down, so that a jump up a slope does not stop at once.
			// While the goat goes up, the ground only pushes the goat up.
			if (this.positionY <= groundY && this._verticalSpeed < 0) {
				this._verticalSpeed = 0;
				this._changeState('landing');
			} else if (this.positionY < groundY) {
				this.positionY = groundY;
			}
		}
		if (this._state !== 'flying') {
			this.positionY = groundY;
		}
		if (this._state === 'landing' && this._stateSeconds >= GoatJump.LANDING_SECONDS) {
			this._changeState('standing');
		}

		const targetPose = this._targetPose();
		const ratio = Math.min(1, deltaSeconds * GoatJump.POSE_SPEED);
		this.pose = GoatJump._mixPoses(this.pose, targetPose, ratio);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Goes to another step of the jump.
	 * @param goatJumpState the new step of the jump.
	 */
	private _changeState(goatJumpState: GoatJumpState): void {
		this._state = goatJumpState;
		this._stateSeconds = 0;
	}

	/**
	 * Gives the pose that the goat goes to in the current step of the jump. In the air, the pose goes from the
	 * takeoff pose to the top pose while the goat goes up, and from the top pose to the landing pose while the
	 * goat comes down.
	 * @returns the pose that the goat goes to.
	 */
	private _targetPose(): GoatPose {
		if (this._state === 'crouching') {
			return GoatJump.CROUCHING_POSE;
		}
		if (this._state === 'landing') {
			if (this._stateSeconds < GoatJump.LANDING_CROUCH_SECONDS) {
				return GoatJump.CROUCHING_POSE;
			}
			return GoatJump.STANDING_POSE;
		}
		if (this._state === 'flying') {
			// The progress goes from 0 when the goat leaves the ground, to 1 at the top, to 2 when the goat
			// lands.
			const progress = 1 - this._verticalSpeed / GoatJump.JUMP_SPEED;
			if (progress < 1) {
				const risingRatio = Math.max(0, progress);
				return GoatJump._mixPoses(GoatJump.TAKEOFF_POSE, GoatJump.TOP_POSE, risingRatio);
			}
			const fallingRatio = Math.min(1, progress - 1);
			return GoatJump._mixPoses(GoatJump.TOP_POSE, GoatJump.LANDING_POSE, fallingRatio);
		}
		return GoatJump.STANDING_POSE;
	}

	/**
	 * Mixes two poses.
	 * @param startPose the pose at a ratio of 0.
	 * @param endPose the pose at a ratio of 1.
	 * @param ratio the ratio of the mix, from 0 to 1.
	 * @returns the mixed pose.
	 */
	private static _mixPoses(startPose: GoatPose, endPose: GoatPose, ratio: number): GoatPose {
		return {
			crouch: startPose.crouch + (endPose.crouch - startPose.crouch) * ratio,
			pitch: startPose.pitch + (endPose.pitch - startPose.pitch) * ratio,
			frontHip: startPose.frontHip + (endPose.frontHip - startPose.frontHip) * ratio,
			frontKnee: startPose.frontKnee + (endPose.frontKnee - startPose.frontKnee) * ratio,
			backHip: startPose.backHip + (endPose.backHip - startPose.backHip) * ratio,
			backKnee: startPose.backKnee + (endPose.backKnee - startPose.backKnee) * ratio,
		};
	}
}
