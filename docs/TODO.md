# Poitto TODO / 進行中タスク

## 🎯 現在進行中

### Phase 3: Repository Pattern導入
詳細: [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)

**完了 ✅**
- [x] Interface定義: `ports/task-repository.ts`
- [x] 実装: `infrastructure/persistence/prisma-task-repository.ts`
- [x] Server Actionsリファクタリング（Repository使用）
- [x] Repository単体テスト作成（11テスト）

**目的:** ビジネスロジックの単体テストでDBをモック可能にする

**成果:**
- InMemoryRepository実装による単体テスト可能に
- Server ActionsはRepositoryの薄いラッパーに
- テスト時にPrismaをモック可能に

---

## 📋 バックログ

### 優先度高

- [ ] 重複コード削除
  - `llm-parser.ts` と `llm-parser-simple.ts` の統合
  - `task-fields.ts` と `task-conversation-service.ts` の重複部分を抽出

- [ ] `lib/` ディレクトリの責務分離
  - Domain Logic → `src/domain/`
  - Infrastructure → `src/infrastructure/`

### 優先度中

- [x] Integration Tests追加
  - [x] API Routesのテスト (5 tests) - POST /api/parse-task
  - [x] Server Actionsのテスト (6 tests) - CRUD operations with mocks
  - **成果**: Repository/LLMをモックして高速にテスト可能に

- [x] Error Handling改善
  - [x] 統一エラー型: `ErrorCode` enum + `ApplicationError` class
  - [x] ユーザー向けメッセージ: `userMessage` (日本語)
  - [x] Server Actions: `ActionResult<T>` 形式
  - [x] API Routes: `{ success, data/error }` 形式
  - [x] エラーテスト追加 (8 tests)
  - **成果**: 型安全で一貫性のあるエラーハンドリング

### 優先度低

- [ ] CI/CDパイプライン構築
  - GitHub Actionsでテスト自動実行
  - デプロイ自動化

---

## 🏗️ Phase 4: コード品質改善 (進行中)

### ファイルサイズ最適化（SOLID原則に基づく）

**現在進行中:**
- [x] **home-client.tsx分割** ✅
  - [x] `Sidebar`コンポーネント抽出 (72行)
  - [x] `MobileNav`コンポーネント抽出 (43行)
  - [x] `ChatFab`コンポーネント抽出 (99行)
  - **成果**: 465行 → 297行 (-36%)

- [ ] **task-fields.ts分割** (277行 → 目標100行)
  - [ ] `validation.ts` - バリデーション関数
  - [ ] `mapping.ts` - マッピング関数
  - [ ] `time-utils.ts` - 時刻処理関数

**バックログ:**
- [ ] **task-fields.ts分割** (277行 → 目標100行)
  - [ ] `validation.ts` - バリデーション関数
  - [ ] `mapping.ts` - マッピング関数
  - [ ] `time-utils.ts` - 時刻処理関数

- [ ] **task-conversation-service.ts分割** (242行 → 目標200行)
  - [ ] `conversation-flow.ts` - フロー制御
  - [ ] `field-mapping.ts` - フィールドマッピング

- [ ] **chat-interface.tsx分割** (230行 → 目標150行)
  - [ ] `chat-message-list.tsx`
  - [ ] `chat-input-area.tsx`

---

## ✅ 完了済み

- [x] Phase 1: テスト環境構築 (Vitest)
- [x] Phase 2: ドメインロジックのテスト作成
  - [x] `isValidTitle()` バグ修正・テスト
  - [x] マッピング関数のテスト
  - [x] 31テスト作成・全パス
- [x] Phase 3: Repository Pattern導入
  - [x] TaskRepository Interface定義
  - [x] Prisma実装
  - [x] InMemory実装（テスト用）
  - [x] 11テスト作成・全パス

---

## 🔄 更新履歴

### 2026-01-31
- Phase 2完了、Phase 3開始準備
- TODOファイル分離（READMEから分離）
