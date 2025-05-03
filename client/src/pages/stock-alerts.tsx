import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, getStockLevelColor } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function StockAlerts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  // Fetch low stock components
  const { data: lowStockComponents, isLoading: isLoadingLowStock } = useQuery({
    queryKey: ["/api/components/low-stock"],
  });

  // Fetch categories to allow filtering
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Filtered components based on search term and category filter
  const filteredComponents = lowStockComponents ? lowStockComponents.filter(component => {
    // Apply category filter if set
    if (categoryFilter && component.categoryId !== parseInt(categoryFilter)) {
      return false;
    }

    // Apply search term if entered
    if (searchTerm) {
      return (
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (component.partNumber && component.partNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return true;
  }) : [];

  // Helper function to get category name
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId || !categories) return "Uncategorized";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Calculate stock percentage based on minimum stock
  const calculateStockPercentage = (current: number, minimum: number) => {
    if (minimum === 0) return 0;
    const percentage = (current / minimum) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  // Group components by level of urgency
  const urgentItems = filteredComponents.filter(c => c.currentStock === 0);
  const criticalItems = filteredComponents.filter(c => c.currentStock > 0 && c.currentStock <= (c.minimumStock || 0) * 0.5);
  const warningItems = filteredComponents.filter(
    c => c.currentStock > (c.minimumStock || 0) * 0.5 && c.currentStock <= (c.minimumStock || 0)
  );

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stock Alerts</h1>
          <p className="text-slate-500">View and manage components with low inventory levels</p>
        </div>
        <Link href="/components">
          <Button className="mt-4 md:mt-0">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Order Components
          </Button>
        </Link>
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
            <div className="w-full md:w-64">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-slate-500" />
                    <SelectValue placeholder="Filter by category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-red-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-red-800">Out of Stock</p>
                <p className="text-2xl font-bold text-red-900">{urgentItems.length}</p>
              </div>
              <div className="bg-red-100 text-red-600 p-3 rounded-full">
                <AlertTriangle />
              </div>
            </div>
            <p className="text-sm text-red-700 mt-2">Immediate attention required</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-orange-800">Critically Low</p>
                <p className="text-2xl font-bold text-orange-900">{criticalItems.length}</p>
              </div>
              <div className="bg-orange-100 text-orange-600 p-3 rounded-full">
                <AlertTriangle />
              </div>
            </div>
            <p className="text-sm text-orange-700 mt-2">Less than 50% of minimum stock</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-yellow-800">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-900">{warningItems.length}</p>
              </div>
              <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full">
                <AlertTriangle />
              </div>
            </div>
            <p className="text-sm text-yellow-700 mt-2">Below minimum stock level</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Components Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Low Stock Components</CardTitle>
          <CardDescription>
            {filteredComponents.length} {filteredComponents.length === 1 ? 'component' : 'components'} below minimum stock level
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLowStock ? (
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
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Minimum Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComponents.map((component) => {
                    const stockLevel = getStockLevelColor(component.currentStock || 0, component.minimumStock || 0);
                    const stockPercentage = calculateStockPercentage(
                      component.currentStock || 0,
                      component.minimumStock || 0
                    );
                    
                    return (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">{component.name}</TableCell>
                        <TableCell>{getCategoryName(component.categoryId)}</TableCell>
                        <TableCell>{component.partNumber || "—"}</TableCell>
                        <TableCell>{component.currentStock || 0}</TableCell>
                        <TableCell>{component.minimumStock || 0}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Badge 
                              className={`${stockLevel.bg} ${stockLevel.text}`}
                            >
                              {component.currentStock === 0
                                ? "Out of Stock"
                                : component.currentStock <= (component.minimumStock || 0) * 0.5
                                ? "Critically Low"
                                : "Low Stock"}
                            </Badge>
                            <Progress 
                              value={stockPercentage} 
                              className={`h-2 ${
                                stockPercentage === 0 
                                  ? "bg-red-200" 
                                  : stockPercentage <= 50 
                                  ? "bg-orange-200" 
                                  : "bg-yellow-200"
                              }`}
                              indicatorClassName={`${
                                stockPercentage === 0 
                                  ? "bg-red-500" 
                                  : stockPercentage <= 50 
                                  ? "bg-orange-500" 
                                  : "bg-yellow-500"
                              }`}
                            />
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(component.supplierPrice)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/components/${component.id}`}>
                            <Button variant="outline" size="sm">
                              Order More
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No low stock components found</h3>
              <p className="text-sm text-slate-500 mb-4">
                {searchTerm || categoryFilter
                  ? "Try adjusting your search or filter criteria"
                  : "All your components are above minimum stock levels"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
