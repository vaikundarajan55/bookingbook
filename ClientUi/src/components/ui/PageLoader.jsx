export default function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <div className="flex h-10 items-end gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="h-full w-1.5 origin-bottom animate-bars rounded-full bg-ocean-500" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
      <p className="text-sm font-medium text-ocean/70">{label}…</p>
    </div>
  );
}
