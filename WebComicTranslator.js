// コピーレフト © 2017 　　　　
// 本ソースのライセンスは以下のGPLv3が適用されるものとする。
// https://www.gnu.org/licenses/gpl-3.0.html
// つまり使用・改造・複製・再配布・閲覧等を自由に行うことを認める。
// ソースを閲覧したい場合、配布物それ自体がソース(またはそのzip圧縮)なためそれを読むか
// 適用したブラウザのフォルダ内に展開されたものを読んで下さい。

// と言うかここ読める時点で、ソース読めてる。
// そもそもライセンス適用する程大した内容ではないけど
// …と言うか訳文ファイルの塊と言った方が正しい

// jQuery等のライブラリを使う場合は、
// manifest.jsonのjsに、同梱するライブラリのファイルパスを
// このjsファイルより「先に」記載する必要がある



/** デバッグフラグ */
let DEBUG_MODE = true;

/** デバッグ用コンソール表示 */
function consoleLog(s) {
	if (DEBUG_MODE && this.console && typeof console.log != "undefined") {
		console.log(s);
 	}
}

consoleLog('WebComicTransrator初回動作始動');

// WCT用のタグ
const TEXT_TAG_NAME = "figcaption";
const TEXT_TAG_CLASS = "WCT";
const IMAGE_PARENT_TAG_CLASS = "WCT_IMAGE_PARENT";

// ホスト名
// 後で下記のホスト名のいずれかを再設定（www付き等のブレがあるため）
let host_string = location.host;

// 設定用ホスト名
const HOST_DEVILS_CANDY = "devilscandycomic.com";

const HOST_MONSTER_POP = "monsterpop.mayakern.com";
const HOST_MAYA_KERN = "mayakern.com";

const HOST_TAPAS = "tapas.io";
const HOST_M_TAPAS = "m.tapas.io";
const HOST_AVAS_DEMON = "avasdemon.com";

const HOST_HOPPING_GILLS = "hoppinggills.com";
const HOST_HAZBIN_HOTEL = "hazbinhotel.com";
const HOST_WEBTOONS = "webtoons.com";

const HOST_ZOOPHOBIA = "zoophobiacomic.com";
const ZOOPHOBIA_CHARACTERS_PATH = "characters";

const HOST_MALIKI = "maliki.com";

// フォントサイズ属性
const ATTRIBUTE_FONT_SIZE = "fontSize";


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
			consoleLog("自動算出");
			let offsetLeft = pageRulerDev.offsetLeft;
			let offsetTop = pageRulerDev.offsetTop;

			// 要素の位置を取得
			var clientRect = imageParentElement.getBoundingClientRect();
			var positionX = clientRect.left + imageParentElement.clientLeft + window.pageXOffset;
			var positionY = clientRect.top + imageParentElement.clientTop + window.pageYOffset;

			// 要素内におけるクリック位置を計算
			let x = offsetLeft - positionX;
			let y = offsetTop - positionY;
			consoleLog("x:" + x + "px y:" + y + "px");
			let parcentX = x / imageParentElement.clientWidth * 100;
			let parcentY = y / imageParentElement.clientHeight * 100;
			let parcentWidth = pageRulerDev.offsetWidth / imageParentElement.clientWidth * 100;
			let parcentHeight = pageRulerDev.offsetHeight / imageParentElement.clientHeight * 100;
			//　クリップボードに吹き出し用サイズ文字列を保存
			consoleLog("w:" + pageRulerDev.offsetWidth + "px h:" + pageRulerDev.offsetHeight + "px");
			clipboardSetData(
				"left: " + parcentX.toFixed(4) + "%;top: " + parcentY.toFixed(4)
				+ "%;width: " + parcentWidth.toFixed(4) + "%;height: " + parcentHeight.toFixed(4) +"%;");

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
 * 本来オブジェクトは{x:x, y,y, z:z,...}と書く必要があるが、キーと値が同名の場合{x,y,z....}と省略できる
 * ただし入力側、出力側、ともに変数名を一致させる必要がある。
 * let x,y,z;
 * return {x,y,z}なら
 * 受け側は let {x,y,z} = function();で同名変数を用意する必要がある。
 * 配列返しも可 return [x,y,z]; let[x,y,z] = func();
 */
