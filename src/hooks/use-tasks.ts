"use client";

import { useEffect, useMemo, useState } from "react";
import { seedTasks } from "../lib/seed-tasks";
import type { Category, ClientRecord, InvoiceStatus, Priority, Recurrence, Task, TaskDraft, TimeEntry } from "@/types/task";

const storageKey = "todayhq.tasks.v1";
const clientsStorageKey = "todayhq.clients.v1";

type StoredTask = Omit<Partial<Task>, "category"> & {
  category?: Category | "Money" | "AR";
  invoiceStatus?: InvoiceStatus;
  recurrence?: Recurrence;
};

function normalizeCategory(category: StoredTask["category"]): Category {
  return category === "Money" || category === "AR" ? "To Invoice" : category || "Client Delivery";
}

function normalizeClientName(client: string) {
  return client.trim() || "Unassigned";
}

function closeTimer(task: Task, endedAt: string): Task {
  if (!task.activeTimerStartedAt) {
    return task;
  }

  const durationMs = Math.max(
    0,
    new Date(endedAt).getTime() - new Date(task.activeTimerStartedAt).getTime()
  );
  const entry: TimeEntry = {
    id: crypto.randomUUID(),
    startedAt: task.activeTimerStartedAt,
    endedAt,
    durationMs
  };

  return {
    ...task,
    activeTimerStartedAt: undefined,
    timeEntries: [...task.timeEntries, entry]
  };
}

