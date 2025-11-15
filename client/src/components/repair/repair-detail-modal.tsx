import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatCurrency, getStatusColor } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, Edit, Check, Clock, Plus, Download, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateRepairReport } from "@/lib/reportGenerator";
import { useAuth } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RepairDetailModalProps {
  repairId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: number) => void;
}

export function RepairDetailModal({ 
  repairId, 
  isOpen, 
  onClose, 
  onEdit 
}: RepairDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unitPrice, setUnitPrice] = useState<string>("0");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch repair data
  const { data: repair, isLoading: isLoadingRepair } = useQuery({
    queryKey: repairId ? [`/api/repairs/${repairId}`] : null,
    enabled: !!repairId && isOpen,
  });

  // Fetch client data if we have a repair
  const { data: client } = useQuery({
    queryKey: repair?.clientId ? [`/api/clients/${repair.clientId}`] : null,
    enabled: !!repair?.clientId,
  });

  // Fetch inverter data if we have a repair
  const { data: inverter } = useQuery({
    queryKey: repair?.inverterId ? [`/api/inverters/${repair.inverterId}`] : null,
    enabled: !!repair?.inverterId,
  });

  // Fetch fault type if we have a repair
  const { data: faultType } = useQuery({
    queryKey: repair?.faultTypeId ? [`/api/fault-types/${repair.faultTypeId}`] : null,
    enabled: !!repair?.faultTypeId,
  });

  // Fetch used components in this repair
  const { data: usedComponents, isLoading: isLoadingComponents } = useQuery({
    queryKey: repairId ? [`/api/repairs/${repairId}/components`] : null,
    enabled: !!repairId && isOpen,
  });

  // Fetch component details for each used component
  const componentDetails = useQuery({
    queryKey: usedComponents ? ['/api/components'] : null,
    enabled: !!usedComponents && usedComponents.length > 0,
  });

  // Fetch all available components for adding
  const { data: availableComponents } = useQuery({
    queryKey: ["/api/components"],
    enabled: isOpen,
  });

  // Add component mutation
  const addComponentMutation = useMutation({
    mutationFn: async (data: { repairId: number; componentId: number; quantity: number; unitPrice: number }) => {
      return apiRequest("POST", `/api/repairs/${data.repairId}/components`, {
        componentId: data.componentId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/repairs/${repairId}/components`] });
      queryClient.invalidateQueries({ queryKey: [`/api/repairs/${repairId}`] });
      setShowAddComponent(false);
      setSelectedComponentId("");
      setQuantity("1");
      setUnitPrice("0");
      toast({
        title: "Component added",
        description: "Component has been added to the repair successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add component: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddComponent = () => {
    if (!repairId || !selectedComponentId || !quantity || !unitPrice) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    addComponentMutation.mutate({
      repairId,
      componentId: parseInt(selectedComponentId),
      quantity: parseInt(quantity),
      unitPrice: parseFloat(unitPrice),
    });
  };

  const handleGeneratePDF = async () => {
    if (!repair || !repairId) {
      toast({
        title: "Error",
        description: "Repair data not available",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingPDF(true);
      
      // Fetch HTML template from server
      const response = await fetch(`/api/repairs/${repairId}/report`);
      if (!response.ok) {
        throw new Error('Failed to fetch report template');
      }
      
      const htmlContent = await response.text();
      
      // Create a new window/tab for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }
      
      // Write the HTML content to the new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      toast({
        title: "Success",
        description: "PDF report opened in new tab. Use your browser's print function to save as PDF.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!isOpen) return null;

  // Helper to get component name
  const getComponentName = (componentId: number) => {
    const component = componentDetails.data?.find(c => c.id === componentId);
    return component ? component.name : `Component #${componentId}`;
  };

  // Calculate repair summary costs
  const laborCost = (repair?.laborHours || 0) * (repair?.laborRate || 0);
  const partsCost = repair?.totalPartsCost || 0;
  const totalCost = repair?.totalCost || (laborCost + partsCost);

  const statusColors = repair?.status ? getStatusColor(repair.status) : { bg: "bg-gray-100", text: "text-gray-800" };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Repair Log #{repair?.id}</DialogTitle>
          <DialogDescription>
            View detailed information about this repair
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingRepair ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : repair ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Client and Device Info */}
            <div className="md:col-span-1">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">Client Information</h4>
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-500">Name</p>
                  <p className="text-sm text-slate-800">{client?.name || "N/A"}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-500">Contact</p>
                  <p className="text-sm text-slate-800">{client?.phone || "N/A"}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-500">Email</p>
                  <p className="text-sm text-slate-800">{client?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Address</p>
                  <p className="text-sm text-slate-800">{client?.address || "N/A"}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg mt-4">
                <h4 className="font-medium text-slate-800 mb-2">Device Information</h4>
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-500">Inverter Model</p>
                  <p className="text-sm text-slate-800">{repair.inverterModel || inverter?.model || "N/A"}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-500">Serial Number</p>
                  <p className="text-sm text-slate-800">{repair.inverterSerialNumber || inverter?.serialNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Warranty Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    inverter?.warrantyStatus === "Valid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {inverter?.warrantyStatus || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Repair Details */}
            <div className="md:col-span-2">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-slate-800">Repair Details</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                    {repair.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Received Date</p>
                    <p className="text-sm text-slate-800">{formatDateTime(repair.receivedDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Estimated Completion</p>
                    <p className="text-sm text-slate-800">{formatDateTime(repair.estimatedCompletionDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Technician</p>
                    <p className="text-sm text-slate-800">{repair.technicianName || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Labor Hours</p>
                    <p className="text-sm text-slate-800">{repair.laborHours || 0} hrs</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-500 mb-1">Fault Type</p>
                  <p className="text-sm text-slate-800">{faultType?.name || "Not categorized"}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-500 mb-1">Fault Description</p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                    {repair.faultDescription || "No description provided"}
                  </p>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-slate-500">Components Used</p>
                    {repair.status !== "Completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddComponent(!showAddComponent)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {usedComponents && usedComponents.length > 0 ? 'Add Component' : 'Add First Component'}
                      </Button>
                    )}
                  </div>

                  {/* Add Component Form */}
                  {showAddComponent && (
                    <div className="bg-slate-50 p-4 rounded-lg mb-4">
                      <h5 className="text-sm font-medium text-slate-700 mb-3">Add Component to Repair</h5>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <Label htmlFor="component-select" className="text-xs text-slate-600">Component</Label>
                          <Select value={selectedComponentId} onValueChange={setSelectedComponentId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select component" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableComponents?.map((component: any) => (
                                <SelectItem key={component.id} value={component.id.toString()}>
                                  {component.name} ({component.partNumber})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="quantity" className="text-xs text-slate-600">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="unit-price" className="text-xs text-slate-600">Unit Price</Label>
                          <Input
                            id="unit-price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddComponent}
                            disabled={addComponentMutation.isPending}
                          >
                            {addComponentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddComponent(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLoadingComponents ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : usedComponents && usedComponents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usedComponents.map((component) => (
                          <TableRow key={component.id}>
                            <TableCell>{getComponentName(component.componentId)}</TableCell>
                            <TableCell>{component.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(component.unitPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(component.quantity * component.unitPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={2}></TableCell>
                          <TableCell className="text-right font-medium">Parts Subtotal</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(partsCost)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={2}></TableCell>
                          <TableCell className="text-right font-medium">Labor ({repair.laborHours || 0} hrs @ {formatCurrency(repair.laborRate || 0)}/hr)</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(laborCost)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={2}></TableCell>
                          <TableCell className="text-right font-bold text-slate-800">Total</TableCell>
                          <TableCell className="text-right font-bold text-slate-800">{formatCurrency(totalCost)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-6 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">No components have been used in this repair yet.</p>
                      {repair.status === "Completed" && (
                        <p className="text-xs text-slate-400 mt-1">Repair is completed - no more components can be added</p>
                      )}
                    </div>
                  )}
                </div>
                
                {repair.technicianNotes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-500 mb-1">Technician Notes</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                      {repair.technicianNotes}
                    </p>
                  </div>
                )}
                
                {/* Display repair photos */}
                {repair.repairPhotos && repair.repairPhotos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-500 mb-2">Repair Photos</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {repair.repairPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={photo} 
                            alt={`Repair photo ${index + 1}`} 
                            className="h-40 w-full object-cover rounded-md border"
                            onClick={() => window.open(photo, '_blank')}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(photo, '_blank')}
                              className="bg-white"
                            >
                              View Full Size
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (repair.trackingToken) {
                        const trackingUrl = `${window.location.origin}/track/${repair.trackingToken}`;
                        navigator.clipboard.writeText(trackingUrl);
                        toast({
                          title: "Tracking Link Copied",
                          description: "Share this link with your customer to track their repair status.",
                        });
                      }
                    }}
                    disabled={!repair.trackingToken}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Copy Tracking Link
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4 text-blue-600" />
                    )}
                    {isGeneratingPDF ? 'Generating...' : 'Download PDF Report'}
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="outline"
                      onClick={() => repairId && onEdit(repairId)}
                      data-testid="button-edit-repair-modal"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Repair
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (repairId) {
                        window.location.href = `/repairs/${repairId}/status`;
                      }
                    }}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Status Timeline
                  </Button>
                  {repair.status !== "Completed" && (
                    <Button onClick={() => {/* Handle completion */}}>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Repair
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">Repair not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
