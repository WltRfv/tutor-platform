export default function Loading() {
  return (
    <div className="p-8 max-w-7xl animate-pulse">
      <div className="h-9 w-64 bg-white/10 rounded-lg mb-3" />
      <div className="h-5 w-96 bg-white/5 rounded-lg mb-8" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl" />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-64 bg-white/5 rounded-2xl" />
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}