# プロンプト設計ドキュメント

## 1. 現在のプロンプト分析

### 現在のプロンプト構造（llm-parser-simple.ts）

```typescript
const prompt = `日本語入力からタスク情報を抽出してください。

【入力】
"${input}"

【抽出項目】
1. title: タスク内容（時間表現を除く）
2. scheduledAt: 実行予定時刻（ISO8601、JST+09:00、あれば）
3. deadline: 期限（ISO8601、あれば）
4. category: カテゴリ（shopping/reply/work/personal/other、推測できれば）

【現在時刻】${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}

【出力形式】
必ず以下のJSONのみ出力：
{
  "title": "タスク内容",
  "scheduledAt": "2026-01-31T15:00:00+09:00またはnull",
  "deadline": "2026-01-31T23:59:00+09:00またはnull",
  "category": "personalまたはnull"
}

重要：titleは必ず具体的な内容に。「（タイトル未定）」は使わない。時間表現はscheduledAt/deadlineに、残りがtitle。`;
```

### 分析：良い点

1. **明確な構造化**：入力→抽出項目→出力形式の流れが明確
2. **具体的な形式指定**：ISO8601、JST+09:00など具体的
3. **現在時刻の提供**：相対時間表現（「明日」「今日」）の解決に必要
4. **フォールバック指示**：「（タイトル未定）」を使わない明確な指示

### 分析：問題点

1. **durationMinutesが欠落**：所要時間の抽出ができない
2. **例示が不足**：抽象的な指示のみで、具体例がない
3. **title抽出の曖昧さ**：「時間表現を除く」が抽象的
4. **エッジケースの考慮不足**：「今日」「明日」だけの入力など
5. **継続入力の非対応**：2回目以降の入力で情報を追加できない

---

## 2. 改善プロンプト設計案

### 案A：初回入力用プロンプト（強化版）

```typescript
const FIRST_INPUT_PROMPT = `あなたは日本語の自然言語入力からタスク情報を高精度で抽出するエキスパートシステムです。

## 入力
"""
${input}
"""

## 現在時刻（JST）
${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}

## 抽出項目（すべて日本語で解釈）

### 1. title（タスク名）
- **定義**: 実行すべき具体的な行動
- **抽出ルール**:
  - 時間表現（明日、今日、来週、〜時、〜分）は除外
  - 「〜する」「〜を〜」などの動詞を含む表現を優先
  - 入力が曖昧な場合は、最も可能性の高い行動を推測
- **例**:
  - "明日の会議" → "会議"
  - "今日の午後3時に買い物" → "買い物"
  - "レポートを書く、明日まで" → "レポートを書く"

### 2. scheduledAt（実行予定日時）
- **定義**: いつ実行するか（開始時刻）
- **抽出ルール**:
  - 明示的な時刻表現（"3時","15:00"）がある場合はその時刻
  - 相対表現（"明日","今日"）は現在時刻から計算
  - 時間帯のみ（"午後","夜"）は代表的な時刻を設定
- **フォーマット**: ISO8601（JST+09:00）、またはnull
- **例**:
  - "明日の午後3時" → "${tomorrow}T15:00:00+09:00"
  - "今日中" → null（実行時刻が特定できない）
  - "夜に読書" → "${today}T20:00:00+09:00"

### 3. deadline（期限）
- **定義**: いつまでに完了すべきか
- **抽出ルール**:
  - "〜までに","〜内に"などの期限表現
  - 相対表現は現在時刻から計算（明日=明日の23:59）
- **フォーマット**: ISO8601（JST+09:00）、またはnull
- **例**:
  - "明日までに" → "${tomorrow}T23:59:00+09:00"
  - "来週中に" → "${nextWeekEnd}T23:59:00+09:00"

### 4. durationMinutes（所要時間）
- **定義**: 実行にかかる予想時間（分単位）
- **抽出ルール**:
  - 時間表現（"1時間","30分","2時間半"）を抽出
  - 漢数字・算用数字両方に対応
  - "〜くらい","〜程度"などの曖昧表現も処理
- **フォーマット**: number（分）、またはnull
- **例**:
  - "1時間かかる" → 60
  - "30分程度" → 30
  - "2時間半" → 150
  - "15分" → 15

### 5. category（カテゴリ）
- **定義**: タスクの種類
- **選択肢**: shopping | reply | work | personal | other
- **分類ルール**:
  - shopping: 購入、買い物、注文
  - reply: 返信、返事、メール、連絡
  - work: 業務、仕事、打ち合わせ、会議
  - personal: 勉強、趣味、家事、健康
  - other: その他、不明確

## 抽出例（参考）

入力: "明日の午後2時から1時間ほど会議"
出力: {
  "title": "会議",
  "scheduledAt": "2026-02-02T14:00:00+09:00",
  "deadline": null,
  "durationMinutes": 60,
  "category": "work"
}

入力: "今週中にレポートを書く、所要時間3時間"
出力: {
  "title": "レポートを書く",
  "scheduledAt": null,
  "deadline": "2026-02-08T23:59:00+09:00",
  "durationMinutes": 180,
  "category": "work"
}

