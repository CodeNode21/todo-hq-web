"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatDuration, getTrackedMs } from "@/lib/task-utils";
import type { Task } from "@/types/task";

function formatHeaderDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(date);
}

type BoardHeaderProps = {
  weeklyFocus: string;
  runningTask?: Task;
  dayMs: number;
  monthMs: number;
  onAddTask: () => void;
  onSetStatus: (id: string, status: Task["status"]) => void;
  onFocusTask: (task: Task) => void;
};

export function BoardHeader({
  weeklyFocus,
  runningTask,
  dayMs,
  monthMs,
  onAddTask,
  onSetStatus,
  onFocusTask
}: BoardHeaderProps) {
  const [date, setDate] = useState(() => formatHeaderDate(new Date()));
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    function updateDate() {
      setDate(formatHeaderDate(new Date()));
    }

    updateDate();
    const interval = window.setInterval(updateDate, 60000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="grid gap-3 rounded-lg border border-white/10 bg-deck-900/80 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur sm:px-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center 3xl:grid-cols-[minmax(360px,1fr)_auto_minmax(360px,1fr)] 3xl:px-6 3xl:py-4">
      <div className="order-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-black tracking-[0.2em] text-sky-200/75">
            to-do hq
          </h1>
          <button
            type="button"
            aria-label="About this demo"
            title="About this demo"
            onClick={() => setIsAboutOpen(true)}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-sky-200/35 bg-sky-300/[0.1] text-3xl font-black text-sky-100 shadow-lg shadow-sky-950/30 transition hover:border-sky-200/70 hover:bg-sky-300/20"
          >
            ?
          </button>
        </div>
        <p suppressHydrationWarning className="mt-1 text-3xl font-bold tracking-normal text-white md:text-4xl 3xl:text-5xl">
          {date}
        </p>
      </div>

      <div className="order-3 flex min-w-0 flex-wrap items-center justify-center gap-3 lg:order-2 lg:flex-nowrap 3xl:gap-4">
        <LiveClock />
        <div className="hidden flex-col gap-2 xl:flex 3xl:gap-3">
          <StatPill label="Today" value={formatDuration(dayMs)} />
          <StatPill label="Month" value={formatDuration(monthMs)} />
        </div>
        <ActiveTaskPanel task={runningTask} onSetStatus={onSetStatus} onFocusTask={onFocusTask} />
      </div>

      <div className="order-2 flex flex-col gap-2 sm:flex-row sm:items-center lg:order-3 lg:justify-end 3xl:gap-3">
        <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 3xl:px-4 3xl:py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Weekly Focus</p>
          <p className="mt-1 text-base font-semibold text-slate-100 3xl:text-lg">{weeklyFocus}</p>
        </div>
        <button
          type="button"
          onClick={onAddTask}
          className="rounded-md bg-sky-300 px-4 py-3 text-base font-bold text-slate-950 transition hover:bg-sky-200 3xl:px-5 3xl:py-4 3xl:text-lg"
        >
          Add Task
        </button>
      </div>

      {isAboutOpen ? <AboutDemoModal onClose={() => setIsAboutOpen(false)} /> : null}
    </header>
  );
}

function AboutDemoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 px-4 py-5 backdrop-blur-md sm:px-6 sm:py-8"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-demo-title"
        className="max-h-[calc(100dvh-2.5rem)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-sky-300/25 bg-deck-900 p-5 shadow-[0_30px_100px_rgba(0,0,0,.8)] sm:max-h-[calc(100dvh-4rem)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-200/70">Interactive demo</p>
            <h2 id="about-demo-title" className="mt-1 text-3xl font-black text-white sm:text-4xl">
              to-do HQ demonstration
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
              A hands-on showcase of a priority-based dashboard for organizing work, tracking time,
              and maintaining focus.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close about dialog"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-lg font-black text-slate-300 hover:border-sky-300/50 hover:text-white"
          >
            X
          </button>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <InfoPanel title="How to use the demo" accent="sky">
            <ul className="space-y-2">
              <li>• Add a task or edit any sample card.</li>
              <li>• Press Play to track time and Break to pause.</li>
              <li>• Move cards between priority columns.</li>
              <li>• Pin tasks to Today Focus or open Focus Mode.</li>
              <li>• Complete, delete, import, or export tasks.</li>
            </ul>
          </InfoPanel>

          <InfoPanel title="Temporary browser workspace" accent="emerald">
            <p>
              Cards are stored locally in this browser only. They are not uploaded, synced to an
              account, or saved in a server database. Each browser and device has a separate workspace.
            </p>
            <p className="mt-3 text-slate-400">
              Create, change, and delete anything while exploring. Use <strong className="text-slate-200">Reset Seed Data</strong> to
              discard temporary changes and restore the original sample board.
            </p>
          </InfoPanel>
        </div>

        <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.08] p-5">
          <h3 className="font-black text-amber-50">Demo data and disclaimer</h3>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/85 sm:text-base">
            The projects, clients, tasks, deadlines, invoices, and time entries shown here are sample
            data created only to demonstrate the app. They do not represent active client work.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/70 sm:text-base">
            This public demo is not permanent or confidential storage. Do not enter passwords, payment
            information, private client details, health information, or other sensitive data. Local
            browser data can be cleared or lost at any time.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-sky-300 px-5 py-3.5 text-base font-black text-slate-950 transition hover:bg-sky-200"
        >
          Explore the demo
        </button>
      </section>
    </div>,
    document.body
  );
}

