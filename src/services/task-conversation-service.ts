import { TaskInfo, mapOptionToFieldValue, getFieldOptions, generateQuestion, getNextMissingField, isTaskComplete, isValidTitle, parseTimeFromInput, createJSTScheduledAt } from "@/lib/task-fields";

export interface FieldMappingResult {
  success: boolean;
  field: keyof TaskInfo | null;
  value: TaskInfo[keyof TaskInfo] | null;
  nextField: string | null;
}

// 型ガード: 文字列がTaskInfoのキーかどうかをチェック
function isTaskInfoKey(field: string | null): field is keyof TaskInfo {
  if (!field) return false;
  const validKeys: (keyof TaskInfo)[] = ["title", "category", "deadline", "scheduledAt", "durationMinutes"];
  return validKeys.includes(field as keyof TaskInfo);
}

// 型ガード: 値が特定のTaskInfoフィールドの型かどうかをチェック
function isValidTaskValue<K extends keyof TaskInfo>(
  field: K,
  value: unknown
): value is TaskInfo[K] {
  switch (field) {
    case "title":
    case "category":
    case "deadline":
    case "scheduledAt":
      return value === null || typeof value === "string";
    case "durationMinutes":
      return value === null || typeof value === "number";
    default:
      return false;
  }
}

/**
 * 選択肢をタスクフィールドにマッピングする
 */
export function mapSelectionToField(
  option: string,
  currentField: string | null,
  currentTaskInfo: Partial<TaskInfo>
): FieldMappingResult {
  // 「登録しない」の場合
  if (option === "登録しない") {
    return {
      success: false,
      field: null,
      value: null,
      nextField: null,
    };
  }

  // 「スキップ」の場合
  if (option === "スキップ") {
    const nextField = getNextMissingField(currentTaskInfo, false);
    if (!isTaskInfoKey(currentField)) {
      return {
        success: false,
        field: null,
        value: null,
        nextField: null,
      };
    }
    return {
      success: true,
      field: currentField,
      value: null,
      nextField,
    };
  }

  // 時刻入力の特別処理（scheduledAtフィールド）
  if (currentField === "scheduledAt") {
    const time = parseTimeFromInput(option);
    if (time) {
      const scheduledAt = createJSTScheduledAt(time, 1);
      const updatedTaskInfo = { ...currentTaskInfo, scheduledAt };
      const nextField = getNextMissingField(updatedTaskInfo, false);
      
      return {
        success: true,
        field: "scheduledAt",
        value: scheduledAt,
        nextField,
      };
    }
  }

  // 通常の選択肢マッピング
  if (currentField && isTaskInfoKey(currentField)) {
    const { value, success } = mapOptionToFieldValue(option, currentField);
    
    if (success && isValidTaskValue(currentField, value)) {
      const updatedTaskInfo = { ...currentTaskInfo, [currentField]: value };
      const nextField = getNextMissingField(updatedTaskInfo, false);
      
      return {
        success: true,
        field: currentField,
        value,
        nextField,
      };
    }
  }

  return {
    success: false,
    field: null,
    value: null,
    nextField: null,
  };
}

/**
 * チャット入力を解析して適切なアクションを決定
 */
export function parseChatInput(
  input: string,
  currentField: string | null,
  currentTaskInfo: Partial<TaskInfo>
): {
  type: "selection" | "time_input" | "free_text" | "cancel";
  field?: keyof TaskInfo;
  value?: TaskInfo[keyof TaskInfo] | null;
  nextField?: string | null;
} {
  // 「登録しない」はキャンセル
  if (input === "登録しない") {
    return { type: "cancel" };
  }

  // 「スキップ」の処理
  if (input === "スキップ") {
    const nextField = getNextMissingField(currentTaskInfo, false);
    if (isTaskInfoKey(currentField)) {
      return {
        type: "selection",
        field: currentField,
        value: null,
        nextField,
      };
    }
    return { type: "free_text" };
  }

  // scheduledAtフィールドで時刻入力の可能性をチェック
  if (currentField === "scheduledAt") {
    const time = parseTimeFromInput(input);
    if (time) {
      const scheduledAt = createJSTScheduledAt(time, 1);
      const updatedTaskInfo = { ...currentTaskInfo, scheduledAt };
      const nextField = getNextMissingField(updatedTaskInfo, false);
      
      return {
        type: "time_input",
        field: "scheduledAt",
        value: scheduledAt,
        nextField,
      };
    }
  }

  // その他は自由入力としてLLMに任せる
  return { type: "free_text" };
}

/**
 * 次の質問と選択肢を生成
 */
export function generateNextQuestion(
  taskInfo: Partial<TaskInfo>,
  isInitial: boolean = false
): {
  field: string | null;
  question: string;
  options: string[];
} {
  const nextField = getNextMissingField(taskInfo, isInitial);
  
  if (!nextField) {
    return {
      field: null,
      question: "",
      options: [],
    };
  }

  const fieldOptions = getFieldOptions(nextField);
  const question = generateQuestion(nextField) || `${nextField}を教えてください`;

  return {
    field: nextField,
    question,
    options: [...fieldOptions, "登録しない"],
  };
}

/**
 * タスクが登録可能な状態かチェック
 */
export function canRegisterTask(taskInfo: Partial<TaskInfo>): boolean {
  return isTaskComplete(taskInfo);
}

/**
 * 入力テキストからタイトルを抽出するフォールバック処理
 * LLMがtitleを抽出できなかった場合に使用
 */
export function extractTitleFromInput(input: string): string | null {
  if (!input || input.trim().length === 0) {
    return null;
  }

  const trimmed = input.trim();

  // 「明日」「今日」「来週」などの時間表現を除去
  // 注意：日本語の助詞（に, で, を, が, は）は削除しない（文の意味が壊れるため）
  const timePatterns = [
    /明日/, /今日/, /昨日/, /来逯/, /今週/,
    /\d{1,2}時(?:\d{1,2}分?)?/, /\d{1,2}:\d{2}/,
    /午前/, /午後/, /朝/, /昼/, /夜/
  ];

  let cleaned = trimmed;
  for (const pattern of timePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  cleaned = cleaned.trim();

  // 除去後に意味のある文字列が残っている場合
  if (cleaned.length > 0 && cleaned.length >= 2) {
    return cleaned;
  }

  // 時間表現を除去すると空になった場合は、元の入力をそのまま使用
  if (trimmed.length > 0 && trimmed.length >= 2) {
    return trimmed;
  }

  return null;
}
