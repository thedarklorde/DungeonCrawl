
var tBlobStandingLeft : Material;
var tBlobStandingRight: Material;

var t : float;

function Start () {
	t = 0;
}

function Update () {
	
	t = t + Time.deltaTime;
	Debug.Log("t=<" + t + ">");
	
	if (t >= 1.0) {
		renderer.material = tBlobStandingRight;
		}
}