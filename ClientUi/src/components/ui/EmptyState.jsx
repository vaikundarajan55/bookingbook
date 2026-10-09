export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ocean/20 bg-white/60 px-6 py-14 text-center">
      {Icon && <Icon className="mb-4 text-ocean-500" size={34} strokeWidth={1.5} />}
      <h3 className="text-xl font-semibold text-ocean">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink/60">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
