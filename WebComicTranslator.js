// コピーレフト © 2017 　　　　
// 本ソースのライセンスは以下のGPLv3が適用されるものとする。
// https://www.gnu.org/licenses/gpl-3.0.html
// つまり使用・改造・複製・再配布・閲覧等を自由に行うことを認める。
// ソースを閲覧したい場合、配布物それ自体がソース(またはそのzip圧縮)なためそれを読むか
// 適用したブラウザのフォルダ内に展開されたものを読んで下さい。

// と言うかここ読める時点で、ソース読めてる。
// そもそもライセンス適用する程大した内容ではないけど

// jQuery等のライブラリを使う場合は、
// manifest.jsonのjsに、同梱するライブラリのファイルパスを
// このjsファイルより「先に」記載する必要がある



/** デバッグフラグ */
let DEBUG_MODE = true;

/** デバッグトレース */
function trace(s) {
	if (DEBUG_MODE && this.console && typeof console.log != "undefined") {
		console.log(s);
 	}
}

trace('WebComicTransrator初回動作始動');

// WCT用のタグ
const TEXT_TAG_NAME = "figcaption";
const TEXT_TAG_CLASS = "WCT";

// ホスト名
const HOST_DEVILS_CANDY = "devilscandycomic.com";
const HOST_MONSTER_POP = "www.monsterpop.mayakern.com";
const HOST_TAPAS = "tapas.io";
const HOST_AVAS_DEMON = "www.avasdemon.com";
const HOST_MIKL_TOAST = "milktoastandmaple.smackjeeves.com";
const HOST_MAYA_KERN = "mayakern.com";
const HOST_HOPPING_GILLS = "hoppinggills.com";


// 画像の親タグを保持する変数(基本1タグのみの前提)
let imageParentElement;

/**
 * クリップボードに文字列を保存する関数
 * @param {data} string - 任意の文字列
 */
