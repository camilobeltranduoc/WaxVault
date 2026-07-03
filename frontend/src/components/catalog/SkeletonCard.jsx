export default function SkeletonCard() {
  return (
    <div className="card !p-3 animate-pulse">
      <div className="aspect-square w-full bg-gray-200 rounded-lg mb-3" />
      <div className="px-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-3/5" />
        <div className="h-3 bg-gray-200 rounded w-2/5" />
      </div>
    </div>
  )
}
