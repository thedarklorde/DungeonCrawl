
private var controller = CharacterController;

function Awake() {
	controller = GetComponent( CharacterController );
	}


function Update() {
	controller.SimpleMove();
	}

@script RequireComponent (CharacterController)