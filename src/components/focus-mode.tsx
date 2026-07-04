"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatDuration,
  getDeadlineUrgency,
  getTrackedMs,
  getTrackedMsInRange
} from "@/lib/task-utils";
import type { ClientRecord, Task, TaskDraft } from "@/types/task";

type ChecklistItem = {
  text: string;
  done: boolean;
};

type FocusModeProps = {
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onSetStatus: (id: string, status: Task["status"]) => void;
  onUpdateTaskFields: (id: string, patch: Partial<TaskDraft>) => void;
  clients: ClientRecord[];
};

export function FocusMode({
  task,
  onClose,
  onEdit,
  onSetStatus,
  onUpdateTaskFields,
  clients
}: FocusModeProps) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [nextStep, setNextStep] = useState("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  useEffect(() => {
    if (!task) {
      return;
    }

    setNextStep(task.nextStep);
    setChecklistItems(task.focusChecklist.map(parseChecklistItem));
  }, [task]);

  useEffect(() => {
    setNowMs(Date.now());

    if (!task?.activeTimerStartedAt) {
      return;
    }

    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [task?.activeTimerStartedAt]);

  useEffect(() => {
    if (!task) {
      return;
    }

    const activeTask = task;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (isTyping) {
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        onSetStatus(activeTask.id, activeTask.activeTimerStartedAt ? "Waiting" : "In Progress");
      }

      if (event.key === "Enter") {
        event.preventDefault();
        onSetStatus(activeTask.id, "Done");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onSetStatus, task]);

  const focusStats = useMemo(() => {
    if (!task) {
      return null;
    }

    const stableNowMs = nowMs ?? new Date(task.activeTimerStartedAt || task.statusChangedAt).getTime();
    const now = new Date(stableNowMs);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sessionMs = task.activeTimerStartedAt
      ? Math.max(0, stableNowMs - new Date(task.activeTimerStartedAt).getTime())
      : 0;
    const totalMs = getTrackedMs(task, stableNowMs);
    const todayMs = getTrackedMsInRange([task], dayStart, stableNowMs);

    return {
      sessionMs,
      totalMs,
      todayMs,
      remaining: getRemainingEstimate(task.estimatedTime, totalMs)
    };
  }, [nowMs, task]);

  if (!task || !focusStats) {
    return null;
  }

  const deadlineUrgency = getDeadlineUrgency(task.deadline);
  const sessionState = getSessionState(task);

  function saveFocusFields(items = checklistItems) {
    if (!task) {
      return;
    }

    onUpdateTaskFields(task.id, {
      nextStep: nextStep.trim(),
      focusChecklist: serializeChecklist(items)
    });
  }

  function updateChecklistItem(index: number, patch: Partial<ChecklistItem>) {
    setChecklistItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  }

  function toggleChecklistItem(index: number, done: boolean) {
    const nextItems = checklistItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, done } : item
    );
    setChecklistItems(nextItems);
    saveFocusFields(nextItems);
  }

  function removeChecklistItem(index: number) {
    const nextItems = checklistItems.filter((_, itemIndex) => itemIndex !== index);
    setChecklistItems(nextItems);
    saveFocusFields(nextItems);
  }

  function addChecklistItem() {
    const text = newChecklistItem.trim();

    if (!text) {
      return;
    }

    const nextItems = [...checklistItems, { text, done: false }];
    setChecklistItems(nextItems);
    setNewChecklistItem("");
    saveFocusFields(nextItems);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex h-dvh max-h-dvh items-center justify-center overflow-hidden bg-black/80 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-5"
      onClick={onClose}
    >
      <section
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-[48rem] overflow-y-auto rounded-lg border border-sky-300/25 bg-deck-900 p-5 shadow-2xl shadow-black sm:max-h-[calc(100dvh-2.5rem)] md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">
              Focus Mode
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-white lg:text-4xl">
              {task.title}
            </h2>
            <ClientIdentity task={task} clients={clients} />
          </div>
          <button
            type="button"
            aria-label="Close focus mode"
            title="Close focus mode"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 text-xl font-black text-slate-300 hover:border-sky-300/50 hover:text-white"
          >
            x
          </button>
        </div>

        <div className="reflective-clock mt-5 rounded-lg border border-sky-200/35 p-4">
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">
                Current Session
              </p>
              <p className="reflective-clock-text mt-2 font-mono text-6xl font-black leading-none tabular-nums md:text-7xl">
                {formatDuration(focusStats.sessionMs)}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ring-1 ${sessionState.className}`}
            >
              {sessionState.label}
            </span>
          </div>
          <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-3">
            <CompactStat label="Today" value={formatDuration(focusStats.todayMs)} />
            <CompactStat label="Total" value={formatDuration(focusStats.totalMs)} />
            <CompactStat label="Remaining est." value={focusStats.remaining} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {deadlineUrgency ? (
            <span className={`rounded-full px-3 py-1.5 text-sm font-black ring-1 ${deadlineUrgency.className}`}>
              {deadlineUrgency.label}
            </span>
          ) : null}
          <SmallBadge label="Priority" value={task.priority} />
          <SmallBadge label="Status" value={task.status} />
          <SmallBadge label="Estimate" value={task.estimatedTime} />
          {task.category === "To Invoice" ? <SmallBadge label="Invoice" value={task.invoiceStatus} /> : null}
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Next Step
          </span>
          <input
            value={nextStep}
            onChange={(event) => setNextStep(event.target.value)}
            onBlur={() => saveFocusFields()}
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-lg font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-300/50"
            placeholder="What is the next concrete action?"
          />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Focus Checklist
            </span>
            <div className="mt-2 min-h-36 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              {checklistItems.length > 0 ? (
                <div className="space-y-2">
                  {checklistItems.map((item, index) => (
                    <div
                      key={`${item.text}-${index}`}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md bg-black/15 px-2 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={(event) => toggleChecklistItem(index, event.target.checked)}
                        className="h-4 w-4 accent-sky-300"
                      />
                      <input
                        value={item.text}
                        onChange={(event) => updateChecklistItem(index, { text: event.target.value })}
                        onBlur={() => saveFocusFields()}
                        className={`min-w-0 bg-transparent text-sm font-semibold outline-none ${
                          item.done ? "text-slate-500 line-through" : "text-slate-100"
                        }`}
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${item.text}`}
                        onClick={() => removeChecklistItem(index)}
                        className="rounded px-2 py-1 text-xs font-black text-slate-500 hover:bg-white/10 hover:text-slate-200"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-white/10 px-3 py-4 text-sm font-semibold text-slate-500">
                  Add concrete focus steps for this task.
                </p>
              )}
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <input
                  value={newChecklistItem}
                  onChange={(event) => setNewChecklistItem(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addChecklistItem();
                    }
                  }}
                  className="rounded-md border border-white/10 bg-deck-950 px-3 py-2 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-sky-300/50"
                  placeholder="Add checklist item"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="rounded-md border border-sky-300/20 px-3 py-2 text-sm font-black text-sky-100 hover:border-sky-300/50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Notes
            </p>
            <p className="mt-2 min-h-36 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-base leading-relaxed text-slate-200">
              {task.notes || "No notes yet."}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onSetStatus(task.id, task.activeTimerStartedAt ? "Waiting" : "In Progress")}
            className="rounded-md bg-sky-300 px-6 py-3 text-base font-black text-slate-950 hover:bg-sky-200"
          >
            {task.activeTimerStartedAt ? "Break" : "Start Focus"}
          </button>
          <button
            type="button"
            onClick={() => onSetStatus(task.id, "Done")}
            className="rounded-md border border-emerald-300/25 bg-emerald-300/12 px-5 py-3 font-black text-emerald-100 hover:border-emerald-300/50"
          >
            Complete
          </button>
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded-md border border-white/10 px-5 py-3 font-black text-slate-200 hover:border-sky-300/50"
          >
            Edit Details
          </button>
          <p className="ml-auto rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300">
            Space start/break | Enter complete | Esc close
          </p>
        </div>
      </section>
    </div>
  );
}

