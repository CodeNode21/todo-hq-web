import { EmptyState } from "@/components/ui/empty-state";
import { TaskCard } from "@/components/task-card";
import { priorities } from "@/lib/task-utils";
import type { ClientRecord, Priority, Task } from "@/types/task";
import { type DragEvent, useState } from "react";

type PriorityBoardProps = {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onSetPriority: (id: string, priority: Priority) => void;
  onSetStatus: (id: string, status: Task["status"]) => void;
  onToggleToday: (id: string) => void;
  onFocus: (task: Task) => void;
  onReorderTask: (draggedId: string, targetId: string | null, targetPriority: Priority) => void;
  clients: ClientRecord[];
  onSetClientLogo: (clientName: string, logoUrl: string) => void;
};

export function PriorityBoard({
  tasks,
  onEdit,
  onDelete,
  onSetPriority,
  onSetStatus,
  onToggleToday,
  onFocus,
  onReorderTask,
  clients,
  onSetClientLogo
}: PriorityBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverPriority, setDragOverPriority] = useState<Priority | null>(null);

  function clearDragState() {
    setDraggingId(null);
    setDragOverTaskId(null);
    setDragOverPriority(null);
  }

  function startedFromDragHandle(event: DragEvent<HTMLElement>) {
    const path = event.nativeEvent.composedPath();

    return path.some(
      (target) => target instanceof HTMLElement && Boolean(target.closest("[data-drag-handle]"))
    );
  }

  return (
    <section className="grid min-h-0 gap-2 overflow-visible md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-[repeat(5,minmax(0,1fr))] 2xl:overflow-hidden 3xl:grid-cols-[repeat(5,minmax(260px,1fr))] 3xl:gap-3 4xl:grid-cols-[repeat(5,minmax(320px,1fr))] 4xl:gap-4">
      {priorities.map((priority) => {
        const columnTasks = tasks.filter((task) => task.priority === priority);
        return (
          <div
            key={priority}
            onDragOver={(event) => {
              if (draggingId) {
                event.preventDefault();
                setDragOverPriority(priority);
              }
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDragOverPriority(null);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (draggingId) {
                onReorderTask(draggingId, null, priority);
              }
              clearDragState();
            }}
            className={`flex min-h-[18rem] flex-col overflow-hidden rounded-lg border bg-deck-900/75 transition 3xl:min-h-[24rem] ${
              dragOverPriority === priority && draggingId
                ? "border-sky-300/45 ring-2 ring-sky-300/15"
                : "border-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 3xl:px-4 3xl:py-3">
              <div>
                <h2 className="text-lg font-bold text-white 3xl:text-xl">{priority}</h2>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500 3xl:text-xs">
                  Drag rail to move
                </p>
              </div>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-sm font-semibold text-slate-300 3xl:px-3 3xl:text-base">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-2 3xl:space-y-3 3xl:p-3">
              {columnTasks.length === 0 ? (
                <EmptyState title={`No ${priority.toLowerCase()} tasks`} />
              ) : (
                columnTasks.map((task) => {
                  const isActiveTask = Boolean(task.activeTimerStartedAt);

                  return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      if (!startedFromDragHandle(event)) {
                        event.preventDefault();
                        return;
                      }

                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", task.id);
                      setDraggingId(task.id);
                      setDragOverPriority(priority);
                    }}
                    onDragOver={(event) => {
                      if (draggingId && draggingId !== task.id) {
                        event.preventDefault();
                        setDragOverTaskId(task.id);
                        setDragOverPriority(priority);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const draggedId = draggingId || event.dataTransfer.getData("text/plain");
                      if (draggedId && draggedId !== task.id) {
                        onReorderTask(draggedId, task.id, priority);
                      }
                      clearDragState();
                    }}
                    onDragEnd={clearDragState}
                    className={`relative rounded-lg transition ${
                      isActiveTask ? "sticky top-0 z-20 shadow-[0_14px_28px_rgba(2,6,23,.28)]" : ""
                    } ${
                      draggingId === task.id ? "scale-[0.99] opacity-45" : ""
                    } ${
                      dragOverTaskId === task.id && draggingId !== task.id
                        ? "translate-y-1 before:absolute before:-top-1.5 before:left-2 before:right-2 before:z-10 before:h-1 before:rounded-full before:bg-sky-300 before:shadow-[0_0_14px_rgba(125,211,252,.65)]"
                        : ""
                    }`}
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onSetPriority={onSetPriority}
                      onSetStatus={onSetStatus}
                      onToggleToday={onToggleToday}
                      onFocus={onFocus}
                      clients={clients}
                      onSetClientLogo={onSetClientLogo}
                    />
                  </div>
                  );
                })
              )}
              {draggingId ? (
                <div className="rounded-lg border border-dashed border-sky-300/45 bg-sky-300/[0.06] px-3 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-sky-100 shadow-inner shadow-sky-950/30">
                  Drop here to place at bottom
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </section>
  );
}
