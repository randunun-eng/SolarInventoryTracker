import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Loader2, File, Info, Edit, ShoppingCart, ExternalLink, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComponentAnalysis from "./component-analysis";

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
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Component Image and Datasheet */}
              <div className="md:col-span-1">
                <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-center h-64 overflow-hidden">
                  {component.image ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={component.image} 
                        alt={component.name} 
                        className="max-h-full max-w-full object-contain mx-auto"
                        onClick={() => window.open(component.image, '_blank')}
                        style={{ cursor: 'zoom-in' }}
                      />
                      <div className="absolute bottom-0 right-0 bg-white bg-opacity-70 p-1 rounded-tl text-xs">
                        Click to enlarge
                      </div>
                    </div>
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
                
                <div className="flex flex-col space-y-4">
                  <Button 
                    variant="outline"
                    onClick={() => componentId && onEdit(componentId)}
                    className="self-end"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  
                  <div className="pt-2 border-t border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Order from:</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {supplier?.website && (
                        <Button 
                          asChild 
                          size="sm" 
                          variant="default"
                          className="flex-1"
                        >
                          <a 
                            href={supplier.website}
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ShoppingCart className="mr-1 h-4 w-4" />
                            {supplier.name}
                          </a>
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        asChild 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                      >
                        <a 
                          href={`https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(component.name)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ShoppingCart className="mr-1 h-4 w-4" />
                          Alibaba
                        </a>
                      </Button>
                      <Button 
                        asChild 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                      >
                        <a 
                          href={`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(component.name)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ShoppingCart className="mr-1 h-4 w-4" />
                          AliExpress
                        </a>
                      </Button>
                      <Button 
                        asChild 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                      >
                        <a 
                          href={`https://s.taobao.com/search?q=${encodeURIComponent(component.name)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ShoppingCart className="mr-1 h-4 w-4" />
                          Taobao
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history" className="flex items-center">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase History
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center">
                  <Cpu className="mr-2 h-4 w-4" />
                  AI Analysis
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="history" className="mt-4">
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
              </TabsContent>
              
              <TabsContent value="analysis" className="mt-4">
                {componentId && (
                  <ComponentAnalysis 
                    componentId={componentId} 
                    componentName={component.name}
                    datasheetUrl={component.datasheet}
                  />
                )}
              </TabsContent>
            </Tabs>
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
