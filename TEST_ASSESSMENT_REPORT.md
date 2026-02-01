# テスト妥当性評価レポート

## 📊 現在のテストカバレッジ

### ✅ 妥当なテスト（充実）

| テストファイル | カバー対象 | 評価 | 備考 |
|--------------|-----------|------|------|
| `task-fields.test.ts` | バリデーション関数 | ⭐⭐⭐⭐⭐ | 包括的（17テスト） |
| `task-fields-mapping.test.ts` | マッピング関数 | ⭐⭐⭐⭐ | 十分（12テスト） |
| `task-repository.test.ts` | Repositoryパターン | ⭐⭐⭐⭐⭐ | Mock実装も含む（11テスト） |
| `tasks.test.ts` | Server Actions | ⭐⭐⭐⭐ | 統合テスト（6テスト） |
| `route.test.ts` | API Routes | ⭐⭐⭐⭐ | LLM Mock付き（5テスト） |

**合計: 51テスト** - 基盤部分は良好

---

## ⚠️ 不足しているテスト

### 新規コンポーネント（リファクタリング後）

| コンポーネント/フック | 優先度 | 理由 |
|---------------------|-------|------|
| `use-task-edit-form.ts` | 🔴 高 | フォーム状態管理・バリデーション |
| `task-edit-form.tsx` | 🔴 高 | フォームUI・入力処理 |
| `task-edit-dialog.tsx` | 🟡 中 | ダイアログ制御（薄いため） |
| `chat-message-item.tsx` | 🟡 中 | メッセージレンダリング |
| `chat-messages.tsx` | 🟡 中 | スクロール制御 |
| `chat-input.tsx` | 🟡 中 | 入力処理・送信 |
| `use-message-handlers.ts` | 🔴 高 | 複雑なハンドラロジック |

### 機能テスト

| 機能 | 優先度 | 理由 |
|------|-------|------|
| タスク編集フロー | 🔴 高 | 新機能・重要ビジネスロジック |
| チャット会話フロー | 🟡 中 | 統合テストとして必要 |

---

## 🎯 推奨アクションプラン

### Phase 1: 最重要（優先度高）

**1. use-task-edit-form.ts のテスト**
```typescript
// 必要なテストケース:
- 初期値の設定（既存タスクから）
- 各フィールドの更新（title, category, deadline, scheduledAt, durationMinutes）
- handleSaveの成功ケース
- handleSaveのバリデーションエラー
- クリア関数（clearDeadline, clearScheduled, clearDuration）
- 日付パース（scheduledDate + scheduledTime → Date）
```

**2. use-message-handlers.ts のテスト**
```typescript
// 必要なテストケース:
- handleSendMessage（正常系・エラー系）
- handleSelectOption（登録する・登録しない・スキップ・その他）
- タスク登録フロー（canRegisterTaskチェック）
- 会話継続フロー（generateNextQuestion）
```

**3. タスク編集フローの統合テスト**
```typescript
// 必要なテストケース:
- 編集ダイアログの開閉
- 全項目の編集・保存
- キャンセル操作
- バリデーションエラー表示
```

### Phase 2: 中程度（優先度中）

**4. UIコンポーネントのテスト**
- chat-message-item（メッセージタイプ別レンダリング）
- chat-input（入力・送信・Enterキー）
- chat-messages（スクロール・ローディング表示）

### Phase 3: 低（オプション）

**5. E2Eテスト**
- 実際のブラウザでのフロー検証（Playwright等）

---

## 📋 テスト作成優先順位

### 今すぐ作成すべき（🔴 高）

1. **use-task-edit-form.test.ts** (推定工数: 2時間)
   - 状態管理の複雑さをカバー
   - バリデーションロジックの検証

2. **use-message-handlers.test.ts** (推定工数: 2.5時間)
   - ビジネスロジックの核
   - 複数フロー分岐の検証

3. **task-edit-integration.test.ts** (推定工数: 1.5時間)
   - 編集機能の全体フロー

### 次のステップ（🟡 中）

4. UIコンポーネントテスト (推定工数: 3時間)
   - React Testing Library使用
   - ユーザ操作シミュレーション

---

## 💡 推奨方針

**テスト戦略:**
1. **単体テスト**: フック・ユーティリティ関数
2. **統合テスト**: Server Actions・API Routes
3. **コンポーネントテスト**: UIコンポーネント（必要に応じて）

**避けるべき:**
- 単純なUIコンポーネントの過度なテスト
- 実装詳細に依存した脆いテスト

**目標カバレッジ:**
- ビジネスロジック: 80%以上
- バリデーション: 100%
- UIコンポーネント: 重要なフローのみ

---

## 🚀 推奨アクション

**今すぐ着手:**
A) use-task-edit-form のテスト作成
B) use-message-handlers のテスト作成  
C) タスク編集フローの統合テスト
D) 現状維持（51テストで十分）

どれから始めますか？
