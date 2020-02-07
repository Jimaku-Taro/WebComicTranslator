# WebComicTranslator
position:relative;とposition: absolute;で画像に文字を重ねてるだけ。
common.css
.WCT_IMAGE_PARENT {
	position:relative;
	font-size: 1px;
}

figcaption.WCT {
	position: absolute !important;
}

<div class="WCT_IMAGE_PARENT">
	<img src="comic.jpg" />
	<figcaption class="WCT" style="left: 58.0134%;top: 1.9694%;width: 41.4023%;height: 71.7724%;font-size: 20px;color: #F77D24;background-color: #3C0C05;border-radius: 45%">セリフや文字</figcaption>
</div>

これはChromeやFirefoxの拡張機能です。
This is chrome and firefox extention.

特定のWebコミック上に翻訳文字を表示します。
This extention display translated text on some web-comics.

自動翻訳ではありません。
It is not automatically translate.