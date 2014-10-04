
var gWeaponManager : GameObject;		// Wire up to our DungeoncrawlWeaponManager
var gPlayerOutline : Transform;			// Wire up to our attached outline sprite

static var PLAYER_SPRITE_X_TILING_FACING_RIGHT = 0.25;
static var PLAYER_SPRITE_X_TILING_FACING_LEFT = -0.25;

private var tElapsed = 0.0;				// Just a time-tracker for debug reporting

// We collect our various dials, knobs, and status indicators into a set of classes:
//
//   DCPlayerMovementSettings: Externalized settings for gravity, speed, etc that we want to tweak in the editor
//   DCPlayerGameData: Status as related to play (inventory, health, etc)
//   DCPlayerMovementData: Frame-by-frame status for controlling player movement. Nuts-and-bolts.
//   DCPlayerAnimationData: Frame-by-frame status for displaying the player's sprite. More nuts-and-bolts.

class DCPlayerMovementSettings {
	var fMaxMoveSpeed = 64.0;			// Base horizontal movement multiplier
	var fMaxJumpSpeed = 256.0;			// Base jump movement multiplier
	var fGravityStrength = -16.0;		// The gravitational pull. Not sure if I like it being negative.
	}

class DCPlayerGameData {
	var hasWeaponReady : boolean;
	var hasLongsword : boolean;
	
	var currentWeapon : GameObject;
	}
	
class DCPlayerMovementData {
	// Each frame, we build up a picture of the player's movement behavior. fVerticalSpeed and fHorizontalSpeed
	// are eventually combined to calculate the vCurrentTrajectory. vCurrentTrajectory.z is ignored, but we use
	// a Vector3 to keep the types compatible.
	var fVerticalSpeed : float;
	var fHorizontalSpeed : float;
	var vCurrentTrajectory : Vector3;
	
	var vTargetPosition  : Vector3;		// Used to pass collision-initiated movement to FixedUpdate()
	
	var isGrounded : boolean;			// isGrounded is only set after we've settled down; isBlockedDown is immediate.
	
	var isBlockedLeft : boolean;		// Is the character blocked by an obstacle in the given dirction?
	var isBlockedRight : boolean;
	var isBlockedUp : boolean;
	var isBlockedDown : boolean;
	
	var useTargetPosition : boolean;	// Tells us when we should adjust the player's position based on a collision
	
	var isAttacking : boolean;			// Is the character attacking *this frame*?
	var fAttackTimer : float;			// Countdown timer for attack timing
	}

class DCPlayerAnimData {
	var isIdling : boolean;
	var isRunning : boolean;
	var isFacingLeft : boolean;
	var isFacingRight : boolean;
	
	var fIdleUVy : float;
	var vIdleNoWeaponLeftUV : Vector2;
	var vIdleNoWeaponRightUV : Vector2;
	var vIdleWeaponLeftUV : Vector2;
	var vIdleWeaponRightUV : Vector2;

	var runFrame : int;
	var runFrameRate : float;
	var fRunUVy : float;
	var vaRunCycleUVs : Vector2[];
	
	var vaHandOffsetsRight : Vector3[];
	var vaHandOffsetsLeft : Vector3[];

	var vAttackRightUV : Vector2;
	var vAttackLeftUV : Vector2;
	}

var moveSettings : DCPlayerMovementSettings;
var playerMoveData : DCPlayerMovementData;
var playerAnimData : DCPlayerAnimData;
var playerGameData : DCPlayerGameData;

// Start() -- Setup the player character with all his/her initial values.

