# タスク管理アプリ poitto 要件定義書 v2.0

## 1. プロジェクト概要

### 1.1 コンセプト
tiimoにインスピレーションを得た、Webベースのパーソナルタスク管理アプリ。自然言語でタスクを入力し、LLMが解析・ラベル付け・スケジューリングを行い、視覚的にわかりやすいタイムラインでタスクを管理する。

### 1.2 ターゲットユーザー
- パーソナルユース（個人利用）
- アカウント制でデータをクラウド管理
- 将来的に複数ユーザー対応可能な設計

### 1.3 基本方針
- **Webファースト**: クラウドベースでどこからでもアクセス可能
- **アカウント制**: ログインして個人データを管理
- **レスポンシブ**: SP/PCで最適なUIを提供
- **BYOK（Bring Your Own Key）**: ユーザーが自分のLLM APIキーを使用
- **tiimoライクUI**: ビジュアルタイムライン、カラフルなバブル表現

---

## 2. 機能要件

### 2.1 アカウント認証

| 項目 | 内容 |
|------|------|
| 認証方式 | メール/パスワード、またはOAuth（Google等） |
| データ管理 | ユーザーごとにクラウドDBでタスクデータ管理 |
| セッション | JWTトークンによるステートレス認証 |

### 2.2 タスク入力（チャット形式）

| 項目 | 内容 |
|------|------|
| 入力方式 | チャットライクな自然言語入力 |
| 入力例 | 「明日までに〇〇への返信返す」「ねぎ・白菜買う」「2/4までに〇〇をやる」 |
| 複数タスク | 1回の入力で複数タスクを認識・分割 |
| 音声入力 | 将来的に対応（MVP後） |

### 2.3 LLM解析・ラベル付け

LLMが入力から以下を抽出：

| 抽出項目 | 必須/任意 | 説明 |
|----------|-----------|------|
| タイトル | 必須 | タスクの内容 |
| カテゴリ | 必須 | shopping / reply / work / personal / other |
| 期限（deadline） | 任意 | 「〜までに」の日時 |
| 実行予定（scheduledAt） | 任意 | 「いつやるか」の日時 |
| 所要時間見積もり | 任意 | 分単位 |
| 緊急度 | 自動算出 | 期限からの逆算 |

### 2.4 補完UI（Clarification）

LLMが情報不足と判断した場合：
- 選択肢形式で補足情報を提示（例: 「いつやる？」→ 午前/午後/未定）
- **「入力しない」選択肢を必ず用意**（強制しない）
- 補完なしでもタスク登録可能（Inboxへ）

### 2.5 タスクの状態管理

| ステータス | 説明 |
|------------|------|
| inbox | 時間未定、Inboxに配置 |
| scheduled | タイムラインに配置済み |
| done | 完了 |
| archived | アーカイブ済み（削除履歴） |

### 2.6 画面構成・ナビゲーション

#### SP（スマートフォン）レイアウト
```
┌─────────────────────────────────┐
│  Header: [Logo] [Settings]      │
├─────────────────────────────────┤
│                                 │
│                                 │
│        Main Content             │
│    (Timeline / Calendar /       │
│     Chat / Task List)           │
│                                 │
│                                 │
├─────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │ 🏠  │  │ 📅  │  │ 💬  │     │
│  │Home │  │ Cal │  │Chat │     │
│  └─────┘  └─────┘  └─────┘     │
│        Floating Menu            │
└─────────────────────────────────┘
```

#### PC（デスクトップ）レイアウト
```
┌────────────────────────────────────────────────────┐
│  Header: [Logo]        [Search] [Settings] [👤]   │
├──────────┬─────────────────────────────────────────┤
│          │                                         │
│  Sidebar │              Main View                  │
│          │          (Timeline / Calendar)          │
│  [🏠]    │                                         │
│  Home    │     Colorful Bubble Timeline            │
│          │                                         │
│  [📅]    │  ┌──────────────────────────┐          │
│  Calendar│  │  🟡 Meeting (30min)      │          │
│          │  └──────────────────────────┘          │
│  [💬]    │                                         │
│  Chat    │  ┌──────────────────────────┐          │
│          │  │  🟢 Shopping (15min)     │          │
│  [✓]     │  └──────────────────────────┘          │
│  Done    │                                         │
│          │                                         │
├──────────┴─────────────────────────────────────────┤
│  Chat Input: 「タスクを入力...」          [Send]   │
└────────────────────────────────────────────────────┘
```

### 2.7 ビューモード

| 画面 | SP表示 | PC表示 | 内容 |
|------|--------|--------|------|
| **Home** | ✅ メイン | ✅ デフォルト | 今日のタイムライン（バブル表示） |
| **Calendar** | ✅ タブ | ✅ Sidebar | 週/月カレンダー＋タイムライン |
| **Chat** | ✅ タブ | ✅ Sidebar/Modal | LLMチャットインターフェース |
| **Done** | ✅ タブ | ✅ Sidebar | 完了タスク一覧 |

### 2.8 tiimoライクなビジュアライゼーション

- **カラフルなバブル/タイムブロック**: カテゴリごとに色分け
- **所要時間でサイズ変更**: 長いタスクは大きく表示
- **現在時刻ライン**: 赤い線で現在時刻を表示
- **円形アイコン**: 各カテゴリを絵文字/アイコンで表示
- **スムーズなアニメーション**: 追加・移動・完了時のアニメーション
- **進捗ビジュアル**: タイマー/進捗リング表示

