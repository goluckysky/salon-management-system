function Bone({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-muted/40 animate-pulse ${className ?? ''}`} />
  );
}

export function CardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex justify-between">
            <Bone className="w-10 h-10 rounded-xl" />
            <Bone className="w-16 h-5 rounded-full" />
          </div>
          <Bone className="w-20 h-7" />
          <Bone className="w-32 h-4" />
          <Bone className="w-24 h-3" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-border">
        <Bone className="w-40 h-5" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Bone className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="w-32 h-4" />
              <Bone className="w-48 h-3" />
            </div>
            <Bone className="w-16 h-4" />
            <Bone className="w-20 h-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Bone className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="w-28 h-4" />
              <Bone className="w-20 h-3" />
            </div>
          </div>
          <Bone className="w-full h-3" />
          <Bone className="w-3/4 h-3" />
          <div className="flex gap-2 pt-2">
            <Bone className="w-12 h-8 rounded-lg" />
            <Bone className="w-12 h-8 rounded-lg" />
            <Bone className="w-12 h-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ type = 'table' }: { type?: 'table' | 'cards' | 'dashboard' }) {
  if (type === 'dashboard') {
    return (
      <div className="p-6 space-y-5">
        <CardsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-3">
            <Bone className="w-40 h-5" />
            <Bone className="w-full h-48" />
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <Bone className="w-32 h-5" />
            <Bone className="w-full h-40 rounded-full mx-auto" style={{ maxWidth: 140 }} />
          </div>
        </div>
      </div>
    );
  }
  if (type === 'cards') {
    return (
      <div className="p-6 space-y-5">
        <div className="flex justify-between">
          <Bone className="w-48 h-9 rounded-xl" />
          <Bone className="w-32 h-9 rounded-xl" />
        </div>
        <CardGridSkeleton />
      </div>
    );
  }
  return (
    <div className="p-6 space-y-5">
      <div className="flex justify-between">
        <Bone className="w-48 h-9 rounded-xl" />
        <Bone className="w-32 h-9 rounded-xl" />
      </div>
      <TableSkeleton />
    </div>
  );
}