function parseChecklistItem(item: string): ChecklistItem {
  const trimmed = item.trim();

  if (/^\[x\]\s+/i.test(trimmed)) {
    return { text: trimmed.replace(/^\[x\]\s+/i, ""), done: true };
  }

  return { text: trimmed.replace(/^\[\s\]\s+/i, ""), done: false };
}

function serializeChecklist(items: ChecklistItem[]) {
  return items
    .map((item) => ({ text: item.text.trim(), done: item.done }))
    .filter((item) => item.text)
    .map((item) => (item.done ? `[x] ${item.text}` : item.text));
}

function ClientIdentity({ task, clients }: { task: Task; clients: ClientRecord[] }) {
  const client = clients.find((item) => item.name.toLowerCase() === task.client.toLowerCase());
  const logoUrl = client?.logoUrl || task.clientLogoUrl;
  const clientName = client?.name || task.client;

  if (logoUrl) {
    return (
      <div className="mt-3 flex h-10 max-w-40 items-center" title={clientName}>
        <img
          src={logoUrl}
          alt={`${clientName} logo`}
          className="max-h-10 max-w-full object-contain"
        />
      </div>
    );
  }

  return <p className="mt-1 text-base font-semibold text-slate-300">{clientName}</p>;
}

function getSessionState(task: Task) {
  if (task.activeTimerStartedAt) {
    return {
      label: "Working",
      className: "bg-sky-300/15 text-sky-100 ring-sky-300/30"
    };
  }

  if (task.status === "Waiting") {
    return {
      label: "On Break",
      className: "bg-amber-300/15 text-amber-100 ring-amber-300/30"
    };
  }

  return {
    label: "Idle",
    className: "bg-white/[0.06] text-slate-300 ring-white/10"
  };
}

function getRemainingEstimate(estimate: string, trackedMs: number) {
  const range = estimate.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*(hr|hrs|hour|hours|min|mins|minute|minutes)/i);

  if (!range) {
    return "-";
  }

  const upperValue = Number(range[2] || range[1]);
  const unit = range[3].toLowerCase();
  const estimateMs = unit.startsWith("h") ? upperValue * 3600000 : upperValue * 60000;
  const remainingMs = Math.max(0, estimateMs - trackedMs);

  return formatDuration(remainingMs);
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-sm font-black text-sky-100">{value}</p>
    </div>
  );
}

function SmallBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-sm font-bold text-slate-200 ring-1 ring-white/10">
      <span className="mr-1 text-xs uppercase tracking-[0.12em] text-slate-500">{label}</span>
      {value}
    </span>
  );
}