function clipboardSetData(data){
	trace(data);
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

/**
 * キーダウン時の動作
 * Chrome拡張：Page Ruler Reduxで画面上に作った四角形のサイズを取得
 * 吹き出し用文字列に計算・編集してクリップボードに保存
 * 
 * Page Ruler Reduxのツールバーがボタンで下部に移せるのに気づいたので
 * ツールーバーの高さを算出値に含める処理を廃止（ちなみに要素のidは"page-ruler-toolbar"）
 * @param {KeyboardEvent} keyboardEvent - キーボードのイベント
 */
function KeyDownFunc(keyboardEvent){

	// shift+V
	if(keyboardEvent.shiftKey && keyboardEvent.key == 'V'){

		let pageRulerDev = document.getElementById("page-ruler");
		if (pageRulerDev) {
			trace("自動算出");
			let offsetLeft = pageRulerDev.offsetLeft;
			let offsetTop = pageRulerDev.offsetTop;
	
			// 要素の位置を取得
			var clientRect = imageParentElement.getBoundingClientRect();
			var positionX = clientRect.left + imageParentElement.clientLeft + window.pageXOffset;
			var positionY = clientRect.top + imageParentElement.clientTop + window.pageYOffset;
	
			// 要素内におけるクリック位置を計算
			let x = offsetLeft - positionX;
			let y = offsetTop - positionY;
			trace("x:" + x + "px y:" + y + "px");
			let parcentX = x / imageParentElement.clientWidth * 100;
			let parcentY = y / imageParentElement.clientHeight * 100;
			let parcentWidth = pageRulerDev.offsetWidth / imageParentElement.clientWidth * 100;
			let parcentHeight = pageRulerDev.offsetHeight / imageParentElement.clientHeight * 100;
			//　クリップボードに吹き出し用サイズ文字列を保存
			trace("w:" + pageRulerDev.offsetWidth + "px h:" + pageRulerDev.offsetHeight + "px");
			clipboardSetData(
				"left: " + parcentX.toFixed(2) + "%;top: " + parcentY.toFixed(2) 
				+ "%;width: " + parcentWidth.toFixed(2) + "%;height: " + parcentHeight.toFixed(2) +"%;");
			
		}
	}
}

/** キーダウン時の動作追加 */
document.onkeydown = KeyDownFunc;


/**
 * URLを"/"で分割して、最後の部分を取得
 * (末尾スラッシュを自動削除して処理する)
 * @param {String} url_string url文字列
 * @returns {String} url_last urlの最後部分
 */
function getUrlLast(url_string) {
	// 末尾が/(スラッシュ)なら/削除
	if (url_string.endsWith('/')) {
		url_string = url_string.substr(0, url_string.length - 1);
	}
	let url_list = url_string.split("/");
	let url_last = url_list[url_list.length - 1];
	return url_last;
}

//オブザーバーの作成(2つ目)
const OBSERVER_2 = new MutationObserver(records => {
	// 主関数呼び出し
	webComicTranslator();
});
// チェック対象
let check_target;

/**
 * URLからそのページの画像親要素と必要なファイルのパスを返す
 * @return {imageParent, text_path}  画像の親要素、ページテキストのファイルパス
 */
function getTargetData() {
	// ホスト名取得
	let host_string = location.host;

	let url_string = location.href;
	// urlの末尾部分を取得
	let url_last = getUrlLast(url_string);

	let image;
	let imageFileName = null;

	// ホストで取得対象を変更
	let json_path ="page_text/";
	// url末尾の数字部だけ取得
	let url_number = url_last.replace(/[^0-9]/g, '');

	switch (host_string) {
		case HOST_DEVILS_CANDY:
			// デビルズキャンディ
			imageParentElement = document.getElementById("cc-comicbody");
			json_path += host_string + "/" + url_last + ".json";
		break;
		case HOST_MONSTER_POP:
			// モンスターポップ
			imageParentElement = document.getElementById("comic");
			json_path += host_string + "/" + url_number + ".json";
		break;
		case HOST_TAPAS:
			// tapas
			imageParentElement = document.getElementsByClassName("ep-contents").item(0);
			json_path += host_string + "/" + url_number + ".json";
		break;
		case HOST_AVAS_DEMON:
			// Ava's Demon
			imageParentElement = document.getElementById("content");
			image = imageParentElement.getElementsByTagName("img").item(0);
			let src = image.src;
			let img_num = src.replace(/[^0-9]/g, '');
			json_path += host_string + "/" + img_num + ".json";
		break;
		case HOST_MIKL_TOAST:
			image = document.getElementById("comic_image");
			imageParentElement = image.parentElement;
			json_path += host_string + "/" + url_last + ".json";
		break;
		case HOST_MAYA_KERN:
			image = document.getElementsByClassName("mfp-img").item(0);
			
			if (image) {
				imageParentElement = image.parentElement;
				imageFileName = getUrlLast(image.src);
				// ページ移動後も、WCT用のタグが残るので削除
				let wct_tag_collection = imageParentElement.getElementsByClassName(TEXT_TAG_CLASS);
				let length = wct_tag_collection.length;
				// 削除でリスト内の数も減るので、後ろから降順に削除
				for (var i = length - 1; 0 <= i; i--) { 
				 	let wct_tag = wct_tag_collection.item(i);
					imageParentElement.removeChild(wct_tag);
				}

				if (check_target != imageParentElement) {
					// チェック対象が別→閲覧表示を閉じて開き直した場合、監視を設定
					check_target = imageParentElement;
					let options = {
						childList: true
					};
					// 画像の親の親を監視（画像の親を監視すると、訳文の追加・削除まで検知してしまうため）
					let target = document.getElementsByClassName("mfp-content").item(0);
					OBSERVER_2.observe(target , options);
				}

			}
			json_path += host_string + "/" + imageFileName + ".json";
		break;
		case HOST_HOPPING_GILLS:
			imageParentElement = document.getElementById("comic-box");
			image = document.getElementsByClassName("img-fluid").item(0);
			if (image) {
				imageFileName = getUrlLast(image.src);
			}
			json_path += host_string + "/" + imageFileName + ".json";
		break;
	}
	// 拡張機能内のファイルパス取得
	let json_url = chrome.extension.getURL(json_path);
	return {imageParentElement, json_url};
}

function setObserver2() {
	let options = {
		childList: true
	};
	OBSERVER_2.observe(imageParentElement, options);
}

/**
 * JSONデータから画像上に文字列を追加・描画
 * @param {JSON} jsonObject - ページテキスト情報を持っているJSON
 * @param {Element} imageParentElement 画像の親要素
 */
function writePageTexts(jsonObject, imageParentElement) {

	if (!jsonObject) {
		// URLに対するページデータがなければ処理終了
		console.log("WCT：現在のページに対するテキストが見つかりません。");
		return;
	}

	imageParentElement.style.position = "relative"; // 親タグの位置スタイルを相対へ設定

	// DocumentFragmentに仮入れ
	let fragment = document.createDocumentFragment();
	for(var item of jsonObject) {
		// 文字１件毎にテキストとスタイルを取得
		let html_text = item["text"];
		let style_string = item["style"];
		let figcaption = document.createElement(TEXT_TAG_NAME);
		figcaption.style.cssText = "position: absolute;font-family: Meiryo, メイリオ, '游ゴシック', 'Yu Gothic', YuGothic;" + style_string; 
		figcaption.className = TEXT_TAG_CLASS;
		figcaption.insertAdjacentHTML('beforeend',html_text); 
		// 親タグの下に文字表示タグを追加

		fragment.appendChild(figcaption);
	}
	// 画像の親タグの下に、1回の描画でまとめて追加
	imageParentElement.appendChild(fragment);
}

const handleErrors = (res) => {
	if (res.ok) {
	  return res;
	}
  
	switch (res.status) {
	  case 400: throw Error('INVALID_TOKEN');
	  case 401: throw Error('UNAUTHORIZED');
	  case 500: throw Error('INTERNAL_SERVER_ERROR');
	  case 502: throw Error('BAD_GATEWAY');
	  case 404: throw Error('NOT_FOUND');
	  default:  throw Error('UNHANDLED_ERROR');
	} 
  };

  
/**
 * 主要処理
 * ・画像の親タグ内に文字タグを重ねる
 */
function webComicTranslator() {
	trace('WCT：メイン処理動作開始');

	// 対象ページのデータ取得
	let {imageParentElement, json_url} = getTargetData();

	if (!imageParentElement) {
		trace("WCT：現在のページの画像の親タグが見つかりません。");
		// 処理対象のタグがなければ処理終了
		return;
	}
	let figcaptionHtmlCollection = imageParentElement.getElementsByClassName(TEXT_TAG_CLASS);

	if (figcaptionHtmlCollection.length != 0) {
		// すでにfigcaptionタグ追加済みなら処理回避
		trace("WCT：すでにWCT用のタグ追加済みのようです。");
		return;
	}


	// 指定ULRのJSONを取得　非同期なので、関数外の処理は、並行して実行されるので注意
	fetch(json_url)
	.then(handleErrors) // サーバ系エラーなど　通常発生しない
	.then((response) => {
		if (response.ok) {
			//　レスポンスOK jsonデータ扱いで取得し、次のthenへ渡す
			return response.json();
		}
		//　レスポンスがエラーなら処理継続を拒否
		return Promise.reject(response);
	}).then((jsonObject) => {
		// JSONが返ってきたら、画像上に文字列描画
		writePageTexts(jsonObject, imageParentElement);
	});

	trace('WCT：メイン処理動作終了');
};

//オブザーバーの作成
const OBSERVER = new MutationObserver(records => {
	// 主関数呼び出し
	webComicTranslator();
});

// 即時関数
!function(){
	let target;
	let options;
	switch (location.host) {
		case HOST_TAPAS:
			target = document.getElementById("episodes");
			options = {
				childList: true
			};
			OBSERVER.observe(target, options);
		break;
		case HOST_AVAS_DEMON:
			// window.onhashchange = webComicTranslator;
			target = document.getElementById("content");
			options = {
				childList: true
			};
			OBSERVER.observe(target, options);
		break;
		case "mayakern.com":
			const body = document.body;
			//オブザーバーの作成
			target = document.body;
			options = {
				childList: true
			};
			OBSERVER.observe(target, options);
		break;
	}

 	webComicTranslator();
}();

trace('WebComicTransrator初回動作終了');
