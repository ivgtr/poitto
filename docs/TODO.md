# Poitto TODO / 進行中タスク

## 🎯 現在進行中

### Phase 3: Repository Pattern導入
詳細: [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)

- [ ] `services/task-service.ts` からPrisma分離
- [ ] Interface定義: `ports/task-repository.ts`
- [ ] 実装: `infrastructure/persistence/prisma/task-repository.ts`

**目的:** ビジネスロジックの単体テストでDBをモック可能にする

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

- [ ] Integration Tests追加
  - API Routesのテスト
  - Server Actionsのテスト

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

---

## 🔄 更新履歴

### 2026-01-31
- Phase 2完了、Phase 3開始準備
- TODOファイル分離（READMEから分離）
