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

- [ ] Error Handling改善
  - エラーハンドリングの統一
  - ユーザーフレンドリーなエラーメッセージ整備

### 優先度低

- [ ] CI/CDパイプライン構築
  - GitHub Actionsでテスト自動実行
  - デプロイ自動化

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
