export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true" aria-label="טוען מוצר">
      <div className="skeleton mb-6 h-4 w-64" />
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="skeleton aspect-[4/5] rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
