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
  FileText,
  Printer,
  Download,
  Mail,
  Calendar,
  Filter,
  Plus,
  CreditCard
} from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Simulating invoice data since our schema only has repair data
// In a real app, this would be fetched from the API
interface Invoice {
  id: number;
  repairId: number;
  clientId: number;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
}

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [dateRange, setDateRange] = useState<string | undefined>(undefined);

  // Fetch repairs for invoice data
  const { data: repairs, isLoading: isLoadingRepairs } = useQuery({
    queryKey: ["/api/repairs"],
  });

  // Fetch clients to display client names
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Convert repair data to invoices (this would normally come from an invoice API endpoint)
  const invoices: Invoice[] = repairs
    ? repairs
        .filter(repair => repair.status === "Completed")
        .map(repair => ({
          id: repair.id,
          repairId: repair.id,
          clientId: repair.clientId,
          invoiceNumber: `INV-${new Date().getFullYear()}-${repair.id.toString().padStart(4, '0')}`,
          date: repair.completionDate || repair.receivedDate,
          dueDate: new Date(new Date(repair.completionDate || repair.receivedDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: repair.totalCost || 0,
          status: Math.random() > 0.3 ? "Paid" : Math.random() > 0.5 ? "Pending" : "Overdue"
        }))
    : [];

  // Filtered invoices based on search term and filters
  const filteredInvoices = invoices ? invoices.filter(invoice => {
    // Apply status filter if set
    if (statusFilter && invoice.status !== statusFilter) {
      return false;
    }

    // Apply date range filter if set
    if (dateRange) {
      const invoiceDate = new Date(invoice.date).getTime();
      const now = new Date().getTime();
      
      if (dateRange === "last30") {
        if (invoiceDate < now - 30 * 24 * 60 * 60 * 1000) return false;
      } else if (dateRange === "last90") {
        if (invoiceDate < now - 90 * 24 * 60 * 60 * 1000) return false;
      } else if (dateRange === "thisYear") {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
        if (invoiceDate < startOfYear) return false;
      }
    }

    // Apply search term if entered
    if (searchTerm) {
      // Check if client name matches
      const client = clients?.find(c => c.id === invoice.clientId);
      const clientName = client?.name || '';
      
      return (
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Calculate totals
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = filteredInvoices
    .filter(invoice => invoice.status === "Pending")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = filteredInvoices
    .filter(invoice => invoice.status === "Overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  // Function to get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
          <p className="text-slate-500">Manage billing and payment records for repairs</p>
        </div>
        <Button 
          className="mt-4 md:mt-0" 
          onClick={() => setIsCreateInvoiceOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="bg-slate-100 text-slate-600 p-3 rounded-full">
                <CreditCard />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-green-800">Paid</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(paidAmount)}</p>
              </div>
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <CreditCard />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(pendingAmount)}</p>
              </div>
              <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full">
                <CreditCard />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-red-800">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(overdueAmount)}</p>
              </div>
              <div className="bg-red-100 text-red-600 p-3 rounded-full">
                <CreditCard />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search by invoice number or client..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-slate-500" />
                    <SelectValue placeholder="Payment status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-48">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                    <SelectValue placeholder="Date range" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Time</SelectItem>
                  <SelectItem value="last30">Last 30 Days</SelectItem>
                  <SelectItem value="last90">Last 90 Days</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Invoice Records</CardTitle>
          <CardDescription>
            {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRepairs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{getClientName(invoice.clientId)}</TableCell>
                      <TableCell>{formatDateTime(invoice.date)}</TableCell>
                      <TableCell>{formatDateTime(invoice.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Printer className="h-4 w-4 mr-2" />
                              Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Email to Client
                            </DropdownMenuItem>
                            {invoice.status !== "Paid" && (
                              <DropdownMenuItem>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No invoices found</h3>
              <p className="text-sm text-slate-500 mb-4">
                {searchTerm || statusFilter || dateRange
                  ? "Try adjusting your search or filter criteria"
                  : "Start by creating your first invoice"}
              </p>
              {!searchTerm && !statusFilter && !dateRange && (
                <Button 
                  variant="default" 
                  onClick={() => setIsCreateInvoiceOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Generate an invoice for a completed repair
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Select Completed Repair</label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a repair" />
                </SelectTrigger>
                <SelectContent>
                  {repairs?.filter(repair => repair.status === "Completed")
                    .map(repair => (
                      <SelectItem key={repair.id} value={repair.id.toString()}>
                        Repair #{repair.id} - {getClientName(repair.clientId)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Invoice Date</label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Due Date</label>
                <Input 
                  type="date" 
                  defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} 
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-2">
              <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>
                Cancel
              </Button>
              <Button>
                Create Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
