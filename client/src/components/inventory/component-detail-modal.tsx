import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Loader2, File, Info, Edit, ShoppingCart, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ComponentDetailModalProps {
  componentId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: number) => void;
}

export function ComponentDetailModal({ 
  componentId, 
  isOpen, 
  onClose, 
  onEdit 
}: ComponentDetailModalProps) {
  // Fetch component data
  const { data: component, isLoading: isLoadingComponent } = useQuery({
    queryKey: componentId ? [`/api/components/${componentId}`] : null,
    enabled: !!componentId && isOpen,
  });

  // Fetch category data if we have a component
  const { data: category } = useQuery({
    queryKey: component?.categoryId ? [`/api/categories/${component.categoryId}`] : null,
    enabled: !!component?.categoryId,
  });

  // Fetch supplier data if we have a component
  const { data: supplier } = useQuery({
    queryKey: component?.supplierId ? [`/api/suppliers/${component.supplierId}`] : null,
    enabled: !!component?.supplierId,
  });

  // Fetch purchase history
  const { data: purchases, isLoading: isLoadingPurchases } = useQuery({
    queryKey: componentId ? [`/api/components/${componentId}/purchases`] : null,
    enabled: !!componentId && isOpen,
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Component Details</DialogTitle>
          <DialogDescription>
            View detailed information about this component
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingComponent ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : component ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Component Image and Datasheet */}
            <div className="md:col-span-1">
              <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-center h-48">
                {component.image ? (
                  <img 
                    src={component.image} 
                    alt={component.name} 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <Info size={48} />
                    <span className="mt-2 text-sm">No image available</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Datasheet</h4>
                {component.datasheet ? (
                  <a 
                    href={component.datasheet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <File className="text-red-500 mr-2" size={16} />
                    Download Datasheet
                    <ExternalLink className="ml-1" size={12} />
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">No datasheet available</span>
                )}
              </div>
            </div>
            
            {/* Component Details */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                {component.name}
                {component.partNumber && ` - ${component.partNumber}`}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">Category</p>
                  <p className="text-base text-slate-800">{category?.name || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Current Stock</p>
                  <p className="text-base text-slate-800">
                    {component.currentStock || 0} units
                    {component.currentStock <= (component.minimumStock || 0) && (
                      <Badge variant="destructive" className="ml-2">Low Stock</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Minimum Stock Level</p>
                  <p className="text-base text-slate-800">{component.minimumStock || 0} units</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Location</p>
                  <p className="text-base text-slate-800">{component.location || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Unit Price</p>
                  <p className="text-base text-slate-800">{formatCurrency(component.supplierPrice)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Supplier</p>
                  <p className="text-base text-slate-800">{supplier?.name || "Not specified"}</p>
                </div>
              </div>
              
              {component.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
                  <p className="text-sm text-slate-600">{component.description}</p>
                </div>
              )}
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Purchase History</h4>
                {isLoadingPurchases ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </div>
                ) : purchases && purchases.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{formatDateTime(purchase.date)}</TableCell>
                          <TableCell>{supplier?.name || "Unknown"}</TableCell>
                          <TableCell>{purchase.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(purchase.unitPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-slate-500">No purchase history available</p>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => componentId && onEdit(componentId)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Order More
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">Component not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
