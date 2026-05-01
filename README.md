# モールス信号練習

参考画像に寄せたボード型の最新版です。

## 今回の修正内容

- 数字 `0-9` を追加
- スマホで重要なマップ部分が画面幅に収まるように調整
- スマホで「押す」ボタンが画面幅に収まるように調整
- 通過した丸・四角は中まで塗りつぶし
- 現在位置・確定位置も色分け
- 6文字以上でも扱えるようにし、未対応コードは `?` として確定

## 操作方法

- 短押し: ●
- 長押し: ■
- スペースキーでも入力可能
- Backspace: 1つ戻る
- Escape: リセット

## ファイル構成

```text
.
├─ index.html
├─ styles.css
├─ app.js
└─ README.md
```

## GitHub Pages で公開

1. GitHubで新規リポジトリを作成
2. この4ファイルをリポジトリ直下に配置
3. `main` ブランチに push
4. `Settings` → `Pages`
5. `Build and deployment` を以下に設定

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```
