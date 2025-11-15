import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Package, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
  userId?: number | null;
  userName?: string | null;
}

interface PublicRepairData {
  id: number;
  status: string;
  receivedDate: string;
  estimatedCompletionDate: string | null;
  completionDate: string | null;
  faultDescription: string;
  inverterModel: string;
  inverterSerialNumber: string;
  statusHistory: StatusHistoryEntry[];
  clientName: string;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'received':
      return 'bg-blue-500';
    case 'diagnosing':
      return 'bg-yellow-500';
    case 'awaiting parts':
      return 'bg-orange-500';
    case 'in progress':
      return 'bg-purple-500';
    case 'testing':
      return 'bg-indigo-500';
    case 'completed':
      return 'bg-green-500';
    case 'ready for pickup':
      return 'bg-teal-500';
    case 'delivered':
      return 'bg-emerald-500';
    default:
      return 'bg-gray-500';
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return <CheckCircle2 className="h-5 w-5" />;
    case 'diagnosing':
    case 'in progress':
    case 'testing':
      return <Loader2 className="h-5 w-5 animate-spin" />;
    case 'awaiting parts':
      return <Clock className="h-5 w-5" />;
    default:
      return <Package className="h-5 w-5" />;
  }
}

export default function TrackRepair() {
  const [, params] = useRoute("/track/:token");
  const token = params?.token;

  const { data: repair, isLoading, error } = useQuery<PublicRepairData>({
    queryKey: ["/api/track", token],
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !repair) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Tracking Information Not Found</CardTitle>
            </div>
            <CardDescription>
              The tracking link may be invalid or expired. Please contact us if you need assistance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Repair Status Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your solar inverter repair in real-time</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Repair #{repair.id}</CardTitle>
                <CardDescription>{repair.clientName}</CardDescription>
              </div>
              <Badge className={`${getStatusColor(repair.status)} text-white flex items-center gap-2 px-3 py-1.5`}>
                {getStatusIcon(repair.status)}
                {repair.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inverter Model</p>
                <p className="text-base font-semibold">{repair.inverterModel || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Serial Number</p>
                <p className="text-base font-semibold">{repair.inverterSerialNumber || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fault Description</p>
              <p className="text-base">{repair.faultDescription || 'No description provided'}</p>
            </div>

            <Separator />

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  Received
                </div>
                <p className="text-base font-semibold">
                  {format(new Date(repair.receivedDate), "MMM dd, yyyy")}
                </p>
              </div>
              
              {repair.estimatedCompletionDate && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    Estimated Completion
                  </div>
                  <p className="text-base font-semibold">
                    {format(new Date(repair.estimatedCompletionDate), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
              
              {repair.completionDate && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed
                  </div>
                  <p className="text-base font-semibold">
                    {format(new Date(repair.completionDate), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {repair.statusHistory && repair.statusHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
              <CardDescription>Timeline of your repair progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...repair.statusHistory].reverse().map((entry, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full ${getStatusColor(entry.status)} flex items-center justify-center text-white`}>
                        {getStatusIcon(entry.status)}
                      </div>
                      {index < repair.statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">{entry.status}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(entry.timestamp), "MMM dd, yyyy • h:mm a")}
                        </p>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Questions about your repair? Contact us for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
