"use client";

import { ReactNode } from "react";

interface KanbanColumnProps {
  title: string;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({ title, count, children }: KanbanColumnProps) {
  return (
    <section className="rounded-2xl border border-gray-200/70 bg-white/80 p-4 shadow-sm md:min-w-[280px] md:max-w-[320px]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          {count}
        </span>
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}
