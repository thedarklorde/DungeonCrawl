
var goDCPlayerController : GameObject;
private var dcPlayer : DungeoncrawlPlayerController;

var gWeapons : GameObject[];
var gWeaponOffsets : Vector3[];

static var NUMBER_OF_WEAPONS = 1;
static var WEAPON_SPRITE_X_TILING_FACING_RIGHT = 0.5;
static var WEAPON_SPRITE_X_TILING_FACING_LEFT = -0.5;
static var PLAYER_HAND_WIDTH = 2;

// These hold the z-level for weapons to draw at, based on whether the character is moving left or right.
// As our character is right handed, when he's moving right on-screen, the weapon should be in front of him,
// while if he is moving left on-screen, the weapon should draw behind him.
static var WEAPON_Z_RIGHT = 3;
static var WEAPON_Z_LEFT = 5;

class WeaponMovementData {
	var isAttacking : boolean;
	
	var goCurrentWeapon : Transform;
	var goCurrentWeaponOutline : Transform;
	
	var goCurrentWeaponHitbox : Transform;
	}

class WeaponAnimationData {
	var vCurrentHandPos : Vector3;
	
	var goaWeapons : GameObject[];
	
	var vRunUV : Vector2;
	var vAttackUV : Vector2;
	
	var vaWeaponRunOffsets : Vector2[];
	var vaWeaponAttackOffsets : Vector2[];
	}

private var weaponMoveData : WeaponMovementData;
private var weaponAnimData : WeaponAnimationData;

// Use this for initialization
function Start () {
//	Debug.Log("DungeoncrawlWeaponManager.Start()");
	
	// First, a little wiring to make talking to the player easier.
	dcPlayer = goDCPlayerController.GetComponent(DungeoncrawlPlayerController);
	
	weaponMoveData = new WeaponMovementData();
	
	weaponMoveData.isAttacking = false;
	
	weaponMoveData.goCurrentWeapon = gWeapons[0].transform;
	weaponMoveData.goCurrentWeaponOutline = gWeapons[0].transform.FindChild("dcLongswordOutline");
	weaponMoveData.goCurrentWeaponHitbox = gWeapons[0].transform.FindChild("dcHitBox");
	
	// Hmm. Seems that colliders can't be disabled at runtime. Which makes this complicated. Hmm.
//	gWeapons[0].GetComponent(BoxCollider).active = false;
	weaponMoveData.goCurrentWeaponHitbox.GetComponent(BoxCollider).size = Vector3( 0,0,0 );		// Scale to 0 is efectively the same as turning off.
	
	weaponAnimData = new WeaponAnimationData();
	
	weaponAnimData.goaWeapons = new GameObject[1];
	
	weaponAnimData.vRunUV = Vector2( 0, 0 );
	weaponAnimData.vAttackUV = Vector2( 0.5, 0 );

	weaponAnimData.vaWeaponRunOffsets = new Vector2[NUMBER_OF_WEAPONS];
	weaponAnimData.vaWeaponRunOffsets[0] = Vector2( 1,5 );
	
	weaponAnimData.vaWeaponAttackOffsets = new Vector2[NUMBER_OF_WEAPONS];
	weaponAnimData.vaWeaponAttackOffsets[0] = Vector2( 9,2 );
	}


//function HoldPrimaryWeapon( vHandPos : Vector3) {
//	gWeapons[0].GetComponent(Transform).position = vHandPos;
//	}


// SetCurrentHandPosition() -- Update the weapon manager on the current hand position of th character sprite

function SetCurrentHandPosition(v : Vector3) {
//	Debug.Log("DungeoncrawlWeaponManager.SetCurrentHandPos(" + v + ")");
	
	weaponAnimData.vCurrentHandPos = v;
	}

// SetIsAttacking() -- Update the weapon manager on the current isAttacking state of the character
function SetIsAttacking(b : boolean) {
//	Debug.Log("DungeoncrawlWeaponManager.SetIsAttacking(" + b + ")");
	
	weaponMoveData.isAttacking = b;
	}


function FixedUpdate() {
	}


// Update() -- Update the current weapon's sprite to fit with the current positioning of the hand.

