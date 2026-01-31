# コード構造分析レポート

## 現在の構成

```
src/
├── app/                    # Next.js App Router (UI + API)
│   ├── api/               # API Routes (Infrastructure)
│   ├── page.tsx           # Pages (Presentation)
│   └── layout.tsx         # Layout (Presentation)
├── components/            # React Components (Presentation)
├── hooks/                 # React Hooks (State Management)
├── lib/                   # ⚠️ MIXED RESPONSIBILITIES
│   ├── prisma.ts          # DB Infrastructure
│   ├── llm-*.ts           # External API (Infrastructure)
│   ├── task-fields.ts     # Domain Logic (should be pure)
│   ├── task-utils.ts      # Domain Logic (mixed)
│   └── utils.ts           # General utilities
├── services/              # ⚠️ MIXED RESPONSIBILITIES
│   ├── task-service.ts    # Business + Data Access
│   └── task-conversation-service.ts  # Business Logic
├── types/                 # Type Definitions
└── actions/               # Server Actions (mixed)
```

## 問題点

### 1. **lib/ ディレクトリの責務混在**
- `prisma.ts` - DB接続（Infrastructure）
- `llm-parser*.ts` - LLM API呼び出し（Infrastructure）
- `task-fields.ts` - バリデーション・マッピング（Domain）
- `local-storage.ts` - ブラウザStorage（Infrastructure）

### 2. **services/ の責務不明確**
- `task-service.ts` - Prisma直接呼び出し（Data Access + Business）
- `task-conversation-service.ts` - 純粋なBusiness Logic（これは良い）

### 3. **hooks/ の責務過多**
- `use-task-conversation.ts` - State管理 + API呼び出し

### 4. **重複コード**
- `llm-parser.ts` と `llm-parser-simple.ts`
- `task-fields.ts` と `task-conversation-service.ts` の一部重複

## 推奨構成（レイヤードアーキテクチャ）

```
src/
├── domain/               # 純粋なドメインロジック（単体テスト可能）
│   ├── task/
│   │   ├── model.ts      # Task型・バリデーション
│   │   ├── validation.ts # isValidTitle, isTaskComplete等
│   │   └── parser.ts     # 自然言語パースロジック
│   └── types/
│
├── application/          # ユースケース（オーケストレーション）
│   ├── services/
│   │   ├── task-service.ts      # タスクCRUDのフロー
│   │   └── conversation-service.ts  # 会話フロー制御
│   └── ports/
│       ├── task-repository.ts   # Repository Interface
│       └── llm-client.ts        # LLM Client Interface
│
├── infrastructure/       # 外部依存（モック可能）
│   ├── persistence/
│   │   ├── prisma/
│   │   │   ├── client.ts
│   │   │   └── task-repository.ts  # Prisma実装
│   │   └── local-storage.ts
│   ├── llm/
│   │   ├── openai-client.ts
│   │   └── openrouter-client.ts
│   └── api/
│       └── routes/
│
├── presentation/         # UI層
│   ├── components/
│   ├── hooks/           # UI Stateのみ
│   └── pages/
│
└── types/               # グローバル型
```

## 優先リファクタリング項目

### Phase 1: Domain Layer抽出（最重要）
- `task-fields.ts` → `domain/task/validation.ts`（pure functions）
- `task-fields.ts` の型定義 → `domain/task/model.ts`
- バリデーションロジックの単体テスト作成

### Phase 2: Repository Pattern導入
- `services/task-service.ts` からPrisma呼び出しを分離
- `ports/task-repository.ts` Interface定義
- `infrastructure/persistence/prisma/task-repository.ts` 実装

### Phase 3: Infrastructure分離
- `lib/llm-*.ts` → `infrastructure/llm/`
- `lib/prisma.ts` → `infrastructure/persistence/prisma/`

### Phase 4: テスト整備
- Domain Layer: 100% Unit Test
- Application Layer: Integration Test
- Infrastructure: Mock Test
