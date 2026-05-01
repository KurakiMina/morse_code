# モールス信号練習

短押し・長押しでモールス信号を入力する練習用Webアプリです。

## 機能

- 短押しを「・」として入力
- 長押しを「－」として入力
- 中心アンテナからモールス信号ツリーを進む
- 入力した経路を色で表示
- 文字確定時にも最終ノードを色付け
- 押下中に音を再生
- 押下時間バーを表示
- スマートフォン・PC対応
- GitHub Pagesで公開可能

## 操作方法

- 画面の「押す」ボタンを短押し：短点
- 画面の「押す」ボタンを長押し：長点
- スペースキー：同じく入力
- Backspace：1文字削除
- Escape：リセット

## ファイル構成

```text
.
├─ index.html
├─ styles.css
├─ app.js
└─ README.md
```

## GitHub Pagesで公開する方法

1. GitHubで新規リポジトリを作成
2. この4ファイルをリポジトリ直下に配置
3. `main` ブランチに push
4. GitHubのリポジトリ画面で `Settings` を開く
5. `Pages` を開く
6. `Build and deployment` を以下に設定

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

7. 保存後、以下の形式で公開されます。

```text
https://<GitHubユーザー名>.github.io/<リポジトリ名>/
```

## 補足

このアプリは外部ライブラリを使用していません。  
HTML / CSS / JavaScriptのみで動作します。

文字化けする場合は、ファイルの文字コードがUTF-8になっているか確認してください。
