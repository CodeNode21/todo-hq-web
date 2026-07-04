import { useEffect, useState } from "react";
import { categories, priorities } from "@/lib/task-utils";
import {
  invoiceStatuses,
  recurrences,
  statuses,
  type Category,
  type ClientRecord,
  type InvoiceStatus,
  type Priority,
  type Recurrence,
  type Status,
  type Task,
  type TaskDraft
} from "@/types/task";

const blankDraft: TaskDraft = {
  title: "",
  client: "",
  clientLogoUrl: "",
  category: "Client Delivery",
  priority: "Medium",
  estimatedTime: "",
  deadline: "",
  status: "Not Started",
  invoiceStatus: "Not Needed",
  recurrence: "None",
  isToday: false,
  nextStep: "",
  focusChecklist: [],
  notes: ""
};

type TaskModalProps = {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (task: TaskDraft) => void;
  clients: ClientRecord[];
};

export function TaskModal({ isOpen, task, onClose, onSave, clients }: TaskModalProps) {
  const [draft, setDraft] = useState<TaskDraft>(blankDraft);

  useEffect(() => {
    if (task) {
      const {
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        timeEntries: _timeEntries,
        activeTimerStartedAt: _activeTimerStartedAt,
        statusChangedAt: _statusChangedAt,
        priorityChangedAt: _priorityChangedAt,
        sortOrder: _sortOrder,
        ...editable
      } = task;
      setDraft(editable);
    } else {
      setDraft(blankDraft);
    }
  }, [task, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField<K extends keyof TaskDraft>(field: K, value: TaskDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) {
      return;
    }

    onSave({
      ...draft,
      title: draft.title.trim(),
      client: draft.client.trim() || "Unassigned",
      clientLogoUrl: undefined,
      estimatedTime: draft.estimatedTime.trim() || "TBD",
      deadline: draft.deadline?.trim() || undefined,
      nextStep: draft.nextStep.trim(),
      focusChecklist: draft.focusChecklist.map((item) => item.trim()).filter(Boolean),
      notes: draft.notes.trim()
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex h-dvh max-h-dvh items-center justify-center overflow-hidden bg-black/70 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-6">
      <form
        onSubmit={submit}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-white/10 bg-deck-900 p-5 shadow-2xl shadow-black sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200/70">
              {task ? "Edit Task" : "New Task"}
            </p>
            <h2 className="mt-1 text-3xl font-bold text-white">
              {task ? "Update command card" : "Add command card"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:border-sky-300/50"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input
              required
              value={draft.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="input"
              placeholder="Task title"
            />
          </Field>
          <Field label="Client Title">
            <input
              value={draft.client}
              onChange={(event) => updateField("client", event.target.value)}
              list="task-client-options"
              className="input"
              placeholder="Client or project"
            />
            <datalist id="task-client-options">
              {clients.map((clientOption) => (
                <option key={clientOption.name} value={clientOption.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Category">
            <select
              value={draft.category}
              onChange={(event) => updateField("category", event.target.value as Category)}
              className="input"
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              value={draft.priority}
              onChange={(event) => updateField("priority", event.target.value as Priority)}
              className="input"
            >
              {priorities.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </Field>
          <Field label="Estimated Time">
            <input
              value={draft.estimatedTime}
              onChange={(event) => updateField("estimatedTime", event.target.value)}
              className="input"
              placeholder="2-4 hrs"
            />
          </Field>
          <Field label="Deadline">
            <input
              value={draft.deadline ?? ""}
              onChange={(event) => updateField("deadline", event.target.value)}
              className="input"
              placeholder="Optional"
            />
          </Field>
          <Field label="Status">
            <select
              value={draft.status}
              onChange={(event) => updateField("status", event.target.value as Status)}
              className="input"
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
          <Field label="Invoice Status">
            <select
              value={draft.invoiceStatus}
              onChange={(event) => updateField("invoiceStatus", event.target.value as InvoiceStatus)}
              className="input"
            >
              {invoiceStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
          <Field label="Recurrence">
            <select
              value={draft.recurrence}
              onChange={(event) => updateField("recurrence", event.target.value as Recurrence)}
              className="input"
            >
              {recurrences.map((recurrence) => (
                <option key={recurrence}>{recurrence}</option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <input
              type="checkbox"
              checked={draft.isToday}
              onChange={(event) => updateField("isToday", event.target.checked)}
              className="h-4 w-4 accent-sky-300"
            />
            <span className="text-sm font-bold text-slate-300">Pin to Today Focus</span>
          </label>
          <Field label="Notes" wide>
            <textarea
              value={draft.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              className="input min-h-28 resize-y"
              placeholder="Context, next step, delivery notes"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 px-4 py-3 font-bold text-slate-200 hover:border-sky-300/50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-sky-300 px-5 py-3 font-bold text-slate-950 hover:bg-sky-200"
          >
            Save Task
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  wide = false,
  children
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      {children}
    </label>
  );
}
