export default function Loading() {
  return (
    <div className="p-8 max-w-7xl animate-pulse">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-white/10 rounded-2xl" />
        <div>
          <div className="h-8 w-72 bg-white/10 rounded-lg mb-2" />
          <div className="h-4 w-48 bg-white/5 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl" />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}