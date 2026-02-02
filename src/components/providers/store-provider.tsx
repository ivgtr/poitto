"use client";

import { ReactNode } from "react";

interface StoreProviderProps {
  children: ReactNode;
}

/**
 * StoreProvider
 * 
 * ZustandはContextを使用しないため、このProviderは現在機能的には不要です。
 * しかし、将来的な拡張（persistミドルウェア、オフライン対応等）のために
 * 準備として配置しています。
 * 
 * TODO(Phase C): オフライン対応時にpersistミドルウェアを有効化
 */
export function StoreProvider({ children }: StoreProviderProps) {
  return <>{children}</>;
}