function InfoPanel({
  title,
  accent,
  children
}: {
  title: string;
  accent: "sky" | "emerald";
  children: React.ReactNode;
}) {
  const colors =
    accent === "sky"
      ? "border-sky-300/15 bg-sky-300/[0.05] [&>h3]:text-sky-100"
      : "border-emerald-300/15 bg-emerald-300/[0.05] [&>h3]:text-emerald-100";

  return (
    <div className={`rounded-xl border p-5 ${colors}`}>
      <h3 className="text-lg font-black">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">{children}</div>
    </div>
  );
}

function AboutDemoModalLegacy({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-demo-title"
        className="h-dvh w-screen overflow-y-auto bg-deck-900 px-5 py-6 shadow-2xl shadow-black/60 sm:px-8 sm:py-10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-200/70">About</p>
            <h2 id="about-demo-title" className="mt-1 text-2xl font-black text-white">
              to-do HQ demonstration
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close about dialog"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-lg font-black text-slate-300 hover:border-sky-300/50 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
          <p>
            This is an interactive showcase of a priority-based task dashboard. You can add, edit,
            time, move, complete, import, and export tasks to explore how the app works.
          </p>
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.07] p-4 text-amber-50">
            <p className="font-bold">Demo data is stored only in this browser.</p>
            <p className="mt-1 text-amber-100/80">
              It is not synced to an account or saved to a server. Clearing site data or using another
              browser will create a separate workspace.
            </p>
          </div>
          <p className="text-slate-400">
            Please do not enter passwords, payment details, confidential client information, or other
            sensitive data. Use Reset Seed Data at any time to restore the sample workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-sky-300 px-4 py-3 font-black text-slate-950 transition hover:bg-sky-200"
        >
          Explore the demo
        </button>
        </div>
      </section>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-36 items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 3xl:min-w-44 3xl:px-4">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="font-mono text-sm font-bold text-sky-100 3xl:text-base">{value}</p>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  const time = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    }).format(now);
  }, [now]);

  return (
    <div className="reflective-clock w-full max-w-full rounded-lg border border-sky-200/35 px-3 py-2 text-center sm:w-auto sm:px-5 3xl:px-7 3xl:py-3">
      <p
        data-live-clock
        suppressHydrationWarning
        className="reflective-clock-text relative z-10 whitespace-nowrap font-mono text-4xl font-bold leading-none tabular-nums sm:text-5xl md:text-6xl xl:text-7xl 3xl:text-8xl"
      >
        {time}
      </p>
    </div>
  );
}

function ActiveTaskPanel({
  task,
  onSetStatus,
  onFocusTask
}: {
  task?: Task;
  onSetStatus: (id: string, status: Task["status"]) => void;
  onFocusTask: (task: Task) => void;
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    if (!task?.activeTimerStartedAt) {
      return;
    }

    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [task?.activeTimerStartedAt]);

  const sessionMs =
    nowMs && task?.activeTimerStartedAt
      ? Math.max(0, nowMs - new Date(task.activeTimerStartedAt).getTime())
      : 0;
  const totalMs = task ? getTrackedMs(task, nowMs ?? undefined) : 0;

  return (
    <div className="hidden min-w-64 max-w-72 rounded-lg border border-sky-300/25 bg-sky-300/[0.07] px-3 py-2 shadow-inner shadow-sky-950/30 xl:block 3xl:min-w-80 3xl:max-w-96 3xl:px-4 3xl:py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-sky-200">
          Active
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] ring-1 ${
            task
              ? "bg-sky-300/15 text-sky-100 ring-sky-300/25"
              : "bg-white/[0.05] text-slate-400 ring-white/10"
          }`}
        >
          {task ? "Running" : "Idle"}
        </span>
      </div>
      <p className={`mt-1 truncate text-sm font-bold ${task ? "text-white" : "text-slate-500"}`}>
        {task?.title || "No active task"}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <MiniStat label="Session" value={formatDuration(sessionMs)} />
        <MiniStat label="Total" value={formatDuration(totalMs)} />
        <MiniStat label="Est" value={task?.estimatedTime || "-"} />
      </div>
      {task ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onSetStatus(task.id, "Waiting")}
            className="rounded bg-sky-300/15 px-2 py-1.5 text-xs font-bold text-sky-100 ring-1 ring-sky-300/25 hover:bg-sky-300/20"
          >
            Break
          </button>
          <button
            type="button"
            onClick={() => onSetStatus(task.id, "Done")}
            className="rounded bg-emerald-300/15 px-2 py-1.5 text-xs font-bold text-emerald-100 ring-1 ring-emerald-300/25 hover:bg-emerald-300/20"
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => onFocusTask(task)}
            className="rounded bg-violet-300/15 px-2 py-1.5 text-xs font-bold text-violet-100 ring-1 ring-violet-300/25 hover:bg-violet-300/20"
          >
            Focus
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-black/20 px-2 py-1">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xs font-bold text-sky-100">{value}</p>
    </div>
  );
}
