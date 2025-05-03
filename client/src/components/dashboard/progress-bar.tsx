import { cn } from "@/lib/utils";

interface ProgressBarProps {
  label: string;
  value: string | number;
  percentage: number;
  color?: string;
}

export function ProgressBar({ 
  label, 
  value, 
  percentage, 
  color = "bg-primary-600" 
}: ProgressBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-600">{value}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
          className={cn("h-2 rounded-full", color)} 
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
}
