import { categories, priorities, type Category, type Priority, type Task, type TimeEntry } from "@/types/task";

const priorityRank: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Backlog: 4
};

const categoryFocusRank: Record<Category, number> = {
  Deadline: 0,
  "To Invoice": 1,
  "Client Delivery": 2,
  Admin: 3,
  Systems: 4,
  Future: 5
};

const priorityAccent: Record<Priority, string> = {
  Critical: "border-red-400/70 bg-red-950/35 text-red-100 shadow-critical",
  High: "border-orange-300/45 bg-orange-950/20 text-orange-100",
  Medium: "border-sky-300/35 bg-sky-950/15 text-sky-100",
  Low: "border-slate-500/40 bg-slate-900/55 text-slate-100",
  Backlog: "border-violet-300/30 bg-violet-950/15 text-violet-100"
};

const categoryAccent: Record<Category, string> = {
  "To Invoice": "bg-emerald-400/12 text-emerald-200 ring-emerald-300/20",
  "Client Delivery": "bg-cyan-400/12 text-cyan-200 ring-cyan-300/20",
  Deadline: "bg-red-400/12 text-red-200 ring-red-300/20",
  Admin: "bg-amber-400/12 text-amber-200 ring-amber-300/20",
  Systems: "bg-indigo-400/12 text-indigo-200 ring-indigo-300/20",
  Future: "bg-fuchsia-400/12 text-fuchsia-200 ring-fuchsia-300/20"
};

export function taskSort(a: Task, b: Task) {
  return (
    priorityRank[a.priority] - priorityRank[b.priority] ||
    a.sortOrder - b.sortOrder ||
    categoryFocusRank[a.category] - categoryFocusRank[b.category] ||
    a.title.localeCompare(b.title)
  );
}

export function todayFocusSort(a: Task, b: Task) {
  const aDeadline = a.deadline ? 0 : 1;
  const bDeadline = b.deadline ? 0 : 1;

  return (
    aDeadline - bDeadline ||
    categoryFocusRank[a.category] - categoryFocusRank[b.category] ||
    priorityRank[a.priority] - priorityRank[b.priority] ||
    a.title.localeCompare(b.title)
  );
}

export function getPriorityAccent(priority: Priority) {
  return priorityAccent[priority];
}

export function getCategoryAccent(category: Category) {
  return categoryAccent[category];
}

export function movePriority(priority: Priority, direction: "up" | "down"): Priority {
  const current = priorities.indexOf(priority);
  const next = direction === "up" ? Math.max(0, current - 1) : Math.min(priorities.length - 1, current + 1);
  return priorities[next];
}

export function getUpcomingDeadlines(tasks: Task[]) {
  return tasks
    .filter((task) => task.status !== "Done" && task.deadline)
    .sort(todayFocusSort);
}

export function getToInvoiceTasks(tasks: Task[]) {
  return tasks
    .filter((task) => task.status !== "Done" && task.category === "To Invoice")
    .sort(taskSort);
}

export function getWeeklyFocus(tasks: Task[]) {
  const active = tasks.filter((task) => task.status !== "Done");
  const critical = active.filter((task) => task.priority === "Critical").length;
  const toInvoice = active.filter((task) => task.category === "To Invoice").length;
  const delivery = active.filter((task) => task.category === "Client Delivery").length;

  return `${critical} critical / ${toInvoice} to invoice / ${delivery} delivery`;
}

export function getTrackedMs(task: Task, nowMs = Date.now()) {
  const logged = task.timeEntries.reduce((total, entry) => total + entry.durationMs, 0);
  const active = task.activeTimerStartedAt
    ? Math.max(0, nowMs - new Date(task.activeTimerStartedAt).getTime())
    : 0;

  return logged + active;
}

export function getTrackedMsInRange(tasks: Task[], rangeStartMs: number, rangeEndMs: number) {
  return tasks.reduce((taskTotal, task) => {
    const logged = task.timeEntries.reduce((entryTotal, entry) => {
      const startedAt = new Date(entry.startedAt).getTime();
      const endedAt = entry.endedAt ? new Date(entry.endedAt).getTime() : startedAt + entry.durationMs;
      const overlapStart = Math.max(startedAt, rangeStartMs);
      const overlapEnd = Math.min(endedAt, rangeEndMs);

      return entryTotal + Math.max(0, overlapEnd - overlapStart);
    }, 0);
    const active = task.activeTimerStartedAt
      ? Math.max(
          0,
          rangeEndMs -
            Math.max(new Date(task.activeTimerStartedAt).getTime(), rangeStartMs)
        )
      : 0;

    return taskTotal + logged + active;
  }, 0);
}

export function formatDuration(totalMs: number) {
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }

  return `${seconds}s`;
}

export type TimeLogEntry = TimeEntry & {
  taskId: string;
  taskTitle: string;
  client: string;
  clientLogoUrl?: string;
  category: Category;
};

export function getTimeLog(tasks: Task[]) {
  return tasks
    .flatMap((task) =>
      task.timeEntries.map((entry) => ({
        ...entry,
        taskId: task.id,
        taskTitle: task.title,
        client: task.client,
        clientLogoUrl: task.clientLogoUrl,
        category: task.category
      }))
    )
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function formatAge(isoDate: string, nowMs = Date.now()) {
  const ageMs = Math.max(0, nowMs - new Date(isoDate).getTime());
  const days = Math.floor(ageMs / 86400000);
  const hours = Math.floor((ageMs % 86400000) / 3600000);

  if (days > 0) {
    return `${days}d`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return "new";
}

export function getDeadlineUrgency(deadline?: string) {
  if (!deadline) {
    return null;
  }

  const parsed = Date.parse(deadline);
  if (Number.isNaN(parsed)) {
    return { label: `Due ${deadline}`, className: "bg-red-300/10 text-red-100 ring-red-300/20" };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.floor((parsed - startOfToday) / 86400000);

  if (diffDays < 0) {
    return { label: "Overdue", className: "bg-red-500/20 text-red-100 ring-red-300/30" };
  }

  if (diffDays === 0) {
    return { label: "Due Today", className: "bg-red-400/18 text-red-100 ring-red-300/30" };
  }

  if (diffDays === 1) {
    return { label: "Due Tomorrow", className: "bg-amber-300/15 text-amber-100 ring-amber-300/25" };
  }

  if (diffDays <= 7) {
    return { label: `Due in ${diffDays}d`, className: "bg-amber-300/12 text-amber-100 ring-amber-300/20" };
  }

  return { label: `Due ${deadline}`, className: "bg-white/[0.07] text-slate-200 ring-white/10" };
}

export { categories, priorities };
