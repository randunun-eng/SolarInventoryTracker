import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RepairForm } from "@/components/repair/repair-form";
import { RepairDetailModal } from "@/components/repair/repair-detail-modal";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Wrench,
  Filter,
  FileText,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDateTime, getStatusColor } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Repairs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isAddRepairOpen, setIsAddRepairOpen] = useState(false);
  const [isEditRepairOpen, setIsEditRepairOpen] = useState(false);
  const [editingRepairId, setEditingRepairId] = useState<number | null>(null);
  const [viewingRepairId, setViewingRepairId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch repairs
  const { data: repairs, isLoading: isLoadingRepairs } = useQuery({
    queryKey: ["/api/repairs"],
  });

  // Fetch clients to display client names
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Fetch inverters to display inverter details
  const { data: inverters } = useQuery({
    queryKey: ["/api/inverters"],
  });

  // Delete repair mutation
  const deleteRepairMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/repairs/${id}`),
    onSuccess: () => {
      toast({
        title: "Repair deleted",
        description: "The repair has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repairs"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete repair: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filtered repairs based on search term and status filter
  const filteredRepairs = repairs ? repairs.filter(repair => {
    // Apply status filter if set
    if (statusFilter && repair.status !== statusFilter) {
      return false;
    }

    // Apply search term if entered
    if (searchTerm) {
      // Check if client name matches (if clients data is available)
      const client = clients?.find(c => c.id === repair.clientId);
      const clientName = client?.name || '';
      
      // Check if inverter serial number matches (if inverters data is available)
      const inverter = inverters?.find(i => i.id === repair.inverterId);
      const inverterSerial = inverter?.serialNumber || '';
      
      // Check if repair ID matches
      const repairIdStr = repair.id.toString();
      
      return (
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inverterSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repairIdStr.includes(searchTerm)
      );
    }
    
    return true;
  }) : [];

  // Helper function to get client name
  const getClientName = (clientId?: number) => {
    if (!clientId || !clients) return "Unknown Client";
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  // Helper function to get inverter details
  const getInverterDetails = (inverterId?: number) => {
    if (!inverterId || !inverters) return "Unknown Inverter";
    const inverter = inverters.find(i => i.id === inverterId);
    return inverter ? `${inverter.model} - ${inverter.serialNumber}` : "Unknown Inverter";
  };

  const handleEditRepair = (id: number) => {
    setEditingRepairId(id);
    setIsEditRepairOpen(true);
  };

  const handleViewRepair = (id: number) => {
    setViewingRepairId(id);
    setIsDetailModalOpen(true);
  };

  const handleDeleteRepair = (id: number) => {
    if (confirm("Are you sure you want to delete this repair record?")) {
      deleteRepairMutation.mutate(id);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Repair Logs</h1>
          <p className="text-slate-500">Track and manage all solar inverter repairs</p>
        </div>
        <Button 
          className="mt-4 md:mt-0" 
          onClick={() => setIsAddRepairOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Repair Log
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search by client, serial number, or repair ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-slate-500" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Waiting for Parts">Waiting for Parts</SelectItem>
                  <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repairs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Repair Records</CardTitle>
          <CardDescription>
            {filteredRepairs.length} {filteredRepairs.length === 1 ? 'repair' : 'repairs'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRepairs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRepairs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Inverter</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRepairs.map((repair) => {
                    const statusColors = getStatusColor(repair.status);
                    return (
                      <TableRow key={repair.id}>
                        <TableCell className="font-medium">#{repair.id}</TableCell>
                        <TableCell>{getClientName(repair.clientId)}</TableCell>
                        <TableCell>{getInverterDetails(repair.inverterId)}</TableCell>
                        <TableCell>{formatDateTime(repair.receivedDate)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColors.bg} ${statusColors.text}`}>
                            {repair.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{repair.technicianName || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewRepair(repair.id)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditRepair(repair.id)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => window.open(`/api/repairs/${repair.id}/report`, '_blank')}
                            >
                              <FileText className="h-4 w-4 text-primary-500" />
                              <span className="sr-only">Report</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteRepair(repair.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wrench className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No repairs found</h3>
              <p className="text-sm text-slate-500 mb-4">
                {searchTerm || statusFilter
                  ? "Try adjusting your search or filter criteria"
                  : "Start by creating your first repair log"}
              </p>
              {!searchTerm && !statusFilter && (
                <Button 
                  variant="default" 
                  onClick={() => setIsAddRepairOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Repair Log
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Repair Dialog */}
      <Dialog open={isAddRepairOpen} onOpenChange={setIsAddRepairOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create New Repair Log</DialogTitle>
            <DialogDescription>
              Enter the details of the new repair
            </DialogDescription>
          </DialogHeader>
          <RepairForm onSuccess={() => setIsAddRepairOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Repair Dialog */}
      <Dialog open={isEditRepairOpen} onOpenChange={setIsEditRepairOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Repair</DialogTitle>
            <DialogDescription>
              Update the details of this repair
            </DialogDescription>
          </DialogHeader>
          <RepairForm 
            repairId={editingRepairId || undefined} 
            onSuccess={() => setIsEditRepairOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Repair Detail Modal */}
      <RepairDetailModal
        repairId={viewingRepairId}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={handleEditRepair}
      />
    </div>
  );
}
