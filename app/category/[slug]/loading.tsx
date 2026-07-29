export default function CategoryLoading() {
  return (
    <div aria-busy="true" aria-label="טוען קטגוריה">
      <div className="bg-navy-deep py-14">
        <div className="mx-auto max-w-2xl space-y-3 px-4 text-center">
          <div className="skeleton mx-auto h-9 w-56 !bg-white/10" />
          <div className="skeleton mx-auto h-4 w-72 !bg-white/10" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton aspect-[4/5] rounded-2xl" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
