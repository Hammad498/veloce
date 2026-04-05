import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BriefLoading() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
      </Link>
      <Skeleton className="h-36 mb-4" />
      <Skeleton className="h-10 w-72 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
