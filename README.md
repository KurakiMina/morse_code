# モールス信号練習

参考画像により近いレイアウトで作り直した版です。

## 今回の修正内容

- 参考画像に寄せたノード配置
- 線でつながるボード型の表示
- 丸や四角は、通過したら中まで塗りつぶし
- 現在位置と確定位置も色で判別可能
- 入力長の上限を 10 まで拡張
- 6文字以上でもエラーにせず扱えるよう修正
- 未対応のモールス列は `?` で確定
- 数字は後で追加しやすいよう構成を維持

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
