import { useEffect, useRef, useState } from "react";
import {
  formatAge,
  formatDuration,
  getCategoryAccent,
  getDeadlineUrgency,
  getPriorityAccent,
  getTrackedMs,
  movePriority
} from "@/lib/task-utils";
import type { ClientRecord, Priority, Task } from "@/types/task";

type TaskCardProps = {
  task: Task;
  compact?: boolean;
  onEdit: (task: Task) => void;
  onDelete?: (id: string) => void;
  onSetPriority?: (id: string, priority: Priority) => void;
  onSetStatus: (id: string, status: Task["status"]) => void;
  onToggleToday?: (id: string) => void;
  onFocus?: (task: Task) => void;
  clients: ClientRecord[];
  onSetClientLogo: (clientName: string, logoUrl: string) => void;
};

export function TaskCard({
  task,
  compact = false,
  onEdit,
  onDelete,
  onSetPriority,
  onSetStatus,
  onToggleToday,
  onFocus,
  clients,
  onSetClientLogo
}: TaskCardProps) {
  const isDone = task.status === "Done";
  const isRunning = Boolean(task.activeTimerStartedAt);
  const cardRef = useRef<HTMLElement | null>(null);
  const [isStickyCompact, setIsStickyCompact] = useState(false);
  const canMoveUp = task.priority !== "Critical";
  const canMoveDown = task.priority !== "Backlog";
  const [nowMs, setNowMs] = useState<number | null>(null);
  const stableNowMs = nowMs ?? new Date(task.activeTimerStartedAt || task.statusChangedAt).getTime();
  const trackedMs = getTrackedMs(task, stableNowMs);
  const deadlineUrgency = getDeadlineUrgency(task.deadline);
  const client = clients.find((item) => item.name.toLowerCase() === task.client.toLowerCase());
  const clientLogoUrl = client?.logoUrl || task.clientLogoUrl;

  useEffect(() => {
    setNowMs(Date.now());

    if (!task.activeTimerStartedAt) {
      return;
    }

    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [task.activeTimerStartedAt]);

  useEffect(() => {
    if (isRunning) {
      cardRef.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  }, [isRunning, task.id]);

  useEffect(() => {
    const card = cardRef.current;

    if (!card || !isRunning) {
      setIsStickyCompact(false);
      return;
    }

    const scrollParent = findScrollParent(card);

    function updateStickyState() {
      if (!card || !scrollParent) {
        return;
      }

      const cardTop = card.getBoundingClientRect().top;
      const scrollParentTop = scrollParent.getBoundingClientRect().top;
      setIsStickyCompact(scrollParent.scrollTop > 8 && cardTop <= scrollParentTop + 2);
    }

    updateStickyState();
    scrollParent?.addEventListener("scroll", updateStickyState, { passive: true });
    window.addEventListener("resize", updateStickyState);

    return () => {
      scrollParent?.removeEventListener("scroll", updateStickyState);
      window.removeEventListener("resize", updateStickyState);
    };
  }, [isRunning, task.id]);

  return (
    <article
      ref={cardRef}
      className={`group/card relative flex overflow-hidden rounded-lg border transition ${getActivityAccent(task, isRunning)} ${
        isDone ? "opacity-55" : ""
      }`}
    >
      {!isRunning && task.status !== "Done" ? (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${getAgeWarmthOverlay(task, stableNowMs)}`}
        />
      ) : null}
      <DragGrip />
      <div className="min-w-0 flex-1 py-2 pl-2 pr-2 2xl:py-2.5 3xl:py-4 3xl:pl-3 3xl:pr-4">
        <div className="grid gap-2 3xl:grid-cols-[minmax(0,1fr)_auto] 3xl:items-start">
          <div className="min-w-0">
            <div className="flex items-start pr-1">
              <h3 className="text-base font-bold leading-tight text-white 2xl:text-lg 3xl:text-xl">{task.title}</h3>
            </div>
          <div className={isStickyCompact ? "block" : "hidden 3xl:block"}>
            <ClientIdentity
              clientName={client?.name || task.client}
              logoUrl={clientLogoUrl}
              onSetClientLogo={onSetClientLogo}
              compact={isStickyCompact}
            />
            </div>
          </div>
          <div className="flex shrink-0 flex-row items-center justify-between gap-2 3xl:flex-col 3xl:items-end">
            <span className={`${isStickyCompact ? "hidden" : "rounded-md bg-black/20 px-2 py-0.5 text-xs font-bold text-slate-200 3xl:text-sm"}`}>
              {task.estimatedTime}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={isRunning ? `Take a break from ${task.title}` : `Start ${task.title}`}
                title={isRunning ? "Break" : "Start"}
                onClick={() => onSetStatus(task.id, isRunning ? "Waiting" : "In Progress")}
                className={`flex h-9 w-10 shrink-0 items-center justify-center rounded-md border 3xl:h-11 3xl:w-12 ${
                  isRunning
                    ? "border-amber-300/35 bg-amber-300/14 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,.08)] hover:border-amber-300/65 hover:bg-amber-300/20"
                    : "border-sky-300/35 bg-sky-300/14 text-sky-100 shadow-[0_0_18px_rgba(56,189,248,.08)] hover:border-sky-300/65 hover:bg-sky-300/20"
                }`}
              >
                {isRunning ? <BreakIcon /> : <PlayIcon />}
              </button>
              <span aria-hidden="true" className="h-8 w-px shrink-0 bg-white/10" />
              <button
                type="button"
                aria-label={isDone ? `Restore ${task.title} to the board` : `Complete ${task.title}`}
                title={isDone ? "Restore" : "Complete"}
                onClick={() => onSetStatus(task.id, isDone ? "Not Started" : "Done")}
                className={`flex h-9 w-10 shrink-0 items-center justify-center rounded-md border shadow-[0_0_18px_rgba(52,211,153,.08)] 3xl:h-11 3xl:w-12 ${
                  isDone
                    ? "border-cyan-300/35 bg-cyan-400/12 text-cyan-100 hover:border-cyan-300/65 hover:bg-cyan-400/20"
                    : "border-emerald-300/40 bg-emerald-400/14 text-emerald-100 hover:border-emerald-300/70 hover:bg-emerald-400/20"
                }`}
              >
                {isDone ? <RestoreIcon /> : <CheckIcon />}
              </button>
            </div>
            <span
              className={`${isStickyCompact ? "hidden" : "inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-bold ring-1 3xl:text-xs"} ${
                isRunning
                  ? "bg-sky-300/15 text-sky-100 ring-sky-300/25"
                  : trackedMs > 0
                    ? "bg-slate-300/10 text-slate-200 ring-slate-300/15"
                    : "bg-black/20 text-slate-500 ring-white/10"
              }`}
            >
              {trackedMs > 0 || isRunning ? formatDuration(trackedMs) : "No time"}
            </span>
          </div>
        </div>

        <div className={`${isStickyCompact ? "hidden" : "mt-2 flex flex-wrap gap-1.5 3xl:mt-3 3xl:gap-2"}`}>
        <span className={`rounded-full px-2 py-0.5 text-xs font-black ring-1 3xl:px-2.5 3xl:py-1 3xl:text-sm ${getPriorityBadgeAccent(task.priority)}`}>
          {task.priority}
        </span>
        <span className={`hidden rounded-full px-2 py-0.5 text-xs font-bold ring-1 xl:inline-flex 3xl:px-2.5 3xl:py-1 3xl:text-sm ${getCategoryAccent(task.category)}`}>
          {task.category}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 3xl:px-2.5 3xl:py-1 3xl:text-sm ${getStatusAccent(task.status)}`}>
          {task.status}
        </span>
        {deadlineUrgency ? (
          <span className={`hidden rounded-full px-2 py-0.5 text-xs font-bold ring-1 3xl:inline-flex 3xl:px-2.5 3xl:py-1 3xl:text-sm ${deadlineUrgency.className}`}>
            {deadlineUrgency.label}
          </span>
        ) : null}
        {task.category === "To Invoice" && task.invoiceStatus !== "Not Needed" ? (
          <span className="hidden rounded-full bg-white/[0.05] px-2 py-0.5 text-xs font-semibold text-emerald-100/80 ring-1 ring-white/10 3xl:inline-flex 3xl:px-2.5 3xl:py-1 3xl:text-sm">
            {task.invoiceStatus}
          </span>
        ) : null}
        {task.recurrence !== "None" ? (
          <span className="hidden rounded-full bg-indigo-300/10 px-2 py-0.5 text-xs font-bold text-indigo-100 ring-1 ring-indigo-300/20 3xl:inline-flex 3xl:px-2.5 3xl:py-1 3xl:text-sm">
            {task.recurrence}
          </span>
        ) : null}
        {task.isToday ? (
          <span className="hidden rounded-full bg-sky-300/12 px-2 py-0.5 text-xs font-bold text-sky-100 ring-1 ring-sky-300/20 3xl:inline-flex 3xl:px-2.5 3xl:py-1 3xl:text-sm">
            Today
          </span>
        ) : null}
        <span className="hidden rounded-full bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-400 ring-1 ring-white/10 3xl:inline-flex 3xl:text-sm">
          Age {formatAge(task.statusChangedAt, stableNowMs)}
        </span>
        </div>

        {!compact && !isStickyCompact && task.notes ? (
          <p className="note-clamp mt-3 hidden border-t border-white/10 pt-3 text-sm leading-relaxed text-slate-200 3xl:block 3xl:text-base">{task.notes}</p>
        ) : null}

        <div className="mt-2 flex items-center border-t border-white/10 pt-2 3xl:mt-3 3xl:pt-3">
        <div className="inline-flex max-w-full flex-nowrap items-center gap-1 rounded-md border border-white/10 bg-black/15 p-0.5">
          {onToggleToday ? (
            <IconActionButton
              label={task.isToday ? `Remove ${task.title} from Today Focus` : `Pin ${task.title} to Today Focus`}
              variant={task.isToday ? "todayActive" : "today"}
              onClick={() => onToggleToday(task.id)}
            />
          ) : null}
          {onFocus ? (
            <IconActionButton label={`Open focus mode for ${task.title}`} variant="focus" onClick={() => onFocus(task)} />
          ) : null}
          <IconActionButton label={`Edit ${task.title}`} variant="edit" onClick={() => onEdit(task)} />
          {onDelete ? (
            <IconActionButton
              label={`Delete ${task.title}`}
              variant="delete"
              onClick={() => onDelete(task.id)}
            />
          ) : null}
          {onSetPriority ? (
            <>
            <span aria-hidden="true" className="mx-0.5 h-6 w-px shrink-0 bg-white/10" />
            <PriorityMoveButton
              direction="up"
              disabled={!canMoveUp}
              label={`Heat up ${task.title}`}
              onClick={() => onSetPriority(task.id, movePriority(task.priority, "up"))}
            />
            <PriorityMoveButton
              direction="down"
              disabled={!canMoveDown}
              label={`Cool down ${task.title}`}
              onClick={() => onSetPriority(task.id, movePriority(task.priority, "down"))}
            />
            </>
          ) : null}
        </div>
        </div>
      </div>
      <DragGrip side="right" />
    </article>
  );
}

function getActivityAccent(task: Task, isRunning: boolean) {
  if (isRunning) {
    return "border-yellow-200/85 bg-slate-900/95 text-yellow-50 ring-2 ring-yellow-200/45 shadow-[0_18px_34px_rgba(2,6,23,.45)]";
  }

  if (task.status === "Done") {
    return "border-emerald-300/22 bg-slate-900/42 text-slate-200";
  }

  return getPriorityAccent(task.priority);
}

function getAgeWarmthOverlay(task: Task, nowMs: number) {
  const ageMs = Math.max(0, nowMs - new Date(task.statusChangedAt).getTime());
  const ageDays = ageMs / 86400000;

  if (ageDays >= 7) {
    return "bg-yellow-300/24";
  }

  if (ageDays >= 3) {
    return "bg-yellow-300/16";
  }

  if (ageDays >= 1) {
    return "bg-yellow-300/8";
  }

  return "bg-transparent";
}

function findScrollParent(element: HTMLElement) {
  let parent = element.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const canScroll = /(auto|scroll)/.test(style.overflowY);

    if (canScroll) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

function getStatusAccent(status: Task["status"]) {
  if (status === "In Progress") {
    return "bg-sky-300/15 text-sky-100 ring-sky-300/30";
  }

  if (status === "Waiting") {
    return "bg-amber-300/12 text-amber-100 ring-amber-300/25";
  }

  if (status === "Done") {
    return "bg-emerald-300/12 text-emerald-100 ring-emerald-300/25";
  }

  return "bg-white/[0.07] text-slate-200 ring-white/10";
}

function getPriorityBadgeAccent(priority: Priority) {
  if (priority === "Critical") {
    return "bg-red-400/18 text-red-50 ring-red-300/35";
  }

  if (priority === "High") {
    return "bg-orange-300/15 text-orange-100 ring-orange-300/30";
  }

  if (priority === "Medium") {
    return "bg-sky-300/14 text-sky-100 ring-sky-300/25";
  }

  if (priority === "Low") {
    return "bg-slate-300/10 text-slate-200 ring-slate-300/15";
  }

  return "bg-violet-300/12 text-violet-100 ring-violet-300/20";
}

function ClientIdentity({
  clientName,
  logoUrl,
  onSetClientLogo,
  compact = false
}: {
  clientName: string;
  logoUrl?: string;
  onSetClientLogo: (clientName: string, logoUrl: string) => void;
  compact?: boolean;
}) {
  function updateLogoFromFile(file?: File) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onSetClientLogo(clientName, reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function updateLogoFromUrl() {
    const logoUrl = window.prompt(`Logo URL for ${clientName}`);

    if (logoUrl?.trim()) {
      onSetClientLogo(clientName, logoUrl.trim());
    }
  }

  if (logoUrl) {
    return (
      <div className={`${compact ? "mt-2" : "mt-3"} flex items-center gap-2`}>
        <div
          className={`${compact ? "h-10 min-w-14 max-w-28 px-2 py-1.5" : "h-16 min-w-20 max-w-44 px-3 py-2.5 3xl:h-20 3xl:min-w-24 3xl:max-w-56 3xl:px-4"} flex items-center justify-center rounded-md border border-white/15 bg-white/[0.08] shadow-inner shadow-white/5`}
          title={clientName}
        >
          <img
            src={logoUrl}
            alt={`${clientName} logo`}
            className={`${compact ? "max-h-7" : "max-h-12 3xl:max-h-16"} max-w-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,.35)]`}
          />
        </div>
        <ClientLogoUploadButton
          clientName={clientName}
          onFileSelected={updateLogoFromFile}
          onUrlSelected={updateLogoFromUrl}
        />
      </div>
    );
  }

  return (
    <div className="mt-1 flex min-w-0 items-center gap-2">
      <p className="truncate text-sm font-semibold text-slate-300 3xl:text-base">{clientName}</p>
      <ClientLogoUploadButton
        clientName={clientName}
        onFileSelected={updateLogoFromFile}
        onUrlSelected={updateLogoFromUrl}
      />
    </div>
  );
}

function ClientLogoUploadButton({
  clientName,
  onFileSelected,
  onUrlSelected
}: {
  clientName: string;
  onFileSelected: (file?: File) => void;
  onUrlSelected: () => void;
}) {
  return (
    <span className="inline-flex shrink-0 overflow-hidden rounded-md border border-white/15 bg-white/[0.06] text-slate-300">
      <label
        title={`Upload logo file for ${clientName}`}
        className="flex h-8 w-8 cursor-pointer items-center justify-center transition hover:bg-sky-300/12 hover:text-sky-100"
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            onFileSelected(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
          <path
            d="M10 3.5v8m0-8L6.9 6.6M10 3.5l3.1 3.1M4.5 11.5v3.25c0 .97.78 1.75 1.75 1.75h7.5c.97 0 1.75-.78 1.75-1.75V11.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </label>
      <button
        type="button"
        title={`Use logo URL for ${clientName}`}
        onClick={onUrlSelected}
        className="flex h-8 w-8 items-center justify-center border-l border-white/10 transition hover:bg-sky-300/12 hover:text-sky-100"
      >
        <LinkIcon />
      </button>
    </span>
  );
}

function DragGrip({ side = "left" }: { side?: "left" | "right" }) {
  return (
    <button
      type="button"
      data-drag-handle
      draggable
      aria-hidden="true"
      tabIndex={-1}
      title="Drag card"
      className={`flex w-5 shrink-0 cursor-grab items-center justify-center bg-black/15 text-slate-500 opacity-75 transition hover:bg-sky-300/10 hover:text-sky-100 hover:opacity-100 active:cursor-grabbing group-hover/card:opacity-100 3xl:w-6 ${
        side === "left" ? "border-r border-white/10" : "border-l border-white/10"
      }`}
    >
      <svg viewBox="0 0 12 20" className="h-5 w-3" fill="none">
        <path
          d="M4 4.5a1.2 1.2 0 1 1-2.4 0A1.2 1.2 0 0 1 4 4.5Zm0 5.5a1.2 1.2 0 1 1-2.4 0A1.2 1.2 0 0 1 4 10Zm0 5.5a1.2 1.2 0 1 1-2.4 0A1.2 1.2 0 0 1 4 15.5Zm6.4-11a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Zm0 5.5a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Zm0 5.5a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}

function PriorityMoveButton({
  direction,
  disabled,
  label,
  onClick
}: {
  direction: "up" | "down";
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${
        direction === "up"
          ? "bg-red-500/12 text-orange-300 hover:bg-red-500/20 hover:text-orange-200"
          : "bg-sky-300/10 text-cyan-100 hover:bg-sky-300/18 hover:text-white"
      }`}
    >
      {direction === "up" ? <FlameIcon /> : <IceIcon />}
    </button>
  );
}

function IconActionButton({
  label,
  variant,
  onClick
}: {
  label: string;
  variant: "edit" | "delete" | "today" | "todayActive" | "focus";
  onClick: () => void;
}) {
  const styles = {
    delete: "border-red-300/25 bg-red-500/10 text-red-200 hover:border-red-300/60 hover:bg-red-500/18 hover:text-red-100",
    edit: "border-amber-300/25 bg-amber-400/10 text-amber-100 hover:border-amber-300/60 hover:bg-amber-400/18",
    today: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100 hover:border-cyan-300/60 hover:bg-cyan-400/18",
    todayActive: "border-cyan-300/55 bg-cyan-300/18 text-cyan-50 shadow-[0_0_16px_rgba(103,232,249,.12)] hover:border-cyan-200/75 hover:bg-cyan-300/24",
    focus: "border-violet-300/30 bg-violet-400/12 text-violet-100 hover:border-violet-300/65 hover:bg-violet-400/20"
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${styles[variant]}`}
    >
      {variant === "delete" ? <TrashIcon /> : null}
      {variant === "edit" ? <EditIcon /> : null}
      {variant === "today" || variant === "todayActive" ? <PinIcon /> : null}
      {variant === "focus" ? <FocusIcon /> : null}
    </button>
  );
}

function FlameIcon() {
  return (
    <svg suppressHydrationWarning aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <path
        suppressHydrationWarning
        d="M12.2 21c-3.74 0-6.7-2.52-6.7-6.35 0-2.42 1.43-4.3 3.05-6.08 1.44-1.58 2.76-3.04 2.83-5.57 2.68 1.68 4.03 3.86 3.38 6.47.77-.4 1.4-.98 1.88-1.75 1.1 1.32 1.86 2.78 1.86 4.82C18.5 17.7 15.82 21 12.2 21Z"
        fill="#fb923c"
        opacity="0.95"
      />
      <path
        suppressHydrationWarning
        d="M11.82 18.35c-1.43 0-2.52-.96-2.52-2.46 0-.92.45-1.62 1.08-2.33.58-.66 1.1-1.28 1.2-2.34 1.25.86 1.86 1.85 1.5 3.08.42-.18.78-.45 1.06-.8.46.58.76 1.22.76 2.08 0 1.76-1.24 2.77-3.08 2.77Z"
        fill="#ef4444"
      />
    </svg>
  );
}

function IceIcon() {
  return (
    <svg suppressHydrationWarning aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <path
        suppressHydrationWarning
        d="M12 3v18M4.8 7.15l14.4 9.7M19.2 7.15l-14.4 9.7"
        stroke="#e0f2fe"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        suppressHydrationWarning
        d="m12 3 2 2.45M12 3 10 5.45M12 21l2-2.45M12 21l-2-2.45M4.8 7.15l3.1-.38M4.8 7.15l1.16 2.9M19.2 16.85l-3.1.38M19.2 16.85l-1.16-2.9M19.2 7.15l-1.16 2.9M19.2 7.15l-3.1-.38M4.8 16.85l1.16-2.9M4.8 16.85l3.1.38"
        stroke="#38bdf8"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 3xl:h-8 3xl:w-8" fill="none">
      <path
        d="M7 4.7v14.6c0 .9 1 1.43 1.74.9l10.65-7.3a1.1 1.1 0 0 0 0-1.8L8.74 3.8C8 3.27 7 3.8 7 4.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BreakIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 3xl:h-8 3xl:w-8" fill="none">
      <path d="M6.5 4.5h4.7v15h-4.7v-15ZM12.8 4.5h4.7v15h-4.7v-15Z" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 3xl:h-8 3xl:w-8" fill="none">
      <path
        d="M9.15 18.15 3.9 12.9l2.55-2.55 2.7 2.7 8.4-8.4 2.55 2.55-10.95 10.95Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 3xl:h-8 3xl:w-8" fill="none">
      <path
        d="M7.25 7.7A7 7 0 1 1 6 12h2.55a4.45 4.45 0 1 0 1.08-2.9L12 11.45H5V4.5l2.25 3.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-6 w-6" fill="none">
      <path d="M6 3h8l-1.25 5 2.25 2.25V12H11v5l-1 1-1-1v-5H5v-1.75L7.25 8 6 3Z" fill="currentColor" />
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-6 w-6" fill="none">
      <path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 2.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Z" fill="currentColor" />
      <path d="M10 7.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z" fill="currentColor" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-6 w-6" fill="none">
      <path d="M4 13.8V16h2.2l8.45-8.45-2.2-2.2L4 13.8Z" fill="currentColor" />
      <path d="m13.3 4.5 2.2 2.2.75-.75a1.55 1.55 0 0 0-2.2-2.2l-.75.75Z" fill="currentColor" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M8.25 6.75 9.4 5.6a3.2 3.2 0 1 1 4.52 4.52l-1.15 1.15M11.75 13.25l-1.15 1.15a3.2 3.2 0 1 1-4.52-4.52l1.15-1.15M7.9 12.1l4.2-4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-6 w-6" fill="none">
      <path d="M7 3h6l.5 1.5H17V6H3V4.5h3.5L7 3Z" fill="currentColor" />
      <path d="M5 7h10l-.75 9.5H5.75L5 7Z" fill="currentColor" />
    </svg>
  );
}
