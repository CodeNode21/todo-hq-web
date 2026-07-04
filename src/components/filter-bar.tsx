import { useState } from "react";
import { priorities } from "@/lib/task-utils";
import type { Category, ClientRecord, Priority, TaskDraft } from "@/types/task";

type FilterBarProps = {
  categories: Category[];
  categoryFilter: Category | "All";
  hideCompleted: boolean;
  saveStatus: string;
  onAddTask: (task: TaskDraft) => void;
  onCategoryFilterChange: (category: Category | "All") => void;
  onHideCompletedChange: (hideCompleted: boolean) => void;
  onExportData: () => void;
  onExportTimeSummary: () => void;
  onImportData: (file: File) => void;
  onResetSeedData: () => void;
  clients: ClientRecord[];
};

export function FilterBar({
  categories,
  categoryFilter,
  hideCompleted,
  saveStatus,
  onAddTask,
  onCategoryFilterChange,
  onHideCompletedChange,
  onExportData,
  onExportTimeSummary,
  onImportData,
  onResetSeedData,
  clients
}: FilterBarProps) {
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [quickCategory, setQuickCategory] = useState<Category>("Client Delivery");
  const [priority, setPriority] = useState<Priority>("Medium");

  function submitQuickTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    onAddTask({
      title: title.trim(),
      client: client.trim() || "Unassigned",
      category: quickCategory,
      priority,
      estimatedTime: "TBD",
      status: "Not Started",
      invoiceStatus: quickCategory === "To Invoice" ? "Invoice Needed" : "Not Needed",
      recurrence: "None",
      isToday: false,
      nextStep: "",
      focusChecklist: [],
      notes: ""
    });
    setTitle("");
    setClient("");
  }

  return (
    <section className="grid min-w-0 max-w-full gap-2 border-y border-white/10 bg-white/[0.015] px-1 py-1.5 2xl:grid-cols-[auto_minmax(360px,1fr)_auto] 2xl:items-center 3xl:gap-3 3xl:px-2 3xl:py-2.5">
      <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:flex sm:flex-wrap 2xl:min-w-0 3xl:gap-2">
        {(["All", ...categories] as Array<Category | "All">).map((category) => {
          const active = categoryFilter === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryFilterChange(category)}
              className={`rounded border px-2.5 py-1 text-sm font-semibold transition 3xl:px-3 3xl:py-1.5 3xl:text-base ${
                active
                  ? "border-sky-300 bg-sky-300 text-slate-950"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-sky-300/50 hover:text-white"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={submitQuickTask}
        className="grid min-w-0 gap-1.5 md:grid-cols-[minmax(140px,1fr)_minmax(110px,.7fr)_140px_110px_auto] 2xl:min-w-0 3xl:grid-cols-[minmax(220px,1fr)_minmax(160px,.7fr)_180px_140px_auto] 3xl:gap-2"
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-w-0 rounded border border-white/10 bg-deck-950 px-2.5 py-1.5 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-sky-300/60 3xl:px-3 3xl:py-2 3xl:text-base"
          placeholder="Quick add task"
        />
        <input
          value={client}
          onChange={(event) => setClient(event.target.value)}
          list="quick-client-options"
          className="min-w-0 rounded border border-white/10 bg-deck-950 px-2.5 py-1.5 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-sky-300/60 3xl:px-3 3xl:py-2 3xl:text-base"
          placeholder="Client"
        />
        <datalist id="quick-client-options">
          {clients.map((clientOption) => (
            <option key={clientOption.name} value={clientOption.name} />
          ))}
        </datalist>
        <select
          value={quickCategory}
          onChange={(event) => setQuickCategory(event.target.value as Category)}
          className="min-w-0 rounded border border-white/10 bg-deck-950 px-2 py-1.5 text-sm font-bold text-white outline-none focus:border-sky-300/60 3xl:px-3 3xl:py-2 3xl:text-base"
        >
          {categories.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as Priority)}
          className="min-w-0 rounded border border-white/10 bg-deck-950 px-2 py-1.5 text-sm font-bold text-white outline-none focus:border-sky-300/60 3xl:px-3 3xl:py-2 3xl:text-base"
        >
          {priorities.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-sky-300 px-3 py-1.5 text-sm font-black text-slate-950 hover:bg-sky-200 3xl:px-5 3xl:py-2 3xl:text-base"
        >
          Add
        </button>
      </form>

      <div className="grid min-w-0 grid-cols-2 items-center gap-1.5 sm:flex sm:flex-wrap 2xl:justify-end 3xl:gap-2">
        <span className="rounded border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-sm font-semibold text-emerald-100 3xl:px-3 3xl:py-1.5 3xl:text-base">
          {saveStatus}
        </span>
        <button
          type="button"
          onClick={() => onHideCompletedChange(!hideCompleted)}
          className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm font-semibold text-slate-200 hover:border-sky-300/50 3xl:px-3 3xl:py-1.5 3xl:text-base"
        >
          <span className="sm:hidden">{hideCompleted ? "Completed" : "Hide Done"}</span>
          <span className="hidden sm:inline">{hideCompleted ? "Show Completed" : "Hide Completed"}</span>
        </button>
        <button
          type="button"
          onClick={onExportData}
          className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm font-semibold text-slate-200 hover:border-sky-300/50 3xl:px-3 3xl:py-1.5 3xl:text-base"
        >
          Export
        </button>
        <button
          type="button"
          onClick={onExportTimeSummary}
          className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm font-semibold text-slate-200 hover:border-sky-300/50 3xl:px-3 3xl:py-1.5 3xl:text-base"
        >
          Time CSV
        </button>
        <label className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm font-semibold text-slate-200 hover:border-sky-300/50 3xl:px-3 3xl:py-1.5 3xl:text-base">
          Import
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onImportData(file);
                event.target.value = "";
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={onResetSeedData}
          className="rounded border border-red-300/20 bg-red-950/20 px-2.5 py-1 text-sm font-semibold text-red-100 hover:border-red-300/50 3xl:px-3 3xl:py-1.5 3xl:text-base"
        >
          <span className="sm:hidden">Reset</span>
          <span className="hidden sm:inline">Reset Seed Data</span>
        </button>
      </div>
    </section>
  );
}
