
// Use this for initialization
function Start () {
}

// Update is called once per frame
function Update () {
}


function OnTriggerEnter(other : Collider) {
	Debug.Log("DCHitDetection: (" + transform.parent.gameObject.name + ") hit the (" + other.gameObject.transform.parent.gameObject.name + ")");
	other.gameObject.GetComponent(DungeoncrawlHitDetection).WeaponHit(10);
	}


function WeaponHit(damage : int) {
	Debug.Log("DCHitDetection:WeaponHit: (" + transform.parent.gameObject.name + ") takes " + damage + " damage!");
	gameObject.transform.parent.gameObject.GetComponent(DungeoncrawlBlobController).WeaponHit(damage);
	}