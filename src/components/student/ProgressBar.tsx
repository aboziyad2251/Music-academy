import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  completedLessons: number;
  totalLessons: number;
  className?: string;
  hideText?: boolean;
}

export default function ProgressBar({
  completedLessons,
  totalLessons,
  className,
  hideText = false,
}: ProgressBarProps) {
  // Prevent NaN or Infinity if totalLessons is 0
  const validTotal = Math.max(1, totalLessons);
  const percentage = Math.round((completedLessons / validTotal) * 100);
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {!hideText && (
        <div className="flex justify-between text-sm font-medium text-slate-600">
          <span>Course Progress</span>
          <span>{completedLessons} of {totalLessons} lessons completed</span>
        </div>
      )}
      
      {/* 
        The shadcn Progress bar uses a generic background element. 
        We pass a manual styling string to change the internal indicator to our brand accent color (#7C4DFF).
      */}
      <Progress 
        value={clampedPercentage} 
        className="h-2.5 w-full bg-slate-100 [&>div]:bg-accent transition-all duration-500" 
      />
      
      {!hideText && (
        <div className="text-end text-xs text-slate-400 font-semibold mt-1">
          {clampedPercentage}%
        </div>
      )}
    </div>
  );
}
