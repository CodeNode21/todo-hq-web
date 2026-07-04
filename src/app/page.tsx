"use client";

import { useEffect, useMemo, useState } from "react";
import { BoardHeader } from "@/components/board-header";
import { FilterBar } from "@/components/filter-bar";
import { FocusMode } from "@/components/focus-mode";
import { PriorityBoard } from "@/components/priority-board";
import { SidePanels } from "@/components/side-panels";
import { TaskModal } from "@/components/task-modal";
import { useTasks } from "@/hooks/use-tasks";
import {
  categories,
  formatDuration,
  getTrackedMs,
  getTrackedMsInRange,
  getWeeklyFocus,
  taskSort
} from "@/lib/task-utils";
import type { Category, Task, TaskDraft } from "@/types/task";

export default function Home() {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    setStatus,
    setPriority,
    toggleToday,
    updateTaskFields,
    reorderTask,
    importTasks,
    resetSeedData,
    clients,
    setClientLogo
  } = useTasks();
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [hideCompleted, setHideCompleted] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => task.activeTimerStartedAt || (categoryFilter === "All" ? true : task.category === categoryFilter))
      .filter((task) => task.activeTimerStartedAt || (hideCompleted ? task.status !== "Done" : true))
      .sort(taskSort);
  }, [categoryFilter, hideCompleted, tasks]);

  const weeklyFocus = useMemo(() => getWeeklyFocus(tasks), [tasks]);
  const runningTask = useMemo(
    () => tasks.find((task) => task.activeTimerStartedAt),
    [tasks]
  );

  useEffect(() => {
    setNowMs(Date.now());

    if (!runningTask) {
      return;
    }

    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [runningTask]);

  useEffect(() => {
    setLastSavedAt(new Date());
  }, [tasks]);

  useEffect(() => {
    if (!focusTask) {
      return;
    }

    const latestFocusTask = tasks.find((task) => task.id === focusTask.id);
    setFocusTask(latestFocusTask || null);
  }, [focusTask?.id, tasks]);

  const stats = useMemo(() => {
    if (!nowMs) {
      return {
        dayMs: 0,
        monthMs: 0
      };
    }

    const now = new Date(nowMs);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return {
      dayMs: getTrackedMsInRange(tasks, dayStart, nowMs),
      monthMs: getTrackedMsInRange(tasks, monthStart, nowMs)
    };
  }, [nowMs, tasks]);

  function openAddTask() {
    setEditingTask(null);
    setIsModalOpen(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  function saveTask(draft: TaskDraft) {
    if (editingTask) {
      updateTask(editingTask.id, draft);
    } else {
      addTask(draft);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  }

  function exportBackup() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), tasks, clients }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `todayhq-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportTimeSummary() {
    const rows = tasks
      .map((task) => {
        const totalMs = getTrackedMs(task, nowMs ?? undefined);
        const sessions = task.timeEntries.length + (task.activeTimerStartedAt ? 1 : 0);

        return {
          title: task.title,
          client: task.client,
          category: task.category,
          invoiceStatus: task.invoiceStatus,
          status: task.status,
          sessions,
          tracked: formatDuration(totalMs),
          trackedMs: totalMs
        };
      })
      .filter((row) => row.trackedMs > 0)
      .sort((a, b) => b.trackedMs - a.trackedMs);

    const csv = [
      ["Task", "Client", "Category", "Invoice Status", "Status", "Sessions", "Tracked", "Tracked ms"],
      ...rows.map((row) => [
        row.title,
        row.client,
        row.category,
        row.invoiceStatus,
        row.status,
        String(row.sessions),
        row.tracked,
        String(row.trackedMs)
      ])
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `todayhq-time-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text) as { tasks?: Task[]; clients?: typeof clients } | Task[];
    importTasks(Array.isArray(parsed) ? parsed : parsed.tasks || [], Array.isArray(parsed) ? [] : parsed.clients || []);
  }

  function deleteTaskWithConfirmation(id: string) {
    const task = tasks.find((item) => item.id === id);
    const label = task ? `"${task.title}"` : "this task";

    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deleteTask(id);
    }
  }

  function resetSeedDataWithConfirmation() {
    if (window.confirm("Reset seed data? This replaces your current local task list.")) {
      resetSeedData();
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,.11),transparent_32rem),linear-gradient(135deg,#070a0f,#101722_58%,#070a0f)] px-2 py-2 text-slate-100 sm:px-3 sm:py-3 2xl:h-screen 2xl:overflow-hidden 3xl:px-4 3xl:py-4 4xl:px-5 4xl:py-5">
      <div className="mx-auto flex h-full w-full max-w-[1900px] flex-col 3xl:max-w-none">
        <BoardHeader
          weeklyFocus={weeklyFocus}
          runningTask={runningTask}
          dayMs={stats.dayMs}
          monthMs={stats.monthMs}
          onAddTask={openAddTask}
          onSetStatus={setStatus}
          onFocusTask={setFocusTask}
        />

        <FilterBar
          categories={categories}
          categoryFilter={categoryFilter}
          hideCompleted={hideCompleted}
          saveStatus={
            lastSavedAt
              ? `Saved locally ${lastSavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : "Saved locally"
          }
          onAddTask={addTask}
          onCategoryFilterChange={setCategoryFilter}
          onHideCompletedChange={setHideCompleted}
          onExportData={exportBackup}
          onExportTimeSummary={exportTimeSummary}
          onImportData={importBackup}
          onResetSeedData={resetSeedDataWithConfirmation}
          clients={clients}
        />

        <section className="grid min-h-0 flex-1 gap-2 2xl:grid-cols-[minmax(0,1fr)_340px] 3xl:grid-cols-[minmax(0,1fr)_minmax(400px,.24fr)] 3xl:gap-3 4xl:grid-cols-[minmax(0,1fr)_minmax(500px,.24fr)] 4xl:gap-4">
          <PriorityBoard
            tasks={visibleTasks}
            onEdit={openEditTask}
            onDelete={deleteTaskWithConfirmation}
            onSetPriority={setPriority}
            onSetStatus={setStatus}
            onToggleToday={toggleToday}
            onFocus={setFocusTask}
            onReorderTask={reorderTask}
            clients={clients}
            onSetClientLogo={setClientLogo}
          />
          <SidePanels tasks={tasks} clients={clients} onEdit={openEditTask} onFocus={setFocusTask} onSetStatus={setStatus} />
        </section>
      </div>

      <TaskModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={saveTask}
        clients={clients}
      />

      <FocusMode
        task={focusTask}
        onClose={() => setFocusTask(null)}
        onEdit={(task) => {
          setFocusTask(null);
          openEditTask(task);
        }}
        onSetStatus={setStatus}
        onUpdateTaskFields={updateTaskFields}
        clients={clients}
      />
    </main>
  );
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
