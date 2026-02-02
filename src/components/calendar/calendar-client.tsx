"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { ChatContainer } from "@/components/chat";
import { CalendarDayView } from "@/components/calendar/calendar-day-view";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import { CalendarWeekView } from "@/components/calendar/calendar-week-view";
import { MobileNav } from "@/components/home/mobile-nav";
import { Sidebar } from "@/components/home/sidebar";
import { useTaskCreation } from "@/hooks/use-task-creation";
import { useTaskStore } from "@/stores/task-store";
import { normalizeCategory } from "@/lib/task-utils";
import { Task } from "@/types/task";

type ViewMode = "home" | "calendar" | "chat" | "done";
type CalendarViewMode = "day" | "week" | "month";

interface CalendarClientProps {
  userId: string;
  userName?: string;
  initialTasks: Task[];
}

export function CalendarClient({ userId, initialTasks }: CalendarClientProps) {
  const [activeView, setActiveView] = useState<ViewMode>("calendar");
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Zustand Store
  const { initializeTasks, updateTask, completeTask, tasks } = useTaskStore();
  
  // Initialize store with server data
  useEffect(() => {
    initializeTasks(initialTasks);
  }, [initialTasks, initializeTasks]);
  
  // Get scheduled tasks from store (scheduled + done with scheduledAt)
  // Filter inside component to avoid server/client mismatch
  const scheduledTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (t.status === "scheduled" || t.status === "done") &&
          (t.scheduledAt || t.scheduledDate)
      ),
    [tasks]
  );

  const {
    isLoading,
    messages,
    sendMessage,
    selectOption,
    clearSession,
  } = useTaskCreation({
    userId,
    onTaskCreated: () => {
      // Task creation now handled by sidebar/store
    },
  });

  const handleChatOpenChange = useCallback((open: boolean) => {
    setIsChatOpen(open);
  }, []);

  const handleNewChat = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const handleEditTask = useCallback(
    async (
      taskId: string,
      data: {
        title: string;
        category: string;
        deadline?: Date | null;
        scheduledDate?: string | null;
        scheduledAt?: Date | null;
        durationMinutes?: number | null;
      }
    ) => {
      await updateTask(taskId, {
        title: data.title,
        category: normalizeCategory(data.category),
        deadline: data.deadline,
        scheduledDate: data.scheduledDate,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
      });
    },
    [updateTask]
  );

  const handleSelectDate = useCallback((date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setViewMode("day");
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      <Sidebar activeView={activeView} onViewChange={setActiveView} userId={userId} />

      <main className="flex-1 flex flex-col md:fixed md:top-0 md:right-0 md:left-64 md:bottom-0 md:h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between bg-white border-b px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            poitto
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <CalendarHeader
              selectedDate={selectedDate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onDateChange={setSelectedDate}
            />

            {viewMode === "day" && (
              <CalendarDayView
                tasks={scheduledTasks}
                selectedDate={selectedDate}
                onComplete={completeTask}
                onUpdate={handleEditTask}
              />
            )}

            {viewMode === "week" && (
              <CalendarWeekView
                tasks={scheduledTasks}
                selectedDate={selectedDate}
                onComplete={completeTask}
                onUpdate={handleEditTask}
              />
            )}

            {viewMode === "month" && (
              <CalendarMonthView
                tasks={scheduledTasks}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            )}
          </div>
        </div>
      </main>

      <ChatContainer
        isOpen={isChatOpen}
        onOpenChange={handleChatOpenChange}
        messages={messages}
        onSendMessage={sendMessage}
        onSelectOption={(option) => selectOption(option)}
        onCancel={() => {}}
        isLoading={isLoading}
        onNewChat={handleNewChat}
      />

      <MobileNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}
