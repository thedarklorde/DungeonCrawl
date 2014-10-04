

var iHealth : int = 60;

class BlobMovementSettings {

	var maxMoveSpeed = 48.0;
	
	var gravityStrength = -16.0;
	}

class BlobMovementData {
	var currentTrajectory : Vector3;		// Current trajectory
	var verticalSpeed;
	var horizontalSpeed;
	
	var targetDestination  : Vector3;		// Used to pass collision-initiated movement to FixedUpdate()
	
	var isGrounded : boolean;				// isGrounded is only set after we've settled down; isBlockedDown is immediate.
	
	var isBlockedLeft : boolean;
	var isBlockedRight : boolean;
	var isBlockedUp : boolean;
	var isBlockedDown : boolean;
	
	var useTargetPosition : boolean;		// Tells us when we should adjust the player's position based on a collision
	var wasHitThisFrame : boolean;
	}

var moveSettings : BlobMovementSettings;
var moveData : BlobMovementData;

function ApplyGravity() {
	// Debug.Log("Blob:ApplyGravity()");
	
	if (moveData.isGrounded) {
		// Debug.Log("Blob:v=0.0");
		moveData.verticalSpeed = 0.0;
		}
	else {
		// Debug.Log("Blob:v=" + moveSettings.gravityStrength);
		moveData.verticalSpeed = moveSettings.gravityStrength;
		}
	}
	
function AnimatePlayer() {
	if (moveData.currentTrajectory.x > 0.0) {
		// Set player facing right
		renderer.material.mainTextureOffset.x = 0.515;
		}
	else if (moveData.currentTrajectory.x < 0.0) {
		renderer.material.mainTextureOffset.x = 0.015;
		// Set player facing left
		}
	}

function Awake() {
	// Debug.Log("Blob:Awake()");
	
	moveData.currentTrajectory = Vector3.zero;
	moveData.verticalSpeed = 0.0;
	moveData.horizontalSpeed = 0.0;
	moveData.targetDestination = rigidbody.position;
	moveData.useTargetPosition = false;
	}


function Update() {
	// Debug.Log("Blob:Update()");
	// moveData.targetDestination = rigidbody.position;
	
	// Debug.Log("Blob:position.y=" + transform.position.y + ",targetDestination.y=" + moveData.targetDestination.y + ",currentTrajectory.y=" + moveData.currentTrajectory.y);
	// Debug.Log("Blob:position.x=" + transform.position.x + ",targetDestination.x=" + moveData.targetDestination.x + ",currentTrajectory.x=" + moveData.currentTrajectory.x);
	}
	
function FixedUpdate() {
	// Debug.Log("Blob:FixedUpdate()");
	
	moveData.horizontalSpeed = 0.0;
	
	// We do the same thing for the vertical speed.
	ApplyGravity();
	
	if (moveData.isBlockedLeft && moveData.horizontalSpeed < 0.0)
		moveData.horizontalSpeed = 0.0;
	if (moveData.isBlockedRight && moveData.horizontalSpeed > 0.0)
		moveData.horizontalSpeed = 0.0;
		
	if (moveData.wasHitThisFrame) {
		moveData.verticalSpeed += 100;
		moveData.wasHitThisFrame = false;
		}

	// Now we assemble the data we've collected into a Vector3.  This will effectively be an
	// expression of the "push/pull" in a given direction.  We then add that to our character's
	// current movement.
	
	moveData.currentTrajectory = Vector3(moveData.horizontalSpeed,moveData.verticalSpeed,0);
	
	// First, we multiply by deltaTime.  This keeps everything framerate-independant.
	//
	// We *could* do this higher in the code, but as this acts as a scaling factor for all
	// distance variables over time, it's more efficient and less dangerous to do it all at
	// once, at the very end.
	moveData.currentTrajectory *= Time.deltaTime;

	// Debug.Log("Blob:position.y=" + rigidbody.position.y + ",targetDestination.y=" + moveData.targetDestination.y + ",currentTrajectory.y=" + moveData.currentTrajectory.y);
	
	// Let's get this fucker moving.
	
	// Debug.Log("Blob:rigidbody.position=" + rigidbody.position + ", moveData.targetDestination=" + moveData.targetDestination);
	// if (rigidbody.position != moveData.targetDestination) {
	if (moveData.useTargetPosition) {
//		Debug.Log("Blob:using targetDestination " + moveData.targetDestination + " + currentTrajectory " + moveData.currentTrajectory);
		rigidbody.MovePosition(moveData.targetDestination + moveData.currentTrajectory);
		moveData.useTargetPosition = false;
		}
	else {
		// Debug.Log("Blob:using position + " + moveData.currentTrajectory);
		rigidbody.MovePosition(rigidbody.position + moveData.currentTrajectory);
		}
		
	AnimatePlayer();

	// Close up the frame: prep for the next one.
//	tElapsed += Time.deltaTime;
//	if (tElapsed >= 2.0) {
//		Debug.Log("Blob:up:" + moveData.isBlockedUp +",down:" + moveData.isBlockedDown + ",left:" + moveData.isBlockedLeft + ",right:" + moveData.isBlockedRight);
//		tElapsed = 0.0;
//		}
	if (moveData.isBlockedDown == false) {
		moveData.isGrounded = false;
		// Debug.Log("Blob:isGrounded=false");
		}
	moveData.isBlockedUp = false;
	moveData.isBlockedDown = false;
	moveData.isBlockedLeft = false;
	moveData.isBlockedRight = false;
	
	// At this point, we want to set the targetDestination for the next frame to be equal to
	// rigidbody.position. This is so that if these two values get out of sync during the next
	// frame, we'll know we hit something, and can return to this value.
	//
	// However! rigidbody.position has not actually been updated yet! Even though we made the
	// call to rigidbody.MovePosition() above, the physics system has not done its position 
	// calculations.
	//
	// So, we delay this reassignment to the Update() call, which always comes after FixedUpdate().
	
	// moveData.targetDestination = rigidbody.position;
	}
	
