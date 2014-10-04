// dcFollowCamera -- Allows camera tracking of a side-scrolling character
//
// When attached to a camera, this component will cause the camera to track the
// specified player object. The implementation includes a configurable 'dead zone'.

var thePlayer : Transform;

var XOffset : int;
var YOffset : int;
var DeadZoneWidth : int;
var DeadZoneHeight : int;

private var moveDirection : int;

function Start() {
	moveDirection = 1;
	}

function Update () {
	// Adjust the camera's horizontal position, if necessary
	if (moveDirection == 1) {	// Facing right - this moves the dead zone to the left of the screen to give a leading view
		if (transform.position.x < thePlayer.position.x + XOffset) {	// The player hit the leading (here, left) edge of the dead zone
			transform.position.x = thePlayer.position.x + XOffset;
			}
		else if (transform.position.x > thePlayer.position.x + DeadZoneWidth + XOffset) {	// The player hit the trailing (here, right) edge of the dead zone
			transform.position.x = thePlayer.position.x + DeadZoneWidth + XOffset;
			}
		}
	else if (moveDirection == -1) {	// Facing left - shifts the dead zone to the right of the screen
		if (transform.position.x > thePlayer.position.x - XOffset) {	// The player hit the leading (here, right) edge of the dead zone
			transform.position.x = thePlayer.position.x - XOffset;
			}
		else if (transform.position.x < thePlayer.position.x - DeadZoneWidth - XOffset) {	// The player hit the trailing (here, left) edge of the dead zone
			transform.position.x = thePlayer.position.x - DeadZoneWidth - XOffset;
			}
		}
	else
		Debug.Log("dcFollowCamera.js: IMPOSSIBLE! HOW DID THIS HAPPEN!");

	// Adjust the camera's vertical position, if necessary
	if (transform.position.y < thePlayer.position.y + YOffset) {	// The player hit the top edge of the dead zone
		transform.position.y = thePlayer.position.y + YOffset;
		}
	else if (transform.position.y > thePlayer.position.y + DeadZoneHeight + YOffset) {	// The player hit the bottom edge of the dead zone
		transform.position.y = thePlayer.position.y + DeadZoneHeight + YOffset;
		}
}

function UpdateCameraFacing(facing : int) {
	moveDirection = facing;
	}