function Start() {
	// Debug.Log("Start()");
	
	gPlayerOutline = transform.FindChild("dcPlayerOutline");
	
	playerMoveData = new DCPlayerMovementData();
	
	playerMoveData.vCurrentTrajectory = Vector3.zero;
	playerMoveData.fVerticalSpeed = 0.0;
	playerMoveData.fHorizontalSpeed = 0.0;
	playerMoveData.vTargetPosition = rigidbody.position;
	playerMoveData.useTargetPosition = false;
	playerMoveData.isAttacking = false;
	playerMoveData.fAttackTimer = 0.0;
	
	playerAnimData = new DCPlayerAnimData();
	
	playerAnimData.runFrame = 1;
	playerAnimData.runFrameRate = 0.0;
	
	// Set up our UVs for our run animation. This will be automated at some point, but for now
	// we're doing it by hand, baby.
	playerAnimData.fIdleUVy = 0.75;
	playerAnimData.fRunUVy = 0.5;
	
	playerAnimData.vIdleNoWeaponRightUV = Vector2( 0.5,playerAnimData.fIdleUVy );
	playerAnimData.vIdleNoWeaponLeftUV = Vector2( -0.25,playerAnimData.fIdleUVy );
	
	playerAnimData.vIdleWeaponRightUV = Vector2( 0.25,playerAnimData.fRunUVy );
	playerAnimData.vIdleWeaponLeftUV = Vector2( 0.25,playerAnimData.fRunUVy );
	
	playerAnimData.vaRunCycleUVs = new Vector2[4];
	playerAnimData.vaRunCycleUVs[0] = Vector2( 0.0,playerAnimData.fRunUVy );
	playerAnimData.vaRunCycleUVs[1] = Vector2( 0.25,playerAnimData.fRunUVy );
	playerAnimData.vaRunCycleUVs[2] = Vector2( 0.5,playerAnimData.fRunUVy );
	playerAnimData.vaRunCycleUVs[3] = Vector2( 0.75,playerAnimData.fRunUVy );
	
	// Start out standing still, facing right.
	playerAnimData.isIdling = true;
	playerAnimData.isRunning = false;
	playerAnimData.isFacingRight = true;
	playerAnimData.isFacingLeft = false;
	
	// Set up the hand position offsets for each run frame. These are for placing the weapon
	// sprites correctly.
	playerAnimData.vaHandOffsetsRight = new Vector3[4];
	playerAnimData.vaHandOffsetsRight[0] = Vector3( 1,-2,0 );
	playerAnimData.vaHandOffsetsRight[1] = Vector3( 1,-2,0 );
	playerAnimData.vaHandOffsetsRight[2] = Vector3( 1,-2,0 );
	playerAnimData.vaHandOffsetsRight[3] = Vector3( 1,-2,0 );
	playerAnimData.vaHandOffsetsLeft = new Vector3[4];
	playerAnimData.vaHandOffsetsLeft[0] = Vector3( -3,-2,0 );
	playerAnimData.vaHandOffsetsLeft[1] = Vector3( -3,-2,0 );
	playerAnimData.vaHandOffsetsLeft[2] = Vector3( -3,-2,0 );
	playerAnimData.vaHandOffsetsLeft[3] = Vector3( -3,-2,0 );
	
	playerAnimData.vAttackRightUV = Vector2( 0.0, 0.0 );
	playerAnimData.vAttackLeftUV = Vector2( -0.75, 0.0 );
	
	playerGameData = new DCPlayerGameData();
	
	playerGameData.hasWeaponReady = true;
	
	}

// GetHorizontalInput() -- Retrieve the raw left & right input data from the player and convert it 
//                         into an appropriate baseline movement speed.
//
// This function does not deal with collisions or other consequences of movement yet - it's purely 
// base input calculation.

function GetHorizontalInput() {
	//Debug.Log("GetHorizontalInput()");
	
	var h : float = Input.GetAxisRaw("Horizontal");   // As we're using "Raw", this will be either 1.0, 0, or -1.0
	if (h) {
		// [Smoothing for the player input will eventually be done here; for now, just stash the value.]
		
		return h * moveSettings.fMaxMoveSpeed;
		}
	else
		return 0.0;
	}

// GetVerticalInput() -- Retrieve the raw up & down input data from the player and convert it 
//                         into an appropriate baseline movement speed.
//
// This function will also apply the gravity as necessary by calling the ApplyGravity() method

function GetVerticalInput() {
	//Debug.Log("GetVerticalInput()");
	var v : float = Input.GetAxisRaw("Vertical");
	// if the player has pressed up, and is currently on the ground
	// future note: if we ever want double jump, rather than checking isGrounded,
	// the player might have some number of 'jumps' that we count instead
	if (v == 1 && playerMoveData.isGrounded)
	{
		Debug.Log("Vert " + v * moveSettings.fMaxJumpSpeed + " " + moveSettings.fMaxJumpSpeed);
		return v * moveSettings.fMaxJumpSpeed;// + ApplyGravity();
	}
	else{
		return ApplyGravity();
	}
}
	
