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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ComponentForm } from "@/components/inventory/component-form";
import { ComponentDetailModal } from "@/components/inventory/component-detail-modal";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Cpu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, getStockLevelColor } from "@/lib/utils";

export default function Components() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [isEditComponentOpen, setIsEditComponentOpen] = useState(false);
  const [editingComponentId, setEditingComponentId] = useState<number | null>(null);
  const [viewingComponentId, setViewingComponentId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch components
  const { data: components, isLoading: isLoadingComponents } = useQuery({
    queryKey: ["/api/components"],
  });

  // Fetch categories to display category names
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Delete component mutation
  const deleteComponentMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/components/${id}`),
    onSuccess: () => {
      toast({
        title: "Component deleted",
        description: "The component has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete component: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filtered components based on search term
  const filteredComponents = components ? components.filter(component => 
    component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (component.partNumber && component.partNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  // Helper function to get category name
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId || !categories) return "Uncategorized";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const handleEditComponent = (id: number) => {
    setEditingComponentId(id);
    setIsEditComponentOpen(true);
  };

  const handleViewComponent = (id: number) => {
    setViewingComponentId(id);
    setIsDetailModalOpen(true);
  };

  const handleDeleteComponent = (id: number) => {
    if (confirm("Are you sure you want to delete this component?")) {
      deleteComponentMutation.mutate(id);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Components</h1>
          <p className="text-slate-500">Manage your electronic component inventory</p>
        </div>
        <Button 
          className="mt-4 md:mt-0" 
          onClick={() => setIsAddComponentOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Component
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search components by name or part number..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Inventory</CardTitle>
          <CardDescription>
            {filteredComponents.length} {filteredComponents.length === 1 ? 'component' : 'components'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingComponents ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredComponents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComponents.map((component) => {
                    const stockLevel = getStockLevelColor(component.currentStock || 0, component.minimumStock || 0);
                    return (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">{component.name}</TableCell>
                        <TableCell>{getCategoryName(component.categoryId)}</TableCell>
                        <TableCell>{component.partNumber || "—"}</TableCell>
                        <TableCell>{component.location || "—"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockLevel.bg} ${stockLevel.text}`}>
                            {component.currentStock || 0} {(component.currentStock || 0) <= (component.minimumStock || 0) && "❗"}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(component.supplierPrice)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewComponent(component.id)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditComponent(component.id)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteComponent(component.id)}
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
              <Cpu className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No components found</h3>
              <p className="text-sm text-slate-500 mb-4">
                {searchTerm 
                  ? `No components matching "${searchTerm}"`
                  : "Start by adding your first component to the inventory"}
              </p>
              {!searchTerm && (
                <Button 
                  variant="default" 
                  onClick={() => setIsAddComponentOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Component
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Component Dialog */}
      <Dialog open={isAddComponentOpen} onOpenChange={setIsAddComponentOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add New Component</DialogTitle>
            <DialogDescription>
              Enter the details of the new component to add to inventory
            </DialogDescription>
          </DialogHeader>
          <ComponentForm onSuccess={() => setIsAddComponentOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Component Dialog */}
      <Dialog open={isEditComponentOpen} onOpenChange={setIsEditComponentOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Component</DialogTitle>
            <DialogDescription>
              Update the details of this component
            </DialogDescription>
          </DialogHeader>
          <ComponentForm 
            componentId={editingComponentId || undefined} 
            onSuccess={() => setIsEditComponentOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Component Detail Modal */}
      <ComponentDetailModal
        componentId={viewingComponentId}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={handleEditComponent}
      />
    </div>
  );
}
