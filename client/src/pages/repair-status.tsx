import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusTimeline, InteractiveStatusTimeline } from "@/components/repairs/status-timeline";
import { StatusHistory } from "@/components/repairs/status-history";
import { StatusUpdateDialog } from "@/components/repairs/status-update-dialog";
import { type StatusHistoryEntry } from "@/components/repairs/status-history";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function RepairStatusPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const repairId = parseInt(params.id);
  
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Define repair type
  interface Repair {
    id: number;
    status: string;
    clientId: number;
    clientName?: string;
    inverterId: number;
    inverterModel?: string;
    inverterSerial?: string;
    faultTypeId: number | null;
    faultTypeName?: string;
    faultDescription: string | null;
    receivedDate: Date;
    estimatedCompletionDate: Date | null;
    technicianName: string | null;
    technicianNotes: string | null;
    laborHours: number | null;
    statusHistory: StatusHistoryEntry[];
    [key: string]: any;
  }

  // Fetch repair details
  const { data: repair, isLoading, error } = useQuery<Repair>({
    queryKey: [`/api/repairs/${repairId}`],
    enabled: !isNaN(repairId)
  });

  // Fetch client data
  const { data: client } = useQuery({
    queryKey: [`/api/clients/${repair?.clientId}`],
    enabled: !!repair?.clientId,
  });

  // Fetch fault type data
  const { data: faultType } = useQuery({
    queryKey: [`/api/fault-types/${repair?.faultTypeId}`],
    enabled: !!repair?.faultTypeId,
  });
  
  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: string, note: string }) => {
      return apiRequest(
        'PATCH',
        `/api/repairs/${repairId}/status`,
        { status, notes: note }
      );
    },
    onSuccess: () => {
      // Invalidate repair data to refresh UI
      queryClient.invalidateQueries({ queryKey: [`/api/repairs/${repairId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/repairs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/repairs/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/repairs/recent'] });
      
      // Close dialog
      setIsDialogOpen(false);
      setTargetStatus(null);
    }
  });
  
  // Handler for status change
  const handleStatusChange = (newStatus: string) => {
    setTargetStatus(newStatus);
    setIsDialogOpen(true);
  };
  
  // Handler for status update confirmation
  const handleStatusUpdateConfirm = (note: string) => {
    if (targetStatus) {
      updateStatusMutation.mutate({ status: targetStatus, note });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !repair) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load repair data. Please try again.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setLocation('/repairs')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Repairs
        </Button>
      </div>
    );
  }

  // Make sure status history is an array
  const statusHistory: StatusHistoryEntry[] = Array.isArray(repair.statusHistory) 
    ? repair.statusHistory 
    : [];
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Repair Status Tracking</h1>
        <Button variant="outline" onClick={() => setLocation(`/repairs/${repairId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Repair Details
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Repair #{repairId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <p><strong>Client:</strong> {client?.name || 'Loading...'}</p>
              <p><strong>Inverter:</strong> {repair.inverterModel || "Not specified"} {repair.inverterSerialNumber && `(S/N: ${repair.inverterSerialNumber})`}</p>
              <p><strong>Received Date:</strong> {new Date(repair.receivedDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>Current Status:</strong> {repair.status}</p>
              <p><strong>Fault Type:</strong> {faultType?.name || 'Loading...'}</p>
              <p><strong>Fault Description:</strong> {repair.faultDescription || 'No description provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Status Timeline</h2>
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <InteractiveStatusTimeline 
            currentStatus={repair.status}
            statusHistory={statusHistory}
            onStatusChange={handleStatusChange}
            editable={true}
            repairId={repairId}
          />
        </div>
      </div>
      
      <div className="mb-8">
        <StatusHistory history={statusHistory} />
      </div>
      
      {/* Status Update Dialog */}
      <StatusUpdateDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleStatusUpdateConfirm}
        currentStatus={repair.status}
        newStatus={targetStatus || ''}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
}