// ApplyGravity() -- Does what it says. Applies the effect of gravity on the input, and returns a modified
//                   result.
//
// Currently is exceptionally simple - does not have accelleration at the moment.

function ApplyGravity() {
//	Debug.Log("ApplyGravity()");
	
	if (playerMoveData.isGrounded) {
//		Debug.Log("v=0.0");
		return 0.0;
		}
	else {
//		Debug.Log("v=" + moveSettings.fGravityStrength);
		return moveSettings.fGravityStrength;
		}
	}
	
function AnimatePlayer() {
	// Debug.Log("AnimatePlayer()");
	
	if (playerMoveData.isAttacking) {
	
		// If the player is holding down the attack button (or has recently done so),
		// playerMoveData.isAttacking will be set, and we want the character to show his
		// attack pose regardless of what else he is doing.
		if (playerAnimData.isFacingRight) {
			renderer.material.mainTextureOffset = playerAnimData.vAttackRightUV;
			gPlayerOutline.renderer.material.mainTextureOffset = playerAnimData.vAttackRightUV;
			}
		else if (playerAnimData.isFacingLeft) {
			renderer.material.mainTextureOffset = playerAnimData.vAttackLeftUV;
			gPlayerOutline.renderer.material.mainTextureOffset = playerAnimData.vAttackLeftUV;
			}
		else
			Debug.Log("facing error in AnimatePlayer()");
		}
	else {
		// He's not attacking - so he's either running or idling.
		if (playerAnimData.isRunning) {
			
			// He's running. Check to see if it's time to update the run frame.
			playerAnimData.runFrameRate += Time.deltaTime;
			if (playerAnimData.runFrameRate <= 0.1) {
				return;
				}
			playerAnimData.runFrameRate= 0.0;
//			Debug.Log("AnimatePlayer() run");
	
			// Time for a new frame of run animation! Go get it!
			renderer.material.mainTextureOffset.x = playerAnimData.vaRunCycleUVs[playerAnimData.runFrame-1].x;
			renderer.material.mainTextureOffset.y = playerAnimData.vaRunCycleUVs[playerAnimData.runFrame-1].y;
			gPlayerOutline.renderer.material.mainTextureOffset.x = playerAnimData.vaRunCycleUVs[playerAnimData.runFrame-1].x;
			gPlayerOutline.renderer.material.mainTextureOffset.y = playerAnimData.vaRunCycleUVs[playerAnimData.runFrame-1].y;
			playerAnimData.runFrame++;
			if (playerAnimData.runFrame >= 5)
				playerAnimData.runFrame = 1;			// Loop the animation
			}
		else {
//			Debug.Log("AnimatePlayer() idle");
			
			// He's idling.
			//
			// This is often the result of the player "completing" an action - it's the "return to
			// default" case. Set the idle for the appropriate direction.
			if (playerAnimData.isFacingRight) {
				// Set player facing right
				if (playerGameData.hasWeaponReady) {
					renderer.material.mainTextureOffset = playerAnimData.vIdleWeaponRightUV;
					gPlayerOutline.renderer.material.mainTextureOffset= playerAnimData.vIdleWeaponRightUV;
					}
				else {
					renderer.material.mainTextureOffset = playerAnimData.vIdleNoWeaponRightUV;
					gPlayerOutline.renderer.material.mainTextureOffset= playerAnimData.vIdleNoWeaponRightUV;
					}
				}
			else if (playerAnimData.isFacingLeft) {
				// Set player facing left
				if (playerGameData.hasWeaponReady) {
					renderer.material.mainTextureOffset = playerAnimData.vIdleWeaponLeftUV;
					gPlayerOutline.renderer.material.mainTextureOffset = playerAnimData.vIdleWeaponLeftUV;
					}
				else {
					renderer.material.mainTextureOffset = playerAnimData.vIdleNoWeaponLeftUV;
					gPlayerOutline.renderer.material.mainTextureOffset = playerAnimData.vIdleNoWeaponLeftUV;
					}
				}
			}
		}
	}


