"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { categoryConfig, formatDuration } from "@/lib/task-utils";

export interface TaskFormProps {
  // Form values
  title: string;
  category: string;
  deadline: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: string;

  // State setters
  setTitle: (value: string) => void;
  setCategory: (value: string) => void;
  setDeadline: (value: string) => void;
  setScheduledDate: (value: string) => void;
  setScheduledTime: (value: string) => void;
  setDurationMinutes: (value: string) => void;

  // Form state
  canSave: boolean;
  isLoading: boolean;

  // Actions
  onSave: () => void;
  onCancel: () => void;
  clearDeadline: () => void;
  clearScheduled: () => void;
  clearDuration: () => void;

  // Customization
  submitLabel: string;
  loadingLabel?: string;
}

export function TaskForm({
  // Form values
  title,
  category,
  deadline,
  scheduledDate,
  scheduledTime,
  durationMinutes,

  // State setters
  setTitle,
  setCategory,
  setDeadline,
  setScheduledDate,
  setScheduledTime,
  setDurationMinutes,

  // Form state
  canSave,
  isLoading,

  // Actions
  onSave,
  onCancel,
  clearDeadline,
  clearScheduled,
  clearDuration,

  // Customization
  submitLabel,
  loadingLabel = "保存中...",
}: TaskFormProps) {
  return (
    <>
      <div className="grid gap-4 py-4">
        {/* タイトル */}
        <div className="grid gap-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タスクのタイトル"
          />
        </div>

        {/* カテゴリ */}
        <div className="grid gap-2">
          <Label htmlFor="category">カテゴリ</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 期限 */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="deadline">期限</Label>
            {deadline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDeadline}
                className="h-6 px-2 text-gray-400 hover:text-red-600"
              >
                <X className="h-3 w-3 mr-1" />
                クリア
              </Button>
            )}
          </div>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {/* 予定日時 */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>予定日時</Label>
            {(scheduledDate || scheduledTime) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearScheduled}
                className="h-6 px-2 text-gray-400 hover:text-red-600"
              >
                <X className="h-3 w-3 mr-1" />
                クリア
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="flex-1"
            />
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        {/* 所要時間 */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="duration">所要時間（分）</Label>
            {durationMinutes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDuration}
                className="h-6 px-2 text-gray-400 hover:text-red-600"
              >
                <X className="h-3 w-3 mr-1" />
                クリア
              </Button>
            )}
          </div>
          <Input
            id="duration"
            type="number"
            min="0"
            step="5"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="例: 30"
          />
          {durationMinutes && (
            <p className="text-xs text-gray-500">
              {formatDuration(parseInt(durationMinutes, 10))}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button
          onClick={onSave}
          disabled={!canSave}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        >
          {isLoading ? loadingLabel : submitLabel}
        </Button>
      </div>
    </>
  );
}
