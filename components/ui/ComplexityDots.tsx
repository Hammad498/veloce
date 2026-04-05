import { cn } from "@/lib/utils";

const colors = ["", "bg-emerald-400", "bg-lime-400", "bg-amber-400", "bg-orange-400", "bg-red-500"];

export function ComplexityDots({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Complexity: ${score}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={cn("w-1.5 h-1.5 rounded-full", n <= score ? colors[score] : "bg-gray-200")} />
      ))}
    </div>
  );
}
