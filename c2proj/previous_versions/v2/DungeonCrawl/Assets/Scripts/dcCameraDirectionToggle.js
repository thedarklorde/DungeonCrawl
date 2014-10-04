var TargetFacing : int;		// 1 = right, -1 = left.

function Start() {
	if (TargetFacing != 1 && TargetFacing != -1)
		Debug.Log("INVALID CAMERA FACING VALUE IN dcCameraDirectionToggle!!");
	}

function Update () {
}

function OnTriggerEnter(collider : Collider) {
	var mainCam : GameObject = GameObject.Find("Main Camera");
	mainCam.transform.GetComponent("dcFollowCamera").UpdateCameraFacing(TargetFacing);
	}