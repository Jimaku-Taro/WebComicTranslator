console.log('cshort ok');

/** デバッグフラグ */
let DEBUG_MODE = true;

/** デバッグ用コンソール表示 */
function consoleLog(s) {
	if (DEBUG_MODE && this.console && typeof console.log != "undefined") {
		console.log(s);
 	}
}

// 画像の親タグを保持する変数(基本1タグのみの前提)
let imageParentElement;

/**
 * クリップボードに文字列を保存する関数
 * @param {data} string - 任意の文字列
 */
function clipboardSetData(data){
	consoleLog(data);
	var body = document.body;
	if(!body) return false;

	// 画面上のテキストのみクリップボードに取得可能のなので
	// 一瞬テキストエリアを作る（人間には視認不可能）
	var text_area = document.createElement("textarea");
	text_area.value = data;
	body.appendChild(text_area);
	text_area.select();
	var result = document.execCommand("copy");
	body.removeChild(text_area);
	return result;
}