function OnCollisionEnter(collision : Collision) {
	// Debug.Log("Blob:OnCollisionEnter()");
	
	// This is the tricky bit.
	//
	// We've encountered a collision. Now we need to figure out where it happened,
	// and move the player to exactly align with the collider we hit.  We're sure to
	// be overlapping in some way.
	//
	// So, what we do here is construct a "target" destination - it's where we figure
	// the player *should* be after this collision. That target is then used in
	// FixedUpdate() to relocate the player.
			
	moveData.targetDestination = rigidbody.position;		// First, set up our target with baseline values.

	for (var i = 0; i <= collision.contacts.Length-1; i += 4) {
	
		if (collision.contacts[0].normal.y >= 0.9) {		// y = 1.0, block is below us
			moveData.targetDestination.y = collision.collider.bounds.max.y + GetComponent(Collider).extents.y - 0.01;
			moveData.isGrounded = true;
			moveData.isBlockedDown = true;
			moveData.useTargetPosition = true;
//			Debug.Log("Blob:OnCollisionEnter() down : collision y=" + collision.collider.bounds.max.y + ", c y=" + GetComponent(Collider).extents.y + ", target y=" + moveData.targetDestination.y + ", isGrounded=true");
			}
		if (collision.contacts[0].normal.y <= -0.9) {		// y = -1.0, block is above us
			;
			}
		if (collision.contacts[0].normal.x >= 0.9) {		// x = 1.0, block is left of us
			moveData.targetDestination.x = collision.collider.bounds.max.x + GetComponent(Collider).extents.x - 0.01;
			moveData.isBlockedLeft = true;
			moveData.useTargetPosition = true;
//			Debug.Log("Blob:OnCollisionEnter() left : collision x=" + collision.collider.bounds.max.x + ", c x=" + GetComponent(Collider).extents.x + ", target x=" + moveData.targetDestination.x);
			}
		if (collision.contacts[0].normal.x <= -0.9) {		// x = -1.0, block is right of us
			;
			}
		}
	
	}

static var tElapsed = 0.0;

function OnCollisionStay(collision : Collision) {
	// Debug.Log("Blob:OnCollisionStay()");
		
	for (var i = 0; i <= collision.contacts.Length-1; i += 4) {
	
		if (collision.contacts[0].normal.y >= 0.9)		// y = 1.0, block is below us
			moveData.isBlockedDown = true;
			
		if (collision.contacts[0].normal.y <= -0.9)		// y = -1.0, block is above us
			moveData.isBlockedUp = true;

		if (collision.contacts[0].normal.x >= 0.9)		// x = 1.0, block is left of us
			moveData.isBlockedLeft = true;
			
		if (collision.contacts[0].normal.x <= -0.9)		// x = -1.0, block is right of us
			moveData.isBlockedRight = true;
		}
		
	
	}

function WeaponHit(damage : int) {
	Debug.Log("DCBlobController:WeaponHit: Ow! " + damage + " points of damage!");
	moveData.wasHitThisFrame = true;
	}