function getTargetData() {


	let url_string = location.href;
	// urlの末尾部分を取得
	let url_last = getUrlLast(url_string);

	let image;
	let imageFileName = null;


	// ホストで取得対象を変更
	let json_path ="page_text/";
	// url末尾の数字部だけ取得
	let url_number = url_last.replace(/[^0-9]/g, '');

	// urlのホスト部分の文字列で対象を判定、分岐 wwwの有無があるので、完全一致でなくincludesで判定
	switch (true) {
		case host_string.includes(HOST_DEVILS_CANDY):
			// デビルズキャンディ
			host_string = HOST_DEVILS_CANDY;
			imageParentElement = document.getElementById("cc-comicbody");
			json_path += host_string + "/" + url_last + ".json";
		break;
		case host_string.includes(HOST_MONSTER_POP):
			// モンスターポップ
			host_string = HOST_MONSTER_POP;
			imageParentElement = document.getElementById("comic");
			json_path += host_string + "/" + url_number + ".json";
		break;
		case host_string.includes(HOST_TAPAS):
		case host_string.includes(HOST_M_TAPAS):
			// tapas
			host_string = HOST_TAPAS;
			imageParentElement = document.getElementsByClassName("js-episode-article main__body").item(0);
			if (!imageParentElement) {
				imageParentElement = document.getElementsByClassName("ep-epub-contents").item(0);
			}
			// サイトの仕様変更でURLの変更が画面描画後になったので、ページIDは属性から取得
			let data_ep_id = imageParentElement.parentElement.parentElement.getAttribute("data-ep-id");
			// imageParentElement.innerHTML = "<div>" + imageParentElement.innerHTML + "</div>";
			// imageParentElement = imageParentElement.getElementsByTagName("div").item(0);
			json_path += host_string + "/" + data_ep_id + ".json";
		break;
		case  host_string.includes(HOST_AVAS_DEMON):
			// Ava's Demon
			host_string = HOST_AVAS_DEMON;
			imageParentElement = document.getElementById("content");
			image = imageParentElement.getElementsByTagName("img").item(0);
			let src = image.src;
			let img_num = src.replace(/[^0-9]/g, '');
			json_path += host_string + "/" + img_num + ".json";
		break;
		case host_string.includes(HOST_MAYA_KERN):
			// マヤカーン短編
			// サイト構造変更前の旧処理はコメントアウト　他にはOBSERVER部分もコメントアウトしたので復活時は注意
			// image = document.getElementsByClassName("mfp-img").item(0);

			// if (image) {
			// 	imageParentElement = image.parentElement;
			// 	imageFileName = getUrlLast(image.src);
			// 	// ページ移動後も、WCT用のタグが残るので削除
			// 	let wct_tag_collection = imageParentElement.getElementsByClassName(TEXT_TAG_CLASS);
			// 	let length = wct_tag_collection.length;
			// 	// 削除でリスト内の数も減るので、後ろから降順に削除
			// 	for (var i = length - 1; 0 <= i; i--) {
			// 	 	let wct_tag = wct_tag_collection.item(i);
			// 		imageParentElement.removeChild(wct_tag);
			// 	}

			// 	if (check_target != imageParentElement) {
			// 		// チェック対象が別→閲覧表示を閉じて開き直した場合、監視を設定
			// 		check_target = imageParentElement;
			// 		let options = {
			// 			childList: true
			// 		};
			// 		// 画像の親の親を監視（画像の親を監視すると、訳文の追加・削除まで検知してしまうため）
			// 		let target = document.getElementsByClassName("mfp-content").item(0);
			// 		OBSERVER_2.observe(target , options);
			// 	}

			// }
			// json_path += host_string + "/" + imageFileName + ".json";
			host_string = HOST_MAYA_KERN;
			imageParentElement = document.getElementsByClassName("portfolio-slider");
			json_path += host_string + "/portfolio-slider.json";
		break;
		case host_string.includes(HOST_HOPPING_GILLS):
			host_string = HOST_HOPPING_GILLS;
			imageParentElement = document.getElementById("comic-box");
			image = document.getElementsByClassName("img-fluid").item(0);
			if (image) {
				imageFileName = getUrlLast(image.src);
			}
			json_path += host_string + "/" + imageFileName + ".json";
		break;
		case host_string.includes(HOST_HAZBIN_HOTEL):
			host_string = HOST_HAZBIN_HOTEL;
			imageParentElement = document.getElementsByClassName("image-block-wrapper");
			json_path += host_string + "/" + url_last + ".json";
		break;
		case host_string.includes(HOST_WEBTOONS):
			host_string = HOST_WEBTOONS;
			imageParentElement = document.getElementById("_imageList");
			// URLからパラメーターを取得
			let urlSearchParams = new URLSearchParams(window.location.search);
			let title_no = urlSearchParams.get("title_no");
			let episode_no = urlSearchParams.get("episode_no");
			json_path += host_string + "/" + title_no + "/" + episode_no + ".json";
		break;
		case host_string.includes(HOST_ZOOPHOBIA):
			host_string = HOST_ZOOPHOBIA;
			imageParentElement = document.getElementsByClassName("photo-hires-item").item(0);
			if (imageParentElement) {
				// 画像の親があれば、コミックページ用処理
				image = imageParentElement.firstElementChild;
				if (image.tagName !== "img") {
					image = image.firstElementChild;
				}
				imageFileName = getUrlLast(image.src);
				json_path += host_string + "/" + imageFileName + ".json";
			} else if (ZOOPHOBIA_CHARACTERS_PATH === url_last) {
				// charactersページ用処理
				imageParentElement = document.getElementsByTagName("p");
				json_path += host_string + "/character" + ".json";
			}
		break;
		case host_string.includes(HOST_MALIKI):
			host_string = HOST_MALIKI;
			imageParentElement = document.getElementsByClassName("col-xs-12").item(0);
			json_path += host_string + "/" + url_last + ".json";
		break;
	}
	// 拡張機能内のファイルパス取得
	let json_url = chrome.extension.getURL(json_path);
	let elementOrElemnts = imageParentElement;
	return [imageParentElement, json_url];
}

