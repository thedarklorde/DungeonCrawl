
var TargetDoor : GameObject;

function Update () {
}

function GetTargetLocation() {
	return TargetDoor.transform.position;
	}

function OnTriggerEnter(playerCollider : Collider) {
	Debug.Log("Door zone enter! <" + playerCollider.gameObject + ">");
	playerCollider.GetComponent(dcPlayerController).OnEnterDoorZone(gameObject);
	}
	
function OnTriggerExit(playerCollider : Collider) {
	Debug.Log("Door zone EXIT! <" + playerCollider.gameObject + ">");
	playerCollider.GetComponent(dcPlayerController).OnExitDoorZone();
	}