function Update () {
	// The weapon is split into two parts: the pixels of the weapon itself and the outline. The outline
	// is kept at a deeper Z than the weapon, creating a "sandwich" around the player. That way, weapon
	// pixels will render over the character sprite, and outline pixels will only appear as part of the
	// background (and won't draw an outline over the character's face, for example.`
	
	var p = weaponAnimData.vCurrentHandPos;
	
	if (weaponMoveData.isAttacking)
		// During an attack, scale up the hit box
		weaponMoveData.goCurrentWeaponHitbox.GetComponent(BoxCollider).size = Vector3( 14,6,2 );
	else
		// If we're not attack, hide the hit box
		weaponMoveData.goCurrentWeaponHitbox.GetComponent(BoxCollider).size = Vector3( 0,0,0 );

	// First, move the sword itself to the correct position.
	if (weaponMoveData.isAttacking) {
		if (dcPlayer.playerAnimData.isFacingRight) {
			p += weaponAnimData.vaWeaponAttackOffsets[0];
			// p.z = WEAPON_Z_LEFT;		// Strangely, we're reversing the Z logic for attacks to make the sword pommel appear in front of the forearm from the left.
			}
		else if (dcPlayer.playerAnimData.isFacingLeft) {
			p.x -= weaponAnimData.vaWeaponAttackOffsets[0].x - PLAYER_HAND_WIDTH;
			p.y += weaponAnimData.vaWeaponAttackOffsets[0].y;
			// p.z = WEAPON_Z_RIGHT;		// Strangely, we're reversing the Z logic for attacks 
			}
		else
			Debug.Log("DungeoncrawlWeaponMAnager.Update() Error.");
		}
	else {
		if (dcPlayer.playerAnimData.isFacingRight) {
			p += weaponAnimData.vaWeaponRunOffsets[0];
			// p.z = WEAPON_Z_RIGHT;		// Facing right, so the sword will be in front of the character
			}
		else if (dcPlayer.playerAnimData.isFacingLeft) {
			p.x -= weaponAnimData.vaWeaponRunOffsets[0].x - PLAYER_HAND_WIDTH;
			p.y += weaponAnimData.vaWeaponRunOffsets[0].y;
			// p.z = WEAPON_Z_LEFT;		// Facing left, so the sword will be behind the character
			}
		else
			Debug.Log("DungeoncrawlWeaponMAnager.Update() Error.");
		}		
	
	// Update the sword sprite to display the correct animation frame.
	if (weaponMoveData.isAttacking) {
		// Attacking, so show the "attack" frame
		weaponMoveData.goCurrentWeapon.renderer.material.mainTextureOffset = weaponAnimData.vAttackUV;
		weaponMoveData.goCurrentWeaponOutline.renderer.material.mainTextureOffset = weaponAnimData.vAttackUV;
		}
	else {
		// Not attacking, so show the "running" frame
		weaponMoveData.goCurrentWeapon.renderer.material.mainTextureOffset = weaponAnimData.vRunUV;
		weaponMoveData.goCurrentWeaponOutline.renderer.material.mainTextureOffset = weaponAnimData.vRunUV;
		}
	
	// If we're facing left, we need to reverse the coordinates set above.
	if (dcPlayer.playerAnimData.isFacingLeft) {
		weaponMoveData.goCurrentWeapon.renderer.material.mainTextureOffset.x = 
				-weaponMoveData.goCurrentWeapon.renderer.material.mainTextureOffset.x - 0.5;
		weaponMoveData.goCurrentWeaponOutline.renderer.material.mainTextureOffset.x =
				-weaponMoveData.goCurrentWeaponOutline.renderer.material.mainTextureOffset.x - 0.5;
		}
	
	// Fix the Z-depth so that the weapon displays in front of or behind the player as appropriate
	if (dcPlayer.playerAnimData.isFacingLeft) {
		weaponMoveData.goCurrentWeapon.renderer.material.mainTextureScale.x = WEAPON_SPRITE_X_TILING_FACING_LEFT;
		weaponMoveData.goCurrentWeaponOutline.renderer.material.mainTextureScale.x = WEAPON_SPRITE_X_TILING_FACING_LEFT;
		}
	else {
		weaponMoveData.goCurrentWeapon.renderer.material.mainTextureScale.x = WEAPON_SPRITE_X_TILING_FACING_RIGHT;
		weaponMoveData.goCurrentWeaponOutline.renderer.material.mainTextureScale.x = WEAPON_SPRITE_X_TILING_FACING_RIGHT;
		}
	
	// We've got our location - let's move the weapon to it.
	gWeapons[0].GetComponent(Transform).position = p;
	
//	gWeaponManager.GetComponent(DungeoncrawlWeaponManager).HoldPrimaryWeapon(p);
	}


function OnTriggerEnter(other : Collider) {
	Debug.Log("DCWeaponManager: *Sword collision with " + other + "*");
	}