// オブザーバー関数２の設定
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

	// 画像の親タグクラス名を追加 (位置設定を相対に指定　position: relative;)
	imageParentElement.classList.add(IMAGE_PARENT_TAG_CLASS);
	// imageParentElement.style.position = "relative"; // 親タグの位置スタイルを相対へ設定

	// DocumentFragmentに仮入れ
	let fragment = document.createDocumentFragment();
	for(var item of jsonObject) {
		// 文字１件毎にテキストとスタイルとクラスを取得し設定
		let html_text = item["text"];
		let style_string = item["style"];
		let classNames = item["class"];


		let figcaption = document.createElement(TEXT_TAG_NAME);
		figcaption.style.cssText = style_string;
		figcaption.className = TEXT_TAG_CLASS;
		if (classNames) {
			let classArray = classNames.split(" ");
			for (let class_name of classArray) {
				if (class_name) {
					figcaption.classList.add(class_name);
				}
			}
		}

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
	consoleLog('WCT：メイン処理動作開始');
	// 対象ページのデータ取得
	let [elementOrElemnts, json_url] = getTargetData();

	if (!elementOrElemnts) {
		consoleLog("WCT：現在のページの画像の親タグが見つかりません。");
		// 処理対象のタグがなければ処理終了
		return;
	}

	let length = elementOrElemnts.length;
	let imageParentElementList = null;
	if (!length) { // lengthがundefined等の場合　対象はElement
		imageParentElement = elementOrElemnts;
		length = 1;
	} else {
		// 対象がHTMLCollectionだった場合は、複数用処理 
		imageParentElementList = elementOrElemnts;
		imageParentElement = elementOrElemnts.item(0);
		// length = 3; // デバッグ用 最終対象数を固定
	}

	// 拡張子抜きJSON_URLを用意
	let json_url_base = json_url.substring(0, json_url.lastIndexOf("."));

	for (let i = 0; i < length; i++){
		consoleLog('WCT：描画ループNo.' + i +"開始");
		if (i != 0) {
			// 対象の2件目以降
			imageParentElement = imageParentElementList.item(i);
			// ループ数付きjson_urlへ変更
			json_url = json_url_base + i + ".json";
		}

		let figcaptionHtmlCollection = imageParentElement.getElementsByClassName(TEXT_TAG_CLASS);

		if (figcaptionHtmlCollection.length != 0) {
			// すでにfigcaptionタグ追加済みなら処理回避
			consoleLog("WCT：すでにWCT用のタグ追加済みのようです。");
			return;
		}
	
		// 指定ULRのJSONを取得　非同期なので、関数外の処理は、並行して実行されるので注意
		// つまり通信中に変数などが書き換わっていることが割と良くある
		fetchRequest(json_url, imageParentElement);

		consoleLog('WCT：描画ループNo.' + i +"終了");
	}

	consoleLog('WCT：メイン処理動作終了');
};

function fetchRequest(json_url, targetElement) {
		// 指定ULRのJSONを取得　非同期なので、関数外の処理は、並行して実行されるので注意
		// つまり通信～返信の間に、変数の内容が変わったりもありえる
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
			writePageTexts(jsonObject, targetElement);
		});
}

//オブザーバーの作成
const OBSERVER = new MutationObserver(records => {
	// 主関数呼び出し
	webComicTranslator();
});

// 即時関数
!function(){

	let target;
	let options;
	switch (true) {
		case host_string.includes(HOST_TAPAS):
			
			target = document.getElementsByClassName("js-episode-viewer").item(0);
			options = {
				childList: true
			};
			OBSERVER.observe(target, options);
		break;
		case host_string.includes(HOST_AVAS_DEMON):
			// window.onhashchange = webComicTranslator;
			target = document.getElementById("content");
			options = {
				childList: true
			};
			OBSERVER.observe(target, options);
		break;
		case host_string.includes(HOST_MAYA_KERN):
			// // 旧処理　コメントアウト
			// const body = document.body;
			// //オブザーバーの作成
			// target = document.body;
			// options = {
			// 	childList: true
			// };
			// OBSERVER.observe(target, options);
		break;
	}

 	webComicTranslator();
}();

consoleLog('WebComicTransrator初回動作終了');
