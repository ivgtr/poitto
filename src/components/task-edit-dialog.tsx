"use client";

import { useState } from "react";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, X } from "lucide-react";
import { categoryConfig, formatDuration } from "@/lib/task-utils";

interface TaskEditDialogProps {
  task: Task;
  onSave: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
}

export function TaskEditDialog({ task, onSave }: TaskEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState<string>(task.category);
  const [deadline, setDeadline] = useState<string>(
    task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    task.scheduledAt ? new Date(task.scheduledAt).toISOString().split('T')[0] : ''
  );
  const [scheduledTime, setScheduledTime] = useState<string>(
    task.scheduledAt 
      ? new Date(task.scheduledAt).toTimeString().slice(0, 5) 
      : ''
  );
  const [durationMinutes, setDurationMinutes] = useState<string>(
    task.durationMinutes?.toString() || ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    try {
      const data: {
        title: string;
        category: string;
        deadline: Date | null;
        scheduledAt: Date | null;
        durationMinutes: number | null;
      } = {
        title: title.trim(),
        category,
        deadline: deadline ? new Date(deadline) : null,
        scheduledAt: null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
      };

      // 予定日時の設定
      if (scheduledDate && scheduledTime) {
        data.scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      } else if (scheduledDate) {
        data.scheduledAt = new Date(`${scheduledDate}T00:00:00`);
      }

      await onSave(task.id, data);
      setOpen(false);
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDeadline = () => setDeadline('');
  const clearScheduled = () => {
    setScheduledDate('');
    setScheduledTime('');
  };
  const clearDuration = () => setDurationMinutes('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-violet-600"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>タスクを編集</DialogTitle>
        </DialogHeader>
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !title.trim()}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
          >
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