// FixedUpdate() -- Update the physical positioning of the player object
//
// We split our tasks into two functions: Update() and FixedUpdate(). The use of FixedUpdate() is obligatory,
// as the player uses a Rigidbody for his collision detection. FixedUpdate() effectively files a request to
// move the player, and then between FixedUpdate() and Update(), Unity does the relocation and works out any
// other physics necessities (in our case, almost zero). So FixedUpdate() is effectively our "pre-update" and
// Update() is for post-actual movement changes.
// 
// FixedUpdate() handles:
//   - Collision detection and re-positioning based on hitting objects
//
// Update() handles:
//   - Animation of the character
//   - Placement of weapons

function FixedUpdate() {
	// Debug.Log("FixedUpdate()");
	
	// First, handle attacks.
	if (Input.GetButton("Fire1")) {
		// Debug.Log("Attack!");
		playerMoveData.isAttacking = true;
		playerMoveData.fAttackTimer = 0.1;
		
		// Tell the weapon to attack
		gWeaponManager.GetComponent("DungeoncrawlWeaponManager").SetIsAttacking(true);
		}
	
	if (playerMoveData.isAttacking) {
		playerMoveData.fAttackTimer -= Time.deltaTime;
		if (playerMoveData.fAttackTimer <= 0.0) {
			playerMoveData.isAttacking = false;
			playerMoveData.fAttackTimer = 0.0;
			
			// Tell the weapon we're done attacking
			gWeaponManager.GetComponent("DungeoncrawlWeaponManager").SetIsAttacking(false);
			}
		}
	
	// This section takes the player's horizontal input (which pretty much amounts to pushing
	// the right or left movement button), any vertical factors (falling or jumping), and
	// calculates a base movement speed from that. The idea here is that the value at the end
	// will be the actual displacement of the charater.
	//
	// It's worth taking a moment and describing how we're doing this - as we are rendering
	// a 2D pixel game in a full 3D engine.
	//
	// Important topic #1: Resolution of coordinate space
	//
	// Unit3D uses full floating point values for its coordinate geometry - thus, our character
	// can (and will) end up being located "in between" pixels while moving. There are several
	// approaches to handle this problem: our solution is based on a Unity3D feature that is
	// quite handy. Namely, it appears that as long as a sprite is being rendered at a scale 
	// that is "pixel-perfect" on screen (1:1 pixel ratio, or 1:2, 1:3, etc), Unity seems to
	// handle the alignment of the object in the way we would expect (drawing the sprite as aligned
	// with the screen pixels, instead of attempting to alias them into a more accurate approximation).
	// 
	// Note that this is only true as long as the Filter Mode for the textures being drawn is
	// set to Point. This is what we want anyway: crisp, clean textures, not blurry, aliased ones.
	//
	// (In contrast, if we set a texture's Filter Mode to "Bilinear", we see what we would
	// normally expect here without under-the-hood magic: micro movements of the character offset
	// the sprite from the pixel grid, and the sprite artifacts. But with Point filtering,
	// we seem to have what we want: the sprite moves 1 full screen pixel at a time, while the
	// underlying object itself is moving at full resolution behind it.)
	//
	// Basically, that's a big comment for "we don't need to do anything here to keep the
	// sprite aligned, because Unity3D is cool."
	
// *** BEGIN INPUT COLLECTION ***
	// Horizontal input currently comes exclusively from the buttons.
	playerMoveData.fHorizontalSpeed = GetHorizontalInput();
	
	// Vertical input currently comes exlusively from gravity.
	playerMoveData.fVerticalSpeed = GetVerticalInput(); //ApplyGravity();
	
	// Check to see if the player is blocked in the direction they are trying to go. If so, we just
	// zero out their speed.
	if ((playerMoveData.isBlockedLeft && playerMoveData.fHorizontalSpeed < 0.0) ||
		(playerMoveData.isBlockedRight && playerMoveData.fHorizontalSpeed > 0.0))
		playerMoveData.fHorizontalSpeed = 0.0;

	// Now we assemble the data we've collected into a Vector3.  This will effectively be an
	// expression of the "desired push" from the input factors.
	playerMoveData.vCurrentTrajectory = Vector3(playerMoveData.fHorizontalSpeed,playerMoveData.fVerticalSpeed,0);
	
// *** END INPUT COLLECTION ***
// *** BEGIN ACTUAL MOVEMENT ***

	// We first multiply our vector by deltaTime.  This keeps everything framerate-independant.
	//
	// We *could* do this higher in the code, but as this acts as a scaling factor for all
	// distance variables over time, it's more efficient and less dangerous to do it all at
	// once, at the very end.
	playerMoveData.vCurrentTrajectory *= Time.deltaTime;
	
	// Let's get this fucker moving.
	//
	// The way this works is a tad tricky, because of the complicating factor of collisions with obstacles.
	// See the comment head for OnCollisionStart() for full details, but the basic idea here is that we want
	// to either:
	//
	//    1) Request to add the vCurrentTrajectory to our current position, --OR--
	//    2) Ignore all the input data (because we hit something while moving last frame), and
	//       request to relocate the "precalculated" vTargetPosition that has been provided for us.

//	Debug.Log("position(x,y)=(" + rigidbody.position.x + "," + rigidbody.position.y +
//			  "),vTargetPosition(x,y)=(" + playerMoveData.vTargetPosition.x + "," + playerMoveData.vTargetPosition.y +
//			  "),vCurrentTrajectory(x,y)=(" + playerMoveData.vCurrentTrajectory.x + "," + playerMoveData.vCurrentTrajectory.y + ")");
	if (playerMoveData.useTargetPosition) {
//		Debug.Log("using vTargetPosition...");
		rigidbody.MovePosition(playerMoveData.vTargetPosition + playerMoveData.vCurrentTrajectory);
		playerMoveData.useTargetPosition = false;
		}
	else {
//		Debug.Log("using position + vCurrentTrajectory...");
		rigidbody.MovePosition(rigidbody.position + playerMoveData.vCurrentTrajectory);
		}

// *** END ACTUAL MOVEMENT ***
// *** BEGIN NEXT FRAME SETUP ***

	// We "solidify" the notion of being "blocked down" into being "grounded" for this frame before
	// we blow away the isBlockedDown status.
	if (playerMoveData.isBlockedDown == false)
		playerMoveData.isGrounded = false;

	// This small section is a little counter that periodically reports out the blocked status of the player.
	// It has no other purpose.
	
//	tElapsed += Time.deltaTime;
//	if (tElapsed >= 2.0) {
//		tElapsed = 0.0;
//		Debug.Log("Blocked status: isGrounded:(" + playerMoveData.isGrounded +
//				  "), up:(" + playerMoveData.isBlockedUp + "), down:(" + playerMoveData.isBlockedDown +
//				  "), left:(" + playerMoveData.isBlockedLeft + "), right:" + playerMoveData.isBlockedRight);
//		}

	// Now that we've completed all our calculations based on the playerMoveData structure, we
	// can reset the values we need for logical event detection later.
	playerMoveData.isBlockedUp = false;
	playerMoveData.isBlockedDown = false;
	playerMoveData.isBlockedLeft = false;
	playerMoveData.isBlockedRight = false;

// *** END NEXT FRAME SETUP ***
	}

