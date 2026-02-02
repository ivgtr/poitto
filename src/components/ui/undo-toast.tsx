"use client";

import { CSSProperties } from "react";
import { CircleCheckIcon } from "lucide-react";

type UndoVariant = "update" | "complete";

interface UndoToastProps {
  message: string;
  variant: UndoVariant;
  progressClassName: string;
  progressStyle: CSSProperties;
  onUndo: () => void;
}

const ICON_COLOR: Record<UndoVariant, string> = {
  update: "text-blue-600",
  complete: "text-emerald-600",
};

const ACTION_COLOR: Record<UndoVariant, string> = {
  update: "text-blue-600/80 hover:text-blue-700",
  complete: "text-emerald-600/80 hover:text-emerald-700",
};

export function UndoToast({
  message,
  variant,
  progressClassName,
  progressStyle,
  onUndo,
}: UndoToastProps) {
  return (
    <div className="relative flex w-full max-w-[400px] items-start gap-3 rounded-[var(--radius)] border border-[var(--normal-border)] bg-[var(--normal-bg)] p-3 text-[var(--normal-text)] shadow-sm sm:w-[400px]">
      <CircleCheckIcon className={`mt-0.5 h-4 w-4 ${ICON_COLOR[variant]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 line-clamp-2">{message}</p>
      </div>
      <button
        type="button"
        onClick={onUndo}
        className={`text-xs font-semibold ${ACTION_COLOR[variant]}`}
      >
        元に戻す
      </button>
      <div className="pointer-events-none absolute bottom-[2px] left-[2px] right-[2px] h-[2px] overflow-hidden rounded-none">
        <div
          className={`h-full ${progressClassName} toast-progress`}
          style={progressStyle}
        />
      </div>
    </div>
  );
}
