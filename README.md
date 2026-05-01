# モールス信号練習

参考画像の見た目に寄せて、**線でつながるボード型**にした版です。

## この版のポイント

- 白い線でノード同士がつながる
- ノードは **●（短押し）** と **■（長押し）** の形で表現
- ノードの中に「丸」「四角」という文字は出さない
- 文字は図の近くに配置
- 現在位置・通過済み・確定位置を色分け
- 押下中に音を再生
- 押下時間バーを表示
- GitHub Pages でそのまま公開可能

## 操作方法

- 画面の「押す」ボタンを短押し：●
- 画面の「押す」ボタンを長押し：■
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
4. GitHub の `Settings` → `Pages` を開く
5. `Build and deployment` を以下に設定

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

6. 保存後、以下の形式で公開されます。

```text
https://<GitHubユーザー名>.github.io/<リポジトリ名>/
```

## 補足

- 外部ライブラリは使用していません。
- HTML / CSS / JavaScript のみで動作します。
- 文字化け対策として UTF-8 で保存してください。