入力: "明日までに本屋で参考書を買う"
出力: {
  "title": "参考書を買う",
  "scheduledAt": null,
  "deadline": "2026-02-02T23:59:00+09:00",
  "durationMinutes": null,
  "category": "shopping"
}

## 重要ルール
1. titleは必ず具体的な動詞を含む表現に
2. 時間表現はなるべく正確に抽出（相対時間は現在時刻から計算）
3. 複数の時間情報がある場合は、最も具体的なものを優先
4. JSONのみを出力、説明文は不要

## 出力形式（厳密に遵守）
{
  "title": "string（null不可）",
  "scheduledAt": "YYYY-MM-DDTHH:mm:ss+09:00 | null",
  "deadline": "YYYY-MM-DDTHH:mm:ss+09:00 | null",
  "durationMinutes": "number | null",
  "category": "shopping|reply|work|personal|other | null"
}`;
```

### 案B：継続入力用プロンプト（新規）

```typescript
const CONTINUATION_PROMPT = `あなたはタスク情報を更新するエキスパートシステムです。現在のタスク情報とユーザーの追加入力から、不足している情報を埋めてください。

## 現在のタスク情報
${JSON.stringify(currentTaskInfo, null, 2)}

## 現在の不足フィールド
${missingFields.join(", ")}

## ユーザーの追加入力
"""
${input}
"""

## 現在時刻（JST）
${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}

## タスク
上記の入力から、不足しているフィールドを特定し、現在のタスク情報を更新してください。

### 更新ルール
1. **新しい情報を優先**: 追加入入力が既存情報と矛盾する場合、新しい入力を優先
2. **nullは上書き可能**: nullのフィールドは新しい値で上書き
3. **値は保持**: 既存の値は、上書きされない限り保持
4. **文脈を理解**: 代名詞（"それ","このタスク"）は現在のタスクを指す

### 例

現在情報: { title: "会議", category: "work", deadline: null }
不足フィールド: ["scheduledAt", "deadline", "durationMinutes"]
追加入力: "明日の午後3時から2時間"
→ scheduledAt: "明日15:00" を設定
→ durationMinutes: 120 を設定

現在情報: { title: "買い物", category: "shopping", deadline: null }
不足フィールド: ["deadline"]
追加入力: "今日中に済ませる"
→ deadline: "今日23:59" を設定

## 出力形式
{
  "title": "string（変更なしなら既存値）",
  "scheduledAt": "string | null | unchanged",
  "deadline": "string | null | unchanged",
  "durationMinutes": "number | null | unchanged",
  "category": "string | null | unchanged",
  "missingFields": ["フィールド名の配列"],
  "isComplete": "boolean（不足フィールドがなくなったらtrue）"
}

重要：unchangedを使用して、変更がないことを明示的に示してください。`;
```

---

## 3. 技術的実装案

### 日時計算ヘルパー関数

```typescript
// src/lib/time-utils.ts
export function calculateRelativeDate(input: string, currentDate: Date): string {
  // 「明日」→ 明日の日付
  // 「今日」→ 今日の日付
  // 「来週」→ 次週の月曜日
  // 「今週中」→ 今週の日曜日
  // etc.
}

export function parseDuration(input: string): number | null {
  // 「1時間」→ 60
  // 「30分」→ 30
  // 「2時間半」→ 150
  // 「1.5時間」→ 90
  // etc.
}
```

### プロンプト動的生成

```typescript
function buildFirstInputPrompt(input: string): string {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return FIRST_INPUT_PROMPT
    .replace('${input}', input)
    .replace('${tomorrow}', formatDate(tomorrow))
    .replace('${today}', formatDate(now))
    .replace('${nextWeekEnd}', formatDate(nextWeek));
}
```

---

## 4. 評価基準

### 成功指標
1. **抽出精度**: テストケース80%以上で正確に抽出
2. **所要時間対応**: durationMinutesが適切に抽出される
3. **継続対話**: 2回目以降の入力で情報が正しく追加される
4. **曖昧入力対応**: 「今日」「明日」などの相対時間が正確に解釈される

### 検証テストケース

1. 基本ケース: "明日の午後3時に会議"
2. 複合時間: "明日の朝9時から1時間半ミーティング"
3. 期限のみ: "今週中にレポートを書く"
4. 継続入力: 1回目 "会議" → 2回目 "明日の午後3時から"
5. 曖昧時間: "今日中に買い物"
6. 所要時間明記: "2時間かかるタスク"

---

## 5. 実装ステップ

### Step 1: プロンプト更新（30分）
- llm-parser-simple.tsのプロンプトを新構造に更新
- durationMinutes抽出を追加

### Step 2: 継続入力対応（1時間）
- parseContinuation関数をLLM呼び出しに変更
- CONTINUATION_PROMPTを実装

### Step 3: 日時計算補助（30分）
- 相対時間表現の計算ヘルパーを実装
- テストケース作成

### Step 4: 統合テスト（30分）
- エンドツーエンドテスト
- エッジケース検証

**総見積もり: 約2.5〜3時間**

どのステップから始めますか？それ全体を一度に実装しますか？