## トラブルシューティング

### ビルドマニフェストエラー（ENOENT）が発生する場合

コード変更時に `_buildManifest.js.tmp.*` が見つからないエラーが発生する場合、以下の対処法を試してください：

1. **キャッシュをクリアして再起動**（推奨）:

   ```bash
   pnpm dev:clean
   ```

2. **手動でクリーンアップ**:

   ```bash
   pnpm clean
   pnpm dev
   ```

3. **Turbopack を無効化して試す**:

   ```bash
   pnpm dev:webpack
   ```

4. **開発サーバーを完全に停止して再起動**:
   - ターミナルで `Ctrl+C` でサーバーを停止
   - `.next` フォルダを削除
   - `pnpm dev` で再起動

このエラーは Windows 環境で Turbopack を使用している際に、ファイルシステムの監視タイミングの問題で発生することがあります。上記の方法で解決しない場合は、`dev:webpack` を使用して通常の webpack モードで開発を続けることができます。