function sortWithinPriority(tasks: Task[]) {
  return [...tasks].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

function mergeClients(tasks: Task[], storedClients: Partial<ClientRecord>[] = []) {
  const now = new Date().toISOString();
  const clients = new Map<string, ClientRecord>();

  storedClients.forEach((client) => {
    const name = normalizeClientName(client.name || "");
    clients.set(name.toLowerCase(), {
      name,
      logoUrl: client.logoUrl || undefined,
      createdAt: client.createdAt || now,
      updatedAt: client.updatedAt || now
    });
  });

  tasks.forEach((task) => {
    const name = normalizeClientName(task.client);
    const key = name.toLowerCase();
    const existing = clients.get(key);

    clients.set(key, {
      name,
      logoUrl: existing?.logoUrl || task.clientLogoUrl || undefined,
      createdAt: existing?.createdAt || task.createdAt || now,
      updatedAt: existing?.updatedAt || task.updatedAt || now
    });
  });

  return [...clients.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function stampTask(task: StoredTask, fallbackSortOrder = 0): Task {
  const stamped = {
    id: task.id || crypto.randomUUID(),
    title: task.title || "Untitled Task",
    client: task.client || "Unassigned",
    clientLogoUrl: task.clientLogoUrl || undefined,
    category: normalizeCategory(task.category),
    priority: task.priority || "Medium",
    estimatedTime: task.estimatedTime || "TBD",
    deadline: task.deadline,
    status: task.status || "Not Started",
    invoiceStatus:
      task.invoiceStatus ||
      (normalizeCategory(task.category) === "To Invoice" ? "Invoice Needed" : "Not Needed"),
    recurrence: task.recurrence || "None",
    isToday: task.isToday || false,
    sortOrder: typeof task.sortOrder === "number" ? task.sortOrder : fallbackSortOrder,
    nextStep: task.nextStep || "",
    focusChecklist: task.focusChecklist || [],
    notes: task.notes || "",
    timeEntries: task.timeEntries || [],
    activeTimerStartedAt: task.activeTimerStartedAt,
    statusChangedAt: task.statusChangedAt || task.updatedAt || new Date().toISOString(),
    priorityChangedAt: task.priorityChangedAt || task.updatedAt || new Date().toISOString(),
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString()
  } satisfies Task;

  return {
    ...stamped,
    activeTimerStartedAt: stamped.status === "In Progress" ? stamped.activeTimerStartedAt : undefined
  };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [clients, setClients] = useState<ClientRecord[]>(() => mergeClients(seedTasks));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      const storedClients = window.localStorage.getItem(clientsStorageKey);
      const parsedClients = storedClients ? (JSON.parse(storedClients) as ClientRecord[]) : [];

      if (stored) {
        const parsed = JSON.parse(stored) as Task[];
        const normalizedTasks = parsed.map((task, index) => stampTask(task, index));
        setTasks(normalizedTasks);
        setClients(mergeClients(normalizedTasks, parsedClients));
      } else {
        setClients(mergeClients(seedTasks, parsedClients));
      }
    } catch {
      setTasks(seedTasks);
      setClients(mergeClients(seedTasks));
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      window.localStorage.setItem(storageKey, JSON.stringify(tasks));
    }
  }, [isLoaded, tasks]);

  useEffect(() => {
    if (isLoaded) {
      window.localStorage.setItem(clientsStorageKey, JSON.stringify(clients));
    }
  }, [clients, isLoaded]);

  const actions = useMemo(
    () => ({
      addTask(draft: TaskDraft) {
        const now = new Date().toISOString();
        const client = normalizeClientName(draft.client);
        setClients((current) => mergeClients([{ ...draft, client, id: "", sortOrder: 0, timeEntries: [], statusChangedAt: now, priorityChangedAt: now, createdAt: now, updatedAt: now }], current));
        setTasks((current) => {
          const samePriority = current.filter((task) => task.priority === draft.priority);
          const firstSortOrder =
            samePriority.length > 0 ? Math.min(...samePriority.map((task) => task.sortOrder)) : 0;
          const task: Task = {
            ...draft,
            client,
            clientLogoUrl: undefined,
            id: crypto.randomUUID(),
            sortOrder: firstSortOrder - 1,
            timeEntries: [],
            statusChangedAt: now,
            priorityChangedAt: now,
            createdAt: now,
            updatedAt: now
          };

          return [task, ...current];
        });
      },
      updateTask(id: string, draft: TaskDraft) {
        const client = normalizeClientName(draft.client);
        setClients((current) => mergeClients([{ ...draft, client, id, sortOrder: 0, timeEntries: [], statusChangedAt: "", priorityChangedAt: "", createdAt: "", updatedAt: new Date().toISOString() }], current));
        setTasks((current) =>
          current.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...draft,
                  client,
                  clientLogoUrl: undefined,
                  category: normalizeCategory(draft.category),
                  statusChangedAt:
                    task.status === draft.status ? task.statusChangedAt : new Date().toISOString(),
                  priorityChangedAt:
                    task.priority === draft.priority ? task.priorityChangedAt : new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              : task
          )
        );
      },
      deleteTask(id: string) {
        setTasks((current) => current.filter((task) => task.id !== id));
      },
      setStatus(id: string, status: Task["status"]) {
        setTasks((current) =>
          current.map((task) => {
            const now = new Date().toISOString();

            if (status === "In Progress") {
              const taskWithClosedTimer = task.activeTimerStartedAt ? closeTimer(task, now) : task;

              if (task.id === id) {
                return {
                  ...task,
                  status,
                  activeTimerStartedAt: task.activeTimerStartedAt || now,
                  statusChangedAt: task.status === status ? task.statusChangedAt : now,
                  updatedAt: now
                };
              }

              return taskWithClosedTimer.activeTimerStartedAt
                ? taskWithClosedTimer
                : {
                    ...taskWithClosedTimer,
                    status:
                      taskWithClosedTimer.status === "In Progress"
                        ? "Waiting"
                        : taskWithClosedTimer.status,
                    statusChangedAt:
                      taskWithClosedTimer.status === "In Progress" ? now : taskWithClosedTimer.statusChangedAt,
                    updatedAt: taskWithClosedTimer.status === "In Progress" ? now : task.updatedAt
                  };
            }

            if (task.id !== id) {
              return task;
            }

            const closed = status === "Done" || status === "Waiting" ? closeTimer(task, now) : task;

            return {
              ...closed,
              status,
              statusChangedAt: closed.status === status ? closed.statusChangedAt : now,
              updatedAt: now
            };
          })
        );
      },
      setPriority(id: string, priority: Priority) {
        setTasks((current) =>
          current.map((task) => {
            if (task.id !== id) {
              return task;
            }

            const samePriority = current.filter((item) => item.priority === priority && item.id !== id);
            const firstSortOrder =
              samePriority.length > 0 ? Math.min(...samePriority.map((item) => item.sortOrder)) : 0;

            return {
              ...task,
              priority,
              sortOrder: task.priority === priority ? task.sortOrder : firstSortOrder - 1,
              priorityChangedAt:
                task.priority === priority ? task.priorityChangedAt : new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          })
        );
      },
      reorderTask(draggedId: string, targetId: string | null, targetPriority: Priority) {
        setTasks((current) => {
          const moving = current.find((task) => task.id === draggedId);

          if (!moving) {
            return current;
          }

          const now = new Date().toISOString();
          const sourcePriority = moving.priority;
          const targetColumn = sortWithinPriority(
            current
              .filter((task) => task.priority === targetPriority && task.id !== draggedId)
              .map((task) => ({ ...task }))
          );
          const insertIndex = targetId
            ? Math.max(0, targetColumn.findIndex((task) => task.id === targetId))
            : targetColumn.length;
          const nextMoving: Task = {
            ...moving,
            priority: targetPriority,
            priorityChangedAt: sourcePriority === targetPriority ? moving.priorityChangedAt : now,
            updatedAt: now
          };
          const nextTargetColumn = [
            ...targetColumn.slice(0, insertIndex),
            nextMoving,
            ...targetColumn.slice(insertIndex)
          ].map((task, index) => ({ ...task, sortOrder: index }));
          const affectedPriorities = new Set<Priority>([sourcePriority, targetPriority]);
          const reorderedSourceColumn =
            sourcePriority === targetPriority
              ? []
              : sortWithinPriority(
                  current
                    .filter((task) => task.priority === sourcePriority && task.id !== draggedId)
                    .map((task, index) => ({ ...task, sortOrder: index }))
                );
          const replacements = new Map<string, Task>();

          nextTargetColumn.forEach((task) => replacements.set(task.id, task));
          reorderedSourceColumn.forEach((task, index) =>
            replacements.set(task.id, { ...task, sortOrder: index, updatedAt: now })
          );

          return current.map((task) => {
            const replacement = replacements.get(task.id);

            if (replacement) {
              return replacement;
            }

            return affectedPriorities.has(task.priority) && task.id === draggedId ? nextMoving : task;
          });
        });
      },
      toggleToday(id: string) {
        setTasks((current) =>
          current.map((task) =>
            task.id === id
              ? { ...task, isToday: !task.isToday, updatedAt: new Date().toISOString() }
              : task
          )
        );
      },
      updateTaskFields(id: string, patch: Partial<TaskDraft>) {
        if (patch.client) {
          const now = new Date().toISOString();
          const client = normalizeClientName(patch.client);
          setClients((current) =>
            mergeClients(
              [{ client, id, title: "", category: "Client Delivery", priority: "Medium", estimatedTime: "", status: "Not Started", invoiceStatus: "Not Needed", recurrence: "None", isToday: false, sortOrder: 0, nextStep: "", focusChecklist: [], notes: "", timeEntries: [], statusChangedAt: now, priorityChangedAt: now, createdAt: now, updatedAt: now }],
              current
            )
          );
        }

        setTasks((current) =>
          current.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...patch,
                  category: patch.category ? normalizeCategory(patch.category) : task.category,
                  statusChangedAt:
                    patch.status && task.status !== patch.status ? new Date().toISOString() : task.statusChangedAt,
                  priorityChangedAt:
                    patch.priority && task.priority !== patch.priority
                      ? new Date().toISOString()
                      : task.priorityChangedAt,
                  updatedAt: new Date().toISOString()
                }
              : task
          )
        );
      },
      importTasks(nextTasks: Task[], nextClients: ClientRecord[] = []) {
        const normalized = nextTasks.map((task, index) => stampTask(task, index));
        setTasks(normalized);
        setClients((current) => mergeClients(normalized, [...current, ...nextClients]));
        window.localStorage.setItem(storageKey, JSON.stringify(normalized));
      },
      resetSeedData() {
        setTasks(seedTasks);
        setClients(mergeClients(seedTasks));
        window.localStorage.setItem(storageKey, JSON.stringify(seedTasks));
        window.localStorage.setItem(clientsStorageKey, JSON.stringify(mergeClients(seedTasks)));
      },
      setClientLogo(clientName: string, logoUrl: string) {
        const now = new Date().toISOString();
        const name = normalizeClientName(clientName);

        setClients((current) => {
          const existing = current.find((client) => client.name.toLowerCase() === name.toLowerCase());
          const nextClient: ClientRecord = {
            name: existing?.name || name,
            logoUrl: logoUrl.trim() || undefined,
            createdAt: existing?.createdAt || now,
            updatedAt: now
          };
          const others = current.filter((client) => client.name.toLowerCase() !== name.toLowerCase());

          return [...others, nextClient].sort((a, b) => a.name.localeCompare(b.name));
        });
      }
    }),
    []
  );

  return { tasks, clients, ...actions };
}
