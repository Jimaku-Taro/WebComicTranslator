# WebComicTranslator
これはChromeやFirefoxの拡張機能です。
<br/>This is chrome and firefox extention.

特定のWebコミック上に翻訳文字を表示します。
<br/>This extention display translated text on some web-comics.

原理的には、position:relative;とposition: absolute;を利用して画像に文字を重ねてるだけ。
<br/>In principle, just use "position: relative;" and "position: absolute;" to overlay text on the image.

自動翻訳ではありません。
<br/>It is not automatically translation.

Chrome拡張：Page Ruler Reduxを併用し、
対象画面上で計測ボックスを作り、Ctrl+Vを押すと、
自動的にxy位置、高さ、幅を算出し、クリップボードにサイズ文字列を格納してくれます。
https://chrome.google.com/webstore/detail/page-ruler-redux/giejhjebcalaheckengmchjekofhhmal

Reload Extentionsも使うと効率的に画面更新を確認できます。
（ただし、大きな設定変更やエラーがある場合は、
ブラウザを再起動しないと反映しないことがあります。）
https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid
