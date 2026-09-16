export default function Loading() {
  return (
    <div className="p-8 max-w-6xl animate-pulse">
      <div className="h-9 w-80 bg-white/10 rounded-lg mb-3" />
      <div className="h-5 w-56 bg-white/5 rounded-lg mb-8" />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-96 bg-white/5 rounded-2xl" />
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}