#### カテゴリと色の対応

| カテゴリ | 色 | アイコン |
|----------|------|----------|
| shopping | 🟢 緑 | 🛒 |
| reply | 🔵 青 | 📧 |
| work | 🟡 黄 | 💼 |
| personal | 🟣 紫 | 🏠 |
| other | ⚪ 灰 | 📋 |

### 2.9 Inbox機能

- 時間未定タスクの一時保管場所
- ドラッグ＆ドロップでタイムラインへ配置可能
- LLMが推測で時間を提案することもある（ユーザーが承認）

---

## 3. 非機能要件

### 3.1 パフォーマンス
- 初回ロード: 3秒以内
- APIレスポンス: 1秒以内
- リアルタイム更新: WebSocketまたはポーリング

### 3.2 セキュリティ
- パスワードハッシュ化（bcrypt）
- APIキーは暗号化して保存
- JWTによる認証
- HTTPS通信

### 3.3 拡張性
- マイクロサービス設計を見据えたモジュール構成
- 複数ユーザー対応のデータ設計
- 将来的なプレミアム機能追加を見据えた設計

---

## 4. データモデル

```typescript
// ユーザー
interface User {
  id: string
  email: string
  passwordHash: string
  displayName: string
  createdAt: Date
  updatedAt: Date
  settings: UserSettings
}

// ユーザー設定
interface UserSettings {
  id: string
  userId: string
  llmProvider: 'openai' | 'anthropic' | 'google' | 'other'
  apiKeyEncrypted: string
  defaultView: 'home' | 'calendar'
  theme: 'light' | 'dark' | 'auto'
  notificationEnabled: boolean
}

// タスク
interface Task {
  id: string
  userId: string
  
  // LLM抽出フィールド
  title: string
  category: 'shopping' | 'reply' | 'work' | 'personal' | 'other'
  deadline: Date | null
  scheduledAt: Date | null
  durationMinutes: number | null
  
  // 状態
  status: 'inbox' | 'scheduled' | 'done' | 'archived'
  
  // 完了情報
  completedAt: Date | null
  
  // メタ情報
  rawInput: string
  createdAt: Date
  updatedAt: Date
}

// チャット履歴
interface ChatMessage {
  id: string
  userId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}
```

---

## 5. 技術スタック

| レイヤー | 技術 | 理由 |
|----------|------|------|
| **Frontend** | Next.js 14 (App Router) | SSR/SSG対応、高速表示 |
| **Styling** | Tailwind CSS | レスポンシブ対応、カスタマイズ性 |
| **UI Components** | shadcn/ui | 高品質なコンポーネントベース |
| **Animation** | Framer Motion | tiimoライクなアニメーション |
| **Backend** | Next.js API Routes | シンプルな構成 |
| **Database** | PostgreSQL (Neon/Supabase) | リレーショナルデータの管理 |
| **ORM** | Prisma | 型安全なDB操作 |
| **Auth** | NextAuth.js | 認証の簡易実装 |
| **Deployment** | Vercel | Next.jsとの親和性 |
| **Storage** | Redis (Upstash) | セッション管理、キャッシュ |

---

## 6. MVP スコープ

### 含む
- ✅ アカウント登録・ログイン
- ✅ チャット形式でのタスク入力
- ✅ LLM解析（カテゴリ・期限・タイトル抽出）
- ✅ 補完UI（選択肢形式）
- ✅ SP: ホバーメニュー（Home/Calendar/Chat）
- ✅ PC: サイドバーナビゲーション
- ✅ tiimoライクなバブルタイムライン
- ✅ 今日/週/月 ビュー切り替え
- ✅ Inbox機能
- ✅ タスク完了・アーカイブ
- ✅ クラウドDB保存

### 含まない（将来実装）
- 繰り返しタスク
- カテゴリカスタマイズ
- 通知・リマインダー（プッシュ通知）
- カレンダー連携（Google Calendar等）
- 共有機能
- オフラインモード
- モバイルアプリ（PWAは検討）

---

## 7. 画面遷移・フロー

### 認証フロー
```
[Top] → [Login/Register] → [Home]
```

### メインフロー（SP）
```
[Home] ←→ [Calendar] ←→ [Chat]
   ↓
[Task Detail] → [Edit/Delete]
```

### メインフロー（PC）
```
[Sidebar] → [Home/Calendar/Chat/Done] 
                ↓
         [Chat Input Area]
                ↓
         [Task Creation/Update]
```

---

## 8. 用語定義

| 用語 | 定義 |
|------|------|
| deadline | 「〜までに」という期限 |
| scheduledAt | 「いつやるか」という実行予定時刻 |
| Inbox | 時間が未定のタスクを保管する場所 |
| BYOK | Bring Your Own Key、ユーザー自身のAPIキーを使用する方式 |
| tiimo | ADHD向けビジュアルタイマー＆スケジューラーアプリ |
| バブル | tiimoライクなカラフルなタスク表示要素 |
| SP | Smartphone（スマートフォン） |
| PC | Personal Computer（デスクトップ/ラップトップ） |

---

## 9. 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2026-01-31 | v2.0 | Webデプロイ対応、アカウント制追加、tiimoライクUIへの変更、レスポンシブ設計の明確化 |
| 2026-01-31 | v1.0 | 初版作成（ローカルファースト設計） |
