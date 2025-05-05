import { cn } from "@/lib/utils";
import { Check, Clock, Hourglass, PackageOpen, Truck, Wrench } from "lucide-react";

// Define the repair status progression
const REPAIR_STATUSES = [
  { key: 'Received', icon: PackageOpen, label: 'Received' },
  { key: 'In Progress', icon: Wrench, label: 'In Progress' },
  { key: 'Waiting for Parts', icon: Truck, label: 'Waiting for Parts' },
  { key: 'Ready for Pickup', icon: PackageOpen, label: 'Ready for Pickup' },
  { key: 'Completed', icon: Check, label: 'Completed' }
];

// Get the index of a status in the progression
const getStatusIndex = (status: string) => {
  const index = REPAIR_STATUSES.findIndex(s => s.key === status);
  return index >= 0 ? index : 0; // Default to first status if not found
};

interface StatusTimelineProps {
  currentStatus: string;
  statusHistory?: Array<{ status: string; timestamp: Date | string }>;
  className?: string;
}

export function StatusTimeline({ 
  currentStatus, 
  statusHistory = [],
  className 
}: StatusTimelineProps) {
  // Get the current status index
  const currentStatusIndex = getStatusIndex(currentStatus);
  
  // Helper to check if a status has been completed
  const isStatusCompleted = (statusKey: string) => {
    const statusIndex = getStatusIndex(statusKey);
    return statusIndex < currentStatusIndex;
  };
  
  // Helper to check if a status is the current one
  const isCurrentStatus = (statusKey: string) => {
    return statusKey === currentStatus;
  };
  
  // Find the timestamp for a specific status from history
  const getStatusTimestamp = (statusKey: string) => {
    const historyEntry = statusHistory.find(entry => entry.status === statusKey);
    if (!historyEntry) return null;
    
    const timestamp = new Date(historyEntry.timestamp);
    return timestamp.toLocaleString();
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between w-full">
        {REPAIR_STATUSES.map((status, index) => {
          const isCompleted = isStatusCompleted(status.key);
          const isCurrent = isCurrentStatus(status.key);
          const timestamp = getStatusTimestamp(status.key);
          
          return (
            <div key={status.key} className="flex flex-col items-center">
              {/* Status icon */}
              <div 
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2",
                  isCompleted ? "bg-primary text-primary-foreground border-primary" :
                  isCurrent ? "bg-primary/20 text-primary border-primary" :
                  "bg-muted text-muted-foreground border-muted-foreground/50"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <Clock className="w-5 h-5 animate-pulse" />
                ) : (
                  <status.icon className="w-5 h-5" />
                )}
              </div>
              
              {/* Status name */}
              <span 
                className={cn(
                  "mt-2 text-xs font-medium text-center",
                  isCompleted || isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {status.label}
              </span>
              
              {/* Timestamp if available */}
              {timestamp && (
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {timestamp}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Connection lines between status points */}
      <div className="relative mt-[-34px] mx-[18px] z-0">
        <div className="absolute top-[19px] left-0 right-0 h-0.5 bg-muted-foreground/30" />
        {REPAIR_STATUSES.map((status, index) => {
          if (index === REPAIR_STATUSES.length - 1) return null;
          
          const isCompleted = index < currentStatusIndex;
          const width = `${100 / (REPAIR_STATUSES.length - 1)}%`;
          
          return (
            <div 
              key={`line-${status.key}`}
              className={cn(
                "absolute top-[19px] h-0.5",
                isCompleted ? "bg-primary" : "bg-transparent"
              )}
              style={{ 
                left: `${(index * 100) / (REPAIR_STATUSES.length - 1)}%`, 
                width 
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Interactive version with status change capabilities
interface InteractiveStatusTimelineProps extends StatusTimelineProps {
  onStatusChange?: (newStatus: string) => void;
  editable?: boolean;
  repairId?: number;
}

export function InteractiveStatusTimeline({
  currentStatus,
  statusHistory = [],
  onStatusChange,
  editable = false,
  repairId,
  className
}: InteractiveStatusTimelineProps) {
  // Get the current status index
  const currentStatusIndex = getStatusIndex(currentStatus);
  
  // Helper to check if a status has been completed
  const isStatusCompleted = (statusKey: string) => {
    const statusIndex = getStatusIndex(statusKey);
    return statusIndex < currentStatusIndex;
  };
  
  // Helper to check if a status is the current one
  const isCurrentStatus = (statusKey: string) => {
    return statusKey === currentStatus;
  };
  
  // Find the timestamp for a specific status from history
  const getStatusTimestamp = (statusKey: string) => {
    const historyEntry = statusHistory.find(entry => entry.status === statusKey);
    if (!historyEntry) return null;
    
    const timestamp = new Date(historyEntry.timestamp);
    return timestamp.toLocaleString();
  };
  
  // Handle status click for updates
  const handleStatusClick = (statusKey: string) => {
    if (!editable || !onStatusChange) return;
    
    // Only allow progressing to the next status or going back one step
    const currentIndex = getStatusIndex(currentStatus);
    const targetIndex = getStatusIndex(statusKey);
    
    if (targetIndex === currentIndex + 1 || targetIndex === currentIndex - 1) {
      onStatusChange(statusKey);
    }
  };
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between w-full">
        {REPAIR_STATUSES.map((status, index) => {
          const isCompleted = isStatusCompleted(status.key);
          const isCurrent = isCurrentStatus(status.key);
          const timestamp = getStatusTimestamp(status.key);
          
          // Check if this status is a valid next step
          const isNextStep = getStatusIndex(status.key) === getStatusIndex(currentStatus) + 1;
          const isPreviousStep = getStatusIndex(status.key) === getStatusIndex(currentStatus) - 1;
          const isClickable = editable && (isNextStep || isPreviousStep);
          
          return (
            <div 
              key={status.key} 
              className={cn(
                "flex flex-col items-center",
                isClickable && "cursor-pointer hover:opacity-80"
              )}
              onClick={() => isClickable && handleStatusClick(status.key)}
            >
              {/* Status icon */}
              <div 
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  isCompleted ? "bg-primary text-primary-foreground border-primary" :
                  isCurrent ? "bg-primary/20 text-primary border-primary" :
                  isNextStep && editable ? "bg-amber-50 text-amber-600 border-amber-400" :
                  "bg-muted text-muted-foreground border-muted-foreground/50"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <Clock className="w-5 h-5 animate-pulse" />
                ) : (
                  <status.icon className="w-5 h-5" />
                )}
              </div>
              
              {/* Status name */}
              <span 
                className={cn(
                  "mt-2 text-xs font-medium text-center",
                  isCompleted || isCurrent ? "text-primary" : 
                  isNextStep && editable ? "text-amber-600" : 
                  "text-muted-foreground"
                )}
              >
                {status.label}
              </span>
              
              {/* Timestamp if available */}
              {timestamp && (
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {timestamp}
                </span>
              )}
              
              {/* Next step indicator */}
              {isNextStep && editable && (
                <span className="mt-1 text-[10px] text-amber-600 font-medium">
                  Click to advance
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Connection lines between status points */}
      <div className="relative mt-[-34px] mx-[18px] z-0">
        <div className="absolute top-[19px] left-0 right-0 h-0.5 bg-muted-foreground/30" />
        {REPAIR_STATUSES.map((status, index) => {
          if (index === REPAIR_STATUSES.length - 1) return null;
          
          const isCompleted = index < currentStatusIndex;
          const width = `${100 / (REPAIR_STATUSES.length - 1)}%`;
          
          return (
            <div 
              key={`line-${status.key}`}
              className={cn(
                "absolute top-[19px] h-0.5 transition-colors",
                isCompleted ? "bg-primary" : "bg-transparent"
              )}
              style={{ 
                left: `${(index * 100) / (REPAIR_STATUSES.length - 1)}%`, 
                width 
              }}
            />
          );
        })}
      </div>
    </div>
  );
}