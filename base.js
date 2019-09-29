

function test() {
	if (DEBUG_MODE && this.console && typeof console.log != "undefined") {
		console.log("ログ");
		console.trace("トレース")
 	}
}