// Update() -- Handle the visual side of the character update.
//
// (See above in FixedUpdate() for more information on how the relationship between Update() and
// FixedUpdate() works.)

function Update() {
//	Debug.Log("Update()");
//	Debug.Log("position(x,y)=(" + transform.position.x + "," + transform.position.y + 
//			  "),vTargetPosition(x,y)=(" + playerMoveData.vTargetPosition.x + "," + playerMoveData.vTargetPosition.y +
//			  "),vCurrentTrajectory(x.y)=(" + playerMoveData.vCurrentTrajectory.x + "," + playerMoveData.vCurrentTrajectory.y + ")");

	// Establish the character's current visual state.
	//
	// Running or idle?
	if (Mathf.Abs(playerMoveData.fHorizontalSpeed) > 0.0)
		playerAnimData.isRunning = true;
	else
		playerAnimData.isRunning = false;
		
	// Detect the character's facing, and flip the tiling on the character sprite if he's changed
	// his facing.
	//
	// Note that if he is idling, then we want him facing the last direction he was moving. So, we
	// first just check his running state.
	if (playerAnimData.isRunning)
		if (playerMoveData.fHorizontalSpeed > 0) {
			// He's facing right.
			if (renderer.material.mainTextureScale.x != PLAYER_SPRITE_X_TILING_FACING_RIGHT) {
				renderer.material.mainTextureScale.x = PLAYER_SPRITE_X_TILING_FACING_RIGHT;
				gPlayerOutline.renderer.material.mainTextureScale.x = PLAYER_SPRITE_X_TILING_FACING_RIGHT;
				}
			playerAnimData.isFacingRight = true;
			playerAnimData.isFacingLeft = false;
			}
		else {
			// He's facing left.
			if (renderer.material.mainTextureScale.x != PLAYER_SPRITE_X_TILING_FACING_LEFT) {
				renderer.material.mainTextureScale.x = PLAYER_SPRITE_X_TILING_FACING_LEFT;
				gPlayerOutline.renderer.material.mainTextureScale.x = PLAYER_SPRITE_X_TILING_FACING_LEFT;
				}
			playerAnimData.isFacingRight = false;
			playerAnimData.isFacingLeft = true;
			}
	
	// Update the player's sprite to the correct frame of animation
	AnimatePlayer();
	
	// Update the DungeoncrawlWeaponManager with the current position of the character's hand.

	var p : Vector3 = transform.position;	// Start with the character's current position
	if (playerAnimData.isFacingLeft) {
		p += playerAnimData.vaHandOffsetsLeft[1];
		}
	else {
		p += playerAnimData.vaHandOffsetsRight[1];
		}
//	gWeaponManager.GetComponent(DungeoncrawlWeaponManager).HoldPrimaryWeapon(p);

	gWeaponManager.GetComponent(DungeoncrawlWeaponManager).SetCurrentHandPosition(p);
	}
	


