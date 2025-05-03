import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  change?: {
    value: number;
    label: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconBgColor, 
  iconColor,
  change
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
          </div>
          <div className={cn("p-3 rounded-full", iconBgColor)}>
            <Icon className={iconColor} />
          </div>
        </div>
        
        {change && (
          <div className="mt-4 flex items-center text-sm">
            <span 
              className={cn(
                "flex items-center", 
                change.type === 'increase' && "text-green-500",
                change.type === 'decrease' && "text-red-500",
                change.type === 'neutral' && "text-gray-500"
              )}
            >
              {change.type === 'increase' && <ArrowUp size={16} className="mr-1" />}
              {change.type === 'decrease' && <ArrowDown size={16} className="mr-1" />}
              {change.value}%
            </span>
            <span className="text-slate-500 ml-2">{change.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
