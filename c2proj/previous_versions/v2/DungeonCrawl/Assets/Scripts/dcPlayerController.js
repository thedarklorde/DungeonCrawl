// Fixed settings
var MoveSpeed : float;
var GravityStrength : float;
var JumpStrength : float;
var AfterJumpStrength : float;

private var downForce : Vector3;
private var jumpForce : Vector3;
private var boostForce : Vector3;

private var downCastDir : Vector3;
private var boxCollider : BoxCollider;

class Player {
	// Current movement data
	var horizontalSpeed : float;
	var verticalSpeed : float;
	var currentTrajectory : Vector3;

	// Status bits: horizontal
	var isMovingLeft : boolean;
	var isMovingRight : boolean;
	var moveDirection : int;
	var horizTrajectory : float;
	
	// Status bits: vertical
	var isGrounded : boolean;	// touching terra firma
	var isLiftoff : boolean;	// the first frame of a jump
	var isJumping : boolean;	// from lift-off to first jump button release
	var isFalling : boolean;	// from button release to next event
	var vertImpulse : int;
	var vertTrajectory : float;
	
	// Object tracking
	var actionTaken : boolean;
	var usingDoor : boolean;
	var haveDoor : boolean;
	var currentDoor : GameObject;
	
	public function Player() {
		this.isMovingLeft = false;
		this.isMovingRight = false;
		this.moveDirection = 0;
		this.horizTrajectory = 0.0f;
		
		this.isGrounded = false;
		this.isLiftoff = false;
		this.isJumping = false;
		this.isFalling = false;
		this.vertImpulse = 0;
		this.vertTrajectory = 0.0f;
		
		this.actionTaken = false;
		this.usingDoor = false;
		this.haveDoor = false;
		this.currentDoor = null;
		}
	}
private var player : Player;

function Start() {
	player = new Player();
	downForce = new Vector3(0.0f, -GravityStrength, 0.0f);		// The downward force of gravity, applied each frame (should this be * deltaTime?)
	jumpForce = new Vector3(0.0f, JumpStrength, 0.0f);			// Initial force of a jump
	boostForce = new Vector3(0.0f, AfterJumpStrength, 0.0f);	// Ongoing force as player holds jump button
	
	downCastDir = new Vector3(0.0f, -1.0f, 0.0f);
	boxCollider = transform.gameObject.GetComponent(BoxCollider);
	}


function Update () {
	player.moveDirection = Input.GetAxisRaw("Horizontal");   // As we're using "Raw", this will be either 1.0, 0, or -1.0
	if (player.moveDirection == 1) {
		player.isMovingLeft = false;
		player.isMovingRight = true;
		}
	else if (player.moveDirection == -1) {
		player.isMovingLeft = true;
		player.isMovingRight = false;
		}
	else if (player.moveDirection == 0) {
		player.isMovingLeft = false;
		player.isMovingRight = false;
		}
	else
		Debug.Log("IMPOSSIBLE!");

	player.vertImpulse = Input.GetAxisRaw("Vertical");   // As we're using "Raw", this will be either 1.0, 0, or -1.0
	// Debug.Log("vert:<" + player.vertImpulse + ">");
	if (player.vertImpulse == 1) {
		// JUMP and ACTION are overloaded on up
		if (!player.actionTaken) {	// If we already acted on this keystroke in a way that requires no further action, do nothing.
			if (player.haveDoor) {
				player.usingDoor = true;
				}
			else if (player.isGrounded) {  // Jump!
				Debug.Log("Liftoff!");
				player.isGrounded = false;
				player.isLiftoff = true;	// This gets switched in FixedUpdate()
				}
			// Otherwise, nothing. Ignore this input while falling for now.
			}
		}
	else if (player.vertImpulse == -1) {
		// Nothing at the moment.
		}
	else if (player.vertImpulse == 0) {
		if (player.actionTaken)
			player.actionTaken = false;
		if (player.isJumping) {	// Then they let go of the jump button
			player.isJumping = false;
			player.isFalling = true;
			}
		}
	else
		Debug.Log("ALSO IMPOSSIBLE!");
	}
	
	
function FixedUpdate() {	
	if (player.usingDoor) {
		transform.position = player.currentDoor.GetComponent(dcStairway).GetTargetLocation();
		player.currentDoor = player.currentDoor.GetComponent(dcStairway).TargetDoor;
		player.usingDoor = false;
		player.actionTaken = true;
		}
	
	// This is pretty damn clever: by adding a down force, we don't have to care if the
	// player is grounded or not - the physics system will do the right thing. Found this
	// on Teh Webs. Bless you, Internet!
	if (player.isLiftoff) {
		Debug.Log("Liftoff!");
		rigidbody.AddForce(jumpForce);
		player.isLiftoff = false;
		player.isJumping = true;
		}
	else if (player.isJumping) {
		// Debug.Log("Boost!");
		rigidbody.AddForce(boostForce);
		}
	rigidbody.AddForce(downForce);

	// Horizontal movement - this uses the Transform part of our character, instead of the
	// Rigidbody - which simplifies our interface significantly. Notice that we are using
	// Translate() instead of MovePosition(), in order to allow the collision system to 
	// smoothly handle hitting objects. Lovely!
	player.horizTrajectory = player.moveDirection * MoveSpeed * Time.deltaTime;
	transform.Translate(player.horizTrajectory, 0.0f, 0.0f);
	
	// raycast check to see if the player is standing on the ground
	var leftBound : Vector3;
	var rightBound : Vector3;
	leftBound = new Vector3(boxCollider.transform.position.x - (boxCollider.size.x / 2), boxCollider.transform.position.y, boxCollider.transform.position.z);
	rightBound = new Vector3(boxCollider.transform.position.x + (boxCollider.size.x / 2), boxCollider.transform.position.y, boxCollider.transform.position.z);

	// Debug.DrawRay(leftBound, downCastDir * 17, Color.green);
	// Debug.DrawRay(rightBound, downCastDir * 17, Color.green);
	if (Physics.Raycast(leftBound, downCastDir, 33.0f) || Physics.Raycast(rightBound, downCastDir, 17.0f)) {
		if (player.isGrounded == false) {
			Debug.Log("Grounded!");
			player.isGrounded = true;
			}
		}
	else {
		if (player.isGrounded == true) {
			Debug.Log("Ungrounded!");
			player.isGrounded = false;
			}
		}
	}

function OnEnterDoorZone(door : GameObject) {
	Debug.Log("What an interesting door!");
	player.haveDoor = true;
	player.currentDoor = door;
	}

function OnExitDoorZone() {
	Debug.Log("Goodbye, door!");
	player.haveDoor = false;
	player.currentDoor = null;
	}