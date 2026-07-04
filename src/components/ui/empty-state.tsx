export function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.025] px-4 py-8 text-center">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
    </div>
  );
}
