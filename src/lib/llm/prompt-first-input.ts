/**
 * 初回入力用のLLMプロンプト
 */

export function buildFirstInputPrompt(input: string): string {
  const now = new Date();
  const currentTimeStr = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

  return `あなたは日本語の自然言語入力からタスク情報を高精度で抽出するエキスパートです。

【入力】
"""${input}"""

【現在時刻（JST）】
${currentTimeStr}

【抽出項目】
1. title: タスク内容（時間表現を除き、具体的な動作を含める）
2. scheduledDate: 実行予定日（YYYY-MM-DD形式、あれば）
3. scheduledTime: 実行予定時間（"HH:mm"または"morning"/"noon"/"afternoon"/"evening"、あれば。不明確な場合はnull）
4. deadline: 期限（ISO8601 JST+09:00、あれば。常に23:59で設定）
5. durationMinutes: 所要時間（分単位の数値、あれば）
6. category: カテゴリ（shopping/reply/work/personal/other、推測できれば）

【抽出ルール】
- title: 時間表現（明日、今日、3時、1時間など）は除外。動詞を含む具体的な行動を抽出
- scheduledDate: "明日"→"${tomorrow}"、"今日"→現在日、日付部分のみを抽出
- scheduledTime: 
  - 具体的時刻"3時"→"15:00"、"午前9時"→"09:00"
  - 時間帯"午前中"→"morning"、"昼"→"noon"、"午後"→"afternoon"、"夜"→"evening"
  - 時刻が不明確（"明日"だけなど）→ null（この場合インボックスへ）
- deadline: "明日までに"→"${tomorrow}T23:59:00+09:00"、"今週中"→今週日曜の23:59
- durationMinutes: "1時間"→60、"30分"→30、"2時間半"→150、"1.5時間"→90
- category: 買い物→shopping、返信/連絡→reply、業務/会議→work、個人/趣味→personal

【具体例】
入力: "明日の午後2時から1時間ほど会議"
→ title: "会議"、scheduledDate: "${tomorrow}"、scheduledTime: "14:00"、durationMinutes: 60、category: "work"

入力: "明日の午前中に買い物"
→ title: "買い物"、scheduledDate: "${tomorrow}"、scheduledTime: "morning"、category: "shopping"

入力: "明日までにレポートを書く、所要時間3時間"
→ title: "レポートを書く"、deadline: "${tomorrow}T23:59:00+09:00"、durationMinutes: 180、category: "work"

入力: "来週のどこかで会議"
→ title: "会議"、scheduledDate: "${dayAfterTomorrow}"、scheduledTime: null（時刻不明確なのでインボックスへ）

【重要】
- titleは必ず具体的な動作を含む（「（タイトル未定）」は使わない）
- scheduledTimeは時刻が明確な場合のみ設定。不明確な場合はnull（インボックスへ）
- deadlineは常に23:59の時刻で設定
- durationMinutesは数値（分）で出力。nullでも可

【出力形式 - 厳密に遵守】
必ず以下のJSONのみを出力：
{
  "title": "string（具体的な動作）",
  "scheduledDate": "YYYY-MM-DDまたはnull",
  "scheduledTime": "HH:mmまたはmorning/noon/afternoon/eveningまたはnull",
  "deadline": "YYYY-MM-DDTHH:mm:ss+09:00またはnull",
  "durationMinutes": "numberまたはnull",
  "category": "shopping|reply|work|personal|otherまたはnull"
}`;
}
