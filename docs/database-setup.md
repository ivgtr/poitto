# データベースセットアップガイド

## 開発環境（ローカル）

### 1. DockerでPostgreSQLを起動

```bash
# コンテナ起動
docker-compose up -d

# 確認
docker ps
```

### 2. Prismaマイグレーション実行

```bash
# 初回セットアップ
npx prisma migrate dev --name init

# スキーマ変更時
npx prisma migrate dev
```

### 3. Prisma Studioでデータ確認（オプション）

```bash
npx prisma studio
# http://localhost:5555 でアクセス
```

### 4. 開発サーバー起動

```bash
npm run dev
```

## OAuth設定（必須）

本アプリはGitHubとGoogleのOAuth認証のみをサポートしています。

### GitHub OAuth設定

1. https://github.com/settings/developers にアクセス
2. "New OAuth App" をクリック
3. 以下を設定:
   - **Application name**: poitto（任意）
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Client ID と Client Secret を生成
5. `.env.local` に設定:
   ```bash
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

### Google OAuth設定

1. https://console.cloud.google.com/apis/credentials にアクセス
2. 「認証情報を作成」→「OAuth 2.0 クライアント ID」
3. アプリケーションタイプ: 「Webアプリケーション」
4. 以下を設定:
   - **名前**: poitto（任意）
   - **承認済みのリダイレクト URI**: `http://localhost:3000/api/auth/callback/google`
5. Client ID と Client Secret をコピー
6. `.env.local` に設定:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

## 本番環境への切り替え

### ステップ1: 本番用データベース作成

以下のいずれかを使用：
- **Neon Postgres** (推奨): https://neon.tech
- **Supabase**: https://supabase.com
- **Vercel Postgres**: https://vercel.com/storage/postgres
- **AWS RDS / Google Cloud SQL**: マネージドPostgreSQL

### ステップ2: 接続文字列の更新

`.env.local` または本番環境変数に設定：

```bash
# Neon Postgresの例
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

### ステップ3: マイグレーション適用

```bash
# 本番環境には migrate deploy を使用（migrate dev は使わない）
npx prisma migrate deploy
```

### ステップ4: OAuthコールバックURLを本番用に変更

- **GitHub**: Settings → Developer settings → OAuth Apps → poitto
  - Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`

- **Google**: Cloud Console → APIs & Services → Credentials
  - 承認済みのリダイレクト URI: `https://your-app.vercel.app/api/auth/callback/google`

## コマンド早見表

| 操作 | コマンド |
|------|----------|
| ローカルDB起動 | `docker-compose up -d` |
| ローカルDB停止 | `docker-compose down` |
| マイグレーション作成 | `npx prisma migrate dev --name <名前>` |
| マイグレーション適用（本番） | `npx prisma migrate deploy` |
| Prisma Studio起動 | `npx prisma studio` |
| クライアント再生成 | `npx prisma generate` |
| DBリセット | `npx prisma migrate reset` |

## 注意事項

### ⚠️ 絶対にやってはいけないこと

- **本番DBで `migrate dev` を実行しない**
  - 開発専用コマンドで、データ削除の可能性あり
  - 本番では必ず `migrate deploy` を使用

### 🔒 セキュリティ

- `.env.local` は `.gitignore` に追加済み
- 本番のDB接続文字列とOAuth秘密鍵は決してGitHubにコミットしない
- Vercel等のダッシュボードで環境変数を設定

## トラブルシューティング

### ポート5432が使用中の場合

```bash
# 使用中のポートを確認
lsof -i :5432

# 既存のPostgreSQLを停止（macOS）
brew services stop postgresql

# または別ポートを使用
docker-compose.yml の ports を変更: "5433:5432"
```

### 接続エラー

```bash
# Prismaクライアントを再生成
npx prisma generate

# データベースが存在するか確認
docker-compose exec postgres psql -U poitto -c "\l"
```

### OAuthエラー

- **redirect_uri_mismatch**: コールバックURLが一致していない
  - GitHub/Googleの設定と`.env.local`のNEXTAUTH_URLを確認
  
- **access_denied**: ユーザーがアクセスを拒否
  - OAuth画面で「許可」をクリックしたか確認

## 本番デプロイ時の環境変数（Vercel例）

Vercelダッシュボード → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=生成したランダム文字列
NEXTAUTH_URL=https://your-app.vercel.app
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=ユーザーのAPIキー（オプション）
```

### NEXTAUTH_SECRET生成

```bash
openssl rand -base64 32
```
