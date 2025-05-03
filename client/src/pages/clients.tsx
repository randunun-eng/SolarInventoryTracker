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
import { ClientForm } from "@/components/client/client-form";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  Phone,
  Mail,
  MapPin,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // Fetch clients
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Fetch inverters for selected client
  const { data: clientInverters, isLoading: isLoadingInverters } = useQuery({
    queryKey: selectedClientId ? [`/api/clients/${selectedClientId}/inverters`] : null,
    enabled: !!selectedClientId,
  });

  // Fetch repairs for selected client
  const { data: clientRepairs, isLoading: isLoadingRepairs } = useQuery({
    queryKey: selectedClientId ? [`/api/clients/${selectedClientId}/repairs`] : null,
    enabled: !!selectedClientId,
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => {
      toast({
        title: "Client deleted",
        description: "The client has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete client: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filtered clients based on search term
  const filteredClients = clients ? clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const handleEditClient = (id: number) => {
    setEditingClientId(id);
    setIsEditClientOpen(true);
  };

  const handleViewClient = (id: number) => {
    setSelectedClientId(id);
  };

  const handleDeleteClient = (id: number) => {
    if (confirm("Are you sure you want to delete this client? This will also delete all associated inverters and repairs.")) {
      deleteClientMutation.mutate(id);
    }
  };

  // Find selected client details
  const selectedClient = selectedClientId 
    ? clients?.find(client => client.id === selectedClientId)
    : null;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
          <p className="text-slate-500">Manage your client information and solar inverters</p>
        </div>
        <Button 
          className="mt-4 md:mt-0" 
          onClick={() => setIsAddClientOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {selectedClientId ? (
        // Client Detail View
        <>
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedClientId(null)}
            >
              Back to All Clients
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedClient ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedClient.name}</h3>
                        <p className="text-sm text-slate-500">Client #{selectedClient.id}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      {selectedClient.phone && (
                        <div className="flex items-start space-x-3">
                          <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-500">Phone</p>
                            <p className="text-slate-800">{selectedClient.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedClient.email && (
                        <div className="flex items-start space-x-3">
                          <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-500">Email</p>
                            <p className="text-slate-800">{selectedClient.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedClient.address && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-500">Address</p>
                            <p className="text-slate-800">{selectedClient.address}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClient(selectedClient.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Client
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <Tabs defaultValue="inverters">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Client Details</CardTitle>
                    <TabsList>
                      <TabsTrigger value="inverters">Inverters</TabsTrigger>
                      <TabsTrigger value="repairs">Repair History</TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                
                <TabsContent value="inverters">
                  <CardContent>
                    {isLoadingInverters ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : clientInverters && clientInverters.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Model</TableHead>
                            <TableHead>Serial Number</TableHead>
                            <TableHead>Warranty</TableHead>
                            <TableHead>Installation Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientInverters.map((inverter) => (
                            <TableRow key={inverter.id}>
                              <TableCell className="font-medium">{inverter.model}</TableCell>
                              <TableCell>{inverter.serialNumber}</TableCell>
                              <TableCell>
                                <Badge variant={inverter.warrantyStatus === "Valid" ? "default" : "destructive"}>
                                  {inverter.warrantyStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>{inverter.installationDate ? new Date(inverter.installationDate).toLocaleDateString() : "—"}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4 mr-2" />
                                  Manage
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500 mb-4">No inverters found for this client</p>
                        <Button>Add Inverter</Button>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>
                
                <TabsContent value="repairs">
                  <CardContent>
                    {isLoadingRepairs ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : clientRepairs && clientRepairs.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Repair ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Inverter</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientRepairs.map((repair) => (
                            <TableRow key={repair.id}>
                              <TableCell className="font-medium">#{repair.id}</TableCell>
                              <TableCell>{new Date(repair.receivedDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  repair.status === "Completed" ? "success" :
                                  repair.status === "In Progress" ? "warning" :
                                  "default"
                                }>
                                  {repair.status}
                                </Badge>
                              </TableCell>
                              <TableCell>#{repair.inverterId}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500 mb-4">No repair history found for this client</p>
                        <Button>Create Repair</Button>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </>
      ) : (
        // Clients List View
        <>
          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    placeholder="Search clients by name, email or phone..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clients Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Client Directory</CardTitle>
              <CardDescription>
                {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredClients.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{client.phone || "—"}</TableCell>
                          <TableCell>{client.email || "—"}</TableCell>
                          <TableCell className="max-w-xs truncate">{client.address || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewClient(client.id)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditClient(client.id)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No clients found</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {searchTerm 
                      ? `No clients matching "${searchTerm}"`
                      : "Start by adding your first client to the system"}
                  </p>
                  {!searchTerm && (
                    <Button 
                      variant="default" 
                      onClick={() => setIsAddClientOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Client
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Client Dialog */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the details of the new client
            </DialogDescription>
          </DialogHeader>
          <ClientForm onSuccess={() => setIsAddClientOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the details of this client
            </DialogDescription>
          </DialogHeader>
          <ClientForm 
            clientId={editingClientId || undefined} 
            onSuccess={() => setIsEditClientOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Import the Separator component which wasn't defined above
function Separator() {
  return <div className="h-px w-full bg-slate-200 my-3" />;
}