// *** COLLISION DETECTION ***

// OnCollisionEnter() -- Determine how to respond to a collision between the player and something
//                       in the world.
//
// The central issue that this function needs to resolve is this: by the time the game engine has
// reported a collision, the player's BoxCollider is already intersecting the object. In most cases
// this will be a wall, and we need to "reset" the character's position to be just outside the object.
//
// This is tricky, and sort of a pain in the butt. It makes me think that there might be a way of doing
// this that I'm overlooking that would be much easier. However, this seems to work:
//
// We've hit an object, so we know our current position is forfeit. What we do here is construct a
// new "target" position - where we figure the player *should* be after this collision. That target
// is then used in FixedUpdate() to relocate the player.

// NOTE: There's a very slight 1-frame stutter when the player hits something at this point. I think
// the correct solution to this problem is to invert this detection style:
//
//    - Increase the size of the player's collision volume by an amount that anticipates collisions
//      at his normal movement speed.
//    - Instead of pushing the player *back* into a square, pull him *forward* into a square when he
//      hits. This may smooth out some of the hit.
//
//  But, it's not that big of a deal at the moment.
//
// NOTE 2: We are setting our "target" location so that the character collision volume *exactly* aligns
// with the block we've hit. This state seems to generate the necessary result, which is this: for every
// frame thereafter, we'll receive an OnCollisionStay() message from the object we struck, reminding us
// that we're still in contact. That's the necessary part here: line up the character with the world
// in such a way that we keep getting notifications.

