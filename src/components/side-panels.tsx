import { EmptyState } from "@/components/ui/empty-state";
import {
  formatDuration,
  getDeadlineUrgency,
  getTimeLog,
  getToInvoiceTasks,
  getTrackedMs,
  getUpcomingDeadlines,
  todayFocusSort
} from "@/lib/task-utils";
import type { ClientRecord, Task } from "@/types/task";

type SidePanelsProps = {
  tasks: Task[];
  clients: ClientRecord[];
  onEdit: (task: Task) => void;
  onFocus: (task: Task) => void;
  onSetStatus: (id: string, status: Task["status"]) => void;
};

export function SidePanels({ tasks, clients, onEdit, onFocus, onSetStatus }: SidePanelsProps) {
  const activeTasks = tasks.filter((task) => task.status !== "Done");
  const pinnedToday = activeTasks.filter((task) => task.isToday).sort(todayFocusSort);
  const todayFocus = (pinnedToday.length > 0 ? pinnedToday : [...activeTasks].sort(todayFocusSort)).slice(0, 5);
  const deadlines = getUpcomingDeadlines(tasks);
  const toInvoiceTasks = getToInvoiceTasks(tasks);
  const timeLog = getTimeLog(tasks).slice(0, 6);

  return (
    <aside className="grid min-h-0 gap-3 overflow-y-auto lg:grid-cols-4 2xl:grid-cols-1 2xl:grid-rows-[minmax(0,1fr)_minmax(0,.72fr)_minmax(0,.72fr)_minmax(0,.72fr)] 3xl:gap-4">
      <Panel title="Today Focus" count={todayFocus.length} prominent>
        {todayFocus.length === 0 ? (
          <EmptyState title="No active focus tasks" />
        ) : (
          todayFocus.map((task, index) => (
            <FocusRow key={task.id} task={task} clients={clients} index={index} onEdit={onEdit} onFocus={onFocus} />
          ))
        )}
      </Panel>

      <Panel title="Deadlines" count={deadlines.length}>
        {deadlines.length === 0 ? (
          <EmptyState title="No upcoming deadlines" />
        ) : (
          deadlines.map((task) => (
            <DeadlineRow key={task.id} task={task} clients={clients} onEdit={onEdit} onSetStatus={onSetStatus} />
          ))
        )}
      </Panel>

      <Panel title="To Invoice" count={toInvoiceTasks.length}>
        {toInvoiceTasks.length === 0 ? (
          <EmptyState title="No invoice tasks waiting" />
        ) : (
          toInvoiceTasks.map((task) => (
            <DeadlineRow key={task.id} task={task} clients={clients} onEdit={onEdit} onSetStatus={onSetStatus} />
          ))
        )}
      </Panel>

      <Panel title="Time Log" count={timeLog.length}>
        {timeLog.length === 0 ? (
          <EmptyState title="No tracked sessions yet" />
        ) : (
          timeLog.map((entry) => <TimeLogRow key={entry.id} entry={entry} clients={clients} />)
        )}
      </Panel>
    </aside>
  );
}

