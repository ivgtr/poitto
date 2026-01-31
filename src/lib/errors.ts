/**
 * Application Error Types
 * 統一されたエラー型定義
 */

export enum ErrorCode {
  // Validation Errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Not Found Errors
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // External Service Errors
  LLM_API_ERROR = 'LLM_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string; // ユーザー向けメッセージ（日本語）
  details?: string;
}

export class ApplicationError extends Error implements AppError {
  code: ErrorCode;
  userMessage: string;
  details?: string;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    details?: string
  ) {
    super(message);
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
    this.name = 'ApplicationError';

    // Make properties enumerable for JSON serialization
    Object.defineProperty(this, 'message', { value: message, enumerable: true });
    Object.defineProperty(this, 'code', { value: code, enumerable: true });
    Object.defineProperty(this, 'userMessage', { value: userMessage, enumerable: true });
    if (details !== undefined) {
      Object.defineProperty(this, 'details', { value: details, enumerable: true });
    }
  }
}

// ユーティリティ関数
export function createError(
  code: ErrorCode,
  message: string,
  details?: string
): ApplicationError {
  const userMessage = getUserMessage(code);
  return new ApplicationError(code, message, userMessage, details);
}

function getUserMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.INVALID_INPUT]: '入力内容を確認してください',
    [ErrorCode.MISSING_REQUIRED_FIELD]: '必要な情報が入力されていません',
    [ErrorCode.TASK_NOT_FOUND]: 'タスクが見つかりません',
    [ErrorCode.USER_NOT_FOUND]: 'ユーザーが見つかりません',
    [ErrorCode.LLM_API_ERROR]: 'タスクの解析に失敗しました。もう一度お試しください',
    [ErrorCode.DATABASE_ERROR]: 'データの保存に失敗しました',
    [ErrorCode.UNAUTHORIZED]: 'ログインが必要です',
    [ErrorCode.FORBIDDEN]: 'アクセス権限がありません',
    [ErrorCode.UNKNOWN_ERROR]: 'エラーが発生しました',
  };
  return messages[code] || 'エラーが発生しました';
}

// エラーハンドリングヘルパー
export function handleError(error: unknown): AppError {
  if (error instanceof ApplicationError) {
    return error;
  }

  if (error instanceof Error) {
    return createError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      error.stack
    );
  }

  return createError(
    ErrorCode.UNKNOWN_ERROR,
    'Unknown error occurred',
    String(error)
  );
}

// Server Actions用のエラーレスポンス
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: AppError;
}

export function success<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function failure(error: AppError): ActionResult<never> {
  return { success: false, error };
}
