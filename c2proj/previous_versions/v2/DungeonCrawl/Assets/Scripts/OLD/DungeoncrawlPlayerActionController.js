
static var currentdoor : Collider;
static var DOOR_RELOCATION_X_OFFSET = 1;
static var DOOR_RELOCATION_Y_OFFSET = 1;
static var PLAYER_Z = 1;
static var CAMERA_Z = -16;

static var recentDoorTravel : boolean = false;  // Flag to prevent repeated door trips with a single button press

function Awake() {
	}

function Update() {
	var v = Input.GetAxis("Vertical");
	
	if (v) {		// Then we have had vertical input.
		// Debug.Log ("vert input: v=<" + v + ">");
		if (v > 0) {	// It's up.
			if (currentdoor) { 		// If we are standing in a door, then this is a command to activate it
				// Debug.Log("currentdoor=<" + currentdoor + ">");
				if (!recentDoorTravel) {
					var t : Transform = currentdoor.GetComponent(DungeoncrawlDoor).destination.transform;  // Get the destination coords
					transform.position = Vector3(t.position.x + DOOR_RELOCATION_X_OFFSET,t.position.y + DOOR_RELOCATION_Y_OFFSET,PLAYER_Z); // GO!
					var c = GameObject.FindWithTag("MainCamera");
					Debug.Log("camera:" + c);
					c.transform.position = Vector3(t.position.x + DOOR_RELOCATION_X_OFFSET,t.position.y + DOOR_RELOCATION_Y_OFFSET+2,CAMERA_Z); // GO CAMERA!
					
					recentDoorTravel = true;
					}
				}
			}
			else{
				Debug.Log ("Jump time?");
			}
		}
	else {	// No vertical input - they released the key
		recentDoorTravel = false;
		}
	}

function OnTriggerEnter(other : Collider) {
	// Debug.Log("Entered trigger: <" + other + ">");
	
	if (other.tag == "Door") {
		// Debug.Log("It's a door.");
		currentdoor = other;
		}
	}
	
function OnTriggerStay(other : Collider) {
	if (other.tag == "Door") {
		// If we traveled through a door last frame, currentdoor needs to be updated.
		currentdoor = other;
		}
	}

function OnTriggerExit(other : Collider) {
	// Debug.Log("Exited trigger: <" + other + ">");
	
	if (other.tag == "Door") {
		// Debug.Log("It's a door.");
		currentdoor = null;
		}
	}