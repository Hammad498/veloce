import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="flex gap-4 p-6 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-none w-72">
            <Skeleton className="h-5 w-28 mb-3" />
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-28 mb-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