function FocusRow({
  task,
  clients,
  index,
  onEdit,
  onFocus
}: {
  task: Task;
  clients: ClientRecord[];
  index: number;
  onEdit: (task: Task) => void;
  onFocus: (task: Task) => void;
}) {
  const trackedMs = getTrackedMs(task);

  return (
    <div className="grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-sky-300/15 bg-sky-300/[0.04] p-2.5 text-left 3xl:grid-cols-[2.5rem_minmax(0,1fr)_auto] 3xl:p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-300 text-sm font-black text-slate-950 3xl:h-10 3xl:w-10 3xl:text-base">
        {index + 1}
      </span>
      <button type="button" onClick={() => onEdit(task)} className="min-w-0 text-left">
        <span className="block overflow-hidden text-sm font-bold leading-tight text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] 3xl:text-base">
          {task.title}
        </span>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-400 3xl:text-sm">
          <CompactClientIdentity task={task} clients={clients} />
          {" / "}
          {task.category}
          {task.deadline ? ` / Due ${task.deadline}` : ""}
        </span>
      </button>
      <span className="flex flex-col items-end gap-1">
        <span className="rounded bg-black/20 px-2 py-1 text-xs font-bold text-slate-200 3xl:text-sm">
          {task.estimatedTime}
        </span>
        {trackedMs > 0 ? (
          <span className="rounded bg-sky-300/10 px-2 py-1 text-xs font-bold text-sky-100 3xl:text-sm">
            {formatDuration(trackedMs)}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onFocus(task)}
          className="rounded bg-violet-300/10 px-2 py-1 text-xs font-bold text-violet-100 ring-1 ring-violet-300/20 3xl:text-sm"
        >
          Focus
        </button>
      </span>
    </div>
  );
}

function Panel({
  title,
  count,
  prominent = false,
  children
}: {
  title: string;
  count: number;
  prominent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`min-h-0 overflow-hidden rounded-lg border ${
        prominent ? "border-sky-300/30 bg-sky-950/20" : "border-white/10 bg-deck-900/75"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 3xl:px-4 3xl:py-3">
        <h2 className="text-lg font-bold text-white 3xl:text-xl">{title}</h2>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-sm font-semibold text-slate-300 3xl:px-3 3xl:text-base">
          {count}
        </span>
      </div>
      <div className="h-full space-y-2 overflow-y-auto p-2.5 pb-12 3xl:space-y-3 3xl:p-3 3xl:pb-14">{children}</div>
    </section>
  );
}

function DeadlineRow({
  task,
  clients,
  onEdit,
  onSetStatus
}: {
  task: Task;
  clients: ClientRecord[];
  onEdit: (task: Task) => void;
  onSetStatus: (id: string, status: Task["status"]) => void;
}) {
  const trackedMs = getTrackedMs(task);
  const deadlineUrgency = getDeadlineUrgency(task.deadline);

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-2.5 3xl:p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold leading-tight text-white 3xl:text-base">{task.title}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 3xl:text-sm">
            <CompactClientIdentity task={task} clients={clients} />
            <span>/ {task.estimatedTime}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded border border-white/10 px-2 py-1 text-xs font-bold text-slate-200 hover:border-sky-300/50 3xl:text-sm"
        >
          Edit
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {deadlineUrgency ? (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 3xl:text-sm ${deadlineUrgency.className}`}>
            {deadlineUrgency.label}
          </span>
        ) : null}
        {task.category === "To Invoice" && task.invoiceStatus !== "Not Needed" ? (
          <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs font-bold text-emerald-100 ring-1 ring-emerald-300/20 3xl:text-sm">
            {task.invoiceStatus}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onSetStatus(task.id, "Done")}
          className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-100 ring-1 ring-emerald-300/20 3xl:text-sm"
        >
          Complete
        </button>
        {trackedMs > 0 ? (
          <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-bold text-slate-200 ring-1 ring-white/10 3xl:text-sm">
            Tracked {formatDuration(trackedMs)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TimeLogRow({ entry, clients }: { entry: ReturnType<typeof getTimeLog>[number]; clients: ClientRecord[] }) {
  const startedAt = new Date(entry.startedAt);

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-2.5 3xl:p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-white 3xl:text-base">{entry.taskTitle}</h3>
          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-400 3xl:text-sm">
            <CompactClientIdentity task={entry} clients={clients} />
            <span className="truncate">
              / {startedAt.toLocaleDateString()} {startedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        </div>
        <span className="rounded bg-sky-300/10 px-2 py-1 font-mono text-xs font-bold text-sky-100 3xl:text-sm">
          {formatDuration(entry.durationMs)}
        </span>
      </div>
    </div>
  );
}

function CompactClientIdentity({
  task,
  clients
}: {
  task: Pick<Task, "client" | "clientLogoUrl">;
  clients: ClientRecord[];
}) {
  const client = clients.find((item) => item.name.toLowerCase() === task.client.toLowerCase());
  const logoUrl = client?.logoUrl || task.clientLogoUrl;
  const clientName = client?.name || task.client;

  if (logoUrl) {
    return (
      <span className="inline-flex h-4 max-w-14 items-center align-middle 3xl:h-5 3xl:max-w-20" title={clientName}>
        <img
          src={logoUrl}
          alt={`${clientName} logo`}
          className="max-h-4 max-w-full object-contain 3xl:max-h-5"
        />
      </span>
    );
  }

  return <span>{clientName}</span>;
}
