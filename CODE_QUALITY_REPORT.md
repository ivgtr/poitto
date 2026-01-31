# コード品質調査レポート

## 📊 ファイルサイズ分析

### 🚨 大幅に超過（リファクタリング必須）

| ファイル | 現在の行数 | 制限 | 超過行数 | 優先度 |
|---------|----------|------|---------|-------|
| `home-client.tsx` | 465行 | 150行 | +315行 | 🔴 最高 |
| `task-fields.ts` | 277行 | 100行 | +177行 | 🔴 高 |
| `chat-interface.tsx` | 230行 | 150行 | +80行 | 🟡 中 |
| `task-conversation-service.ts` | 242行 | 200行 | +42行 | 🟡 中 |

### ✅ 適切なサイズ

- `timeline.tsx`: 94行
- `inbox.tsx`: 78行
- `task-bubble.tsx`: 45行

---

## 🔍 詳細課題

### 1. home-client.tsx (465行) - 超過315行

**問題:**
- 1ファイルに複数の責務が混在
  - サイドバーUI (100行)
  - チャット管理ロジック (150行)
  - タスク操作ハンドラ (50行)
  - メインコンテンツ表示 (50行)
  - ナビゲーションUI (30行)

**改善案:**
```
src/components/home/
├── home-client.tsx          # メインコンテナのみ (80行)
├── sidebar.tsx              # サイドバーUI (60行)
├── mobile-nav.tsx           # SP用ナビゲーション (40行)
├── chat-fab.tsx             # フローティングチャットボタン (50行)
└── hooks/
    └── use-task-management.ts # タスク操作ロジック (60行)
```

---

### 2. task-fields.ts (277行) - 超過177行

**問題:**
- 定数定義 + 純粋関数が混在
- 時刻処理 + バリデーション + マッピングが全て入っている

**改善案:**
```
src/domain/task/
├── task-fields.ts           # 型定義 + 定数のみ (50行)
├── validation.ts            # バリデーション関数 (60行)
├── mapping.ts               # マッピング関数 (50行)
├── time-utils.ts            # 時刻処理関数 (40行)
└── index.ts                 # 全てをエクスポート (20行)
```

---

### 3. task-conversation-service.ts (242行) - 超過42行

**問題:**
- チャットフロー制御 + フィールドマッピングが混在

**改善案:**
```
src/services/
├── task-conversation/
│   ├── index.ts                    # メインエクスポート (30行)
│   ├── conversation-flow.ts        # フロー制御 (100行)
│   └── field-mapping.ts            # フィールドマッピング (80行)
```

---

### 4. chat-interface.tsx (230行) - 超過80行

**問題:**
- UI + ローカル状態管理が混在

**改善案:**
```
src/components/chat/
├── chat-interface.tsx       # コンテナ (50行)
├── chat-message-list.tsx    # メッセージ表示 (60行)
├── chat-input-area.tsx      # 入力エリア (40行)
└── hooks/
    └── use-chat-scroll.ts   # スクロール管理 (30行)
```

---

## 🔧 その他の軽微な課題

### 未使用のファイル
- `src/lib/llm-conversation.ts`: テスト用ファイル。使用箇所が無ければ削除可能

### インポート順序の不整合
- 一部ファイルで`// カスタムフック`などのコメント付きグループ化があるが、
  全ファイルで統一されていない

### テストファイル命名
- `src/lib/task-fields.test.ts`: 移動後のパスに合わせて
  `src/domain/task/task-fields.test.ts` に移動すべき

---

## 📋 優先リファクタリング順序

### Phase 1: 緊急（アーキテクチャ改善）
1. **home-client.tsx分割** - 最も大きく、メンテナンス性に影響

### Phase 2: 重要（ドメイン層整備）
2. **task-fields.ts分割** - ドメイン層の責務分離

### Phase 3: 中程度（サービス層整備）
3. **task-conversation-service.ts分割**
4. **chat-interface.tsx分割**

### Phase 4: 整備
5. テストファイル配置の正規化
6. 未使用ファイルの削除確認

---

## 🎯 推奨アクション

次のステップとして**home-client.tsxの分割**を推奨。
これにより：
- コードの見通しが改善
- テスト容易性向上
- チーム開発時の競合減少