function OnCollisionEnter(collision : Collision) {
//	Debug.Log("OnCollisionEnter()");
	
	// First, we set up vTargetPosition with baseline values. One or more of these values will prove
	// to be inaccurate, but the others will be fine (and Z is sure to be accurate).
	playerMoveData.vTargetPosition = rigidbody.position;
		
	// We iterate over all collisions - it's entirely possible to have hit more than one
	// block during the same frame.
	for (var i = 0; i <= collision.contacts.Length-1; i += 4) {

		// Check for hit at our feet
		if (collision.contacts[0].normal.y >= 0.9) {		// y = 1.0, block is below us
			// Calculate the correct y position for the character by taking the topmost face of the
			// block we hit, and adding half the height of our character to it.
			playerMoveData.vTargetPosition.y = collision.collider.bounds.max.y + GetComponent(Collider).extents.y;
			playerMoveData.isBlockedDown = true;
			playerMoveData.useTargetPosition = true;		// Warn FixedUpdate() to use vTargetPosition
//			Debug.Log("OnCollisionEnter() hit down: collision face y=(" + collision.collider.bounds.max.y +
//					  "), char height=(" + GetComponent(Collider).extents.y +
//					  "), new target y=(" + playerMoveData.vTargetPosition.y + ")");
			
			// Having hit something below us, we are now "grounded". Here, we set the isGrounded flag,
			// and it will remain set until we detect that there is nothing under our feet.
			//
			// This is the only place where isGrounded is set.
			playerMoveData.isGrounded = true;
			}
		// Check for hit at our head
		if (collision.contacts[0].normal.y <= -0.9) {		// y = -1.0, block is above us
			// Calculate the correct y position for the character by taking the bottommost face of the
			// block we hit, and subtracting half the height of our character to it.
			playerMoveData.vTargetPosition.y = collision.collider.bounds.min.y - GetComponent(Collider).extents.y;
			playerMoveData.isBlockedUp = true;
			playerMoveData.useTargetPosition = true;		// Warn FixedUpdate() to use vTargetPosition
//			Debug.Log("OnCollisionEnter() hit down: collision face y=(" + collision.collider.bounds.max.y +
//					  "), char height=(" + GetComponent(Collider).extents.y +
//					  "), new target y=(" + playerMoveData.vTargetPosition.y + ")");
			}
		// Check for hit to our left
		if (collision.contacts[0].normal.x >= 0.9) {		// x = 1.0, block is left of us
			// Calculate the correct x position for the character by taking the rightmost face of the
			// block we hit, and adding half the width of our character to it.
			playerMoveData.vTargetPosition.x = collision.collider.bounds.max.x + GetComponent(Collider).extents.x;
			playerMoveData.isBlockedLeft = true;
			playerMoveData.useTargetPosition = true;		// Warn FixedUpdate() to use vTargetPosition
//			Debug.Log("OnCollisionEnter() hit@left: collision face x=(" + collision.collider.bounds.max.x +
//					  "), char width=(" + GetComponent(Collider).extents.x +
//					  "), new target x=(" + playerMoveData.vTargetPosition.x + ")");
			}
		// Check for hit to our right
		if (collision.contacts[0].normal.x <= -0.9) {		// x = -1.0, block is right of us
			// Calculate the correct x position for the character by taking the leftmost face of the
			// block we hit, and subratcting half the width of our character to it.
			playerMoveData.vTargetPosition.x = collision.collider.bounds.min.x - GetComponent(Collider).extents.x;
			playerMoveData.isBlockedRight = true;
			playerMoveData.useTargetPosition = true;		// Warn FixedUpdate() to use vTargetPosition
//			Debug.Log("OnCollisionEnter() hit@right: collision face x=(" + collision.collider.bounds.min.x +
//					  "), char width=(" + GetComponent(Collider).extents.x +
//					  "), new target x=(" + playerMoveData.vTargetPosition.x + ")");
			}
		}
	
	}


// OnCollisionStay() -- Keep FixedUpdate() informed on where we are touching world geometry this frame.

function OnCollisionStay(collision : Collision) {
//	Debug.Log("OnCollisionStay()");

	// For now, we just iterate over everything we are colliding, and set the blocked flag for
	// the direction of the collision.
	//
	// This will need to be updated as our world gets more complicated.		
	for (var i = 0; i <= collision.contacts.Length-1; i += 4) {
	
		if (collision.contacts[0].normal.y >= 0.9)		// y = 1.0, block is below us
			playerMoveData.isBlockedDown = true;
			
		if (collision.contacts[0].normal.y <= -0.9)		// y = -1.0, block is above us
			playerMoveData.isBlockedUp = true;

		if (collision.contacts[0].normal.x >= 0.9)		// x = 1.0, block is left of us
			playerMoveData.isBlockedLeft = true;
			
		if (collision.contacts[0].normal.x <= -0.9)		// x = -1.0, block is right of us
			playerMoveData.isBlockedRight = true;
		}
		
	
	}