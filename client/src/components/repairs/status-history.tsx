import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export type StatusHistoryEntry = {
  status: string;
  timestamp: Date | string;
  note?: string;
  userId?: number;
  userName?: string;
  photos?: string[];
};

interface StatusHistoryProps {
  history: StatusHistoryEntry[];
  className?: string;
}

export function StatusHistory({ history, className }: StatusHistoryProps) {
  // Sort history entries by timestamp (newest first)
  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No status history recorded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Status History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedHistory.map((entry, index) => {
          const date = new Date(entry.timestamp);
          
          return (
            <div key={index} className="space-y-2">
              {index > 0 && <Separator />}
              
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <Badge variant="outline" className="self-start mb-1">
                    {entry.status}
                  </Badge>
                  
                  {entry.note && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {entry.note}
                    </p>
                  )}

                  {entry.photos && entry.photos.length > 0 && (
                    <div className="mt-2">
                      <div className="grid grid-cols-2 gap-2 max-w-md">
                        {entry.photos.map((photo, photoIndex) => (
                          <img
                            key={photoIndex}
                            src={photo}
                            alt={`Status update photo ${photoIndex + 1}`}
                            className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(photo, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {entry.userName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated by: {entry.userName}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  <span title={date.toLocaleString()}>
                    {format(date, "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}