import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VoiceTest } from "@/components/ai/voice-test";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Loader2, 
  Save,
  Settings as SettingsIcon,
  UserCog,
  BellRing,
  Mail,
  Database,
  Server,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Form schema for general settings
const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  website: z.string().optional(),
  taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Tax rate must be a valid percentage"),
  laborRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Labor rate must be a valid hourly rate"),
  currency: z.string().min(1, "Currency is required"),
});

// Form schema for notifications settings
const notificationsSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  lowStockAlerts: z.boolean().default(true),
  lowStockThreshold: z.string().regex(/^\d+$/, "Must be a number"),
  repairStatusUpdates: z.boolean().default(true),
  invoiceReminders: z.boolean().default(true),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type NotificationsSettingsValues = z.infer<typeof notificationsSettingsSchema>;

// Sample user data for the Users tab
const users = [
  { id: 1, name: "John Doe", email: "johndoe@example.com", role: "Admin", status: "Active" },
  { id: 2, name: "Jane Smith", email: "janesmith@example.com", role: "Technician", status: "Active" },
  { id: 3, name: "Bob Johnson", email: "bjohnson@example.com", role: "Manager", status: "Inactive" },
];

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch general settings data
  const { data: generalSettingsData, isLoading: isLoadingGeneralSettings, refetch: refetchGeneralSettings } = useQuery({
    queryKey: ["/api/settings/general"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to force refetch
  });

  // General settings form
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: "ElectroTrack Solar Solutions",
      address: "123 Repair Street, Techville, CA 94123",
      phone: "(555) 123-4567",
      email: "info@electrotrack.com",
      website: "www.electrotrack.com",
      taxRate: "8.5",
      laborRate: "85.00",
      currency: "USD",
    },
  });
  
  // Update form values when settings are loaded
  useEffect(() => {
    if (generalSettingsData) {
      console.log("Resetting form with data:", generalSettingsData);
      generalForm.reset({
        companyName: generalSettingsData.companyName || "ElectroTrack Solar Solutions",
        address: generalSettingsData.address || "123 Repair Street, Techville, CA 94123",
        phone: generalSettingsData.phone || "(555) 123-4567",
        email: generalSettingsData.email || "info@electrotrack.com",
        website: generalSettingsData.website || "www.electrotrack.com",
        taxRate: generalSettingsData.taxRate || "8.5",
        laborRate: generalSettingsData.laborRate || "85.00",
        currency: generalSettingsData.currency || "USD",
      });
    }
  }, [generalSettingsData, generalForm]);

  // Fetch notifications settings
  const { data: notificationSettingsData } = useQuery({
    queryKey: ["/api/settings/notifications"],
  });
  
  // Notifications settings form
  const notificationsForm = useForm<NotificationsSettingsValues>({
    resolver: zodResolver(notificationsSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      lowStockAlerts: true,
      lowStockThreshold: "10",
      repairStatusUpdates: true,
      invoiceReminders: true,
    },
  });
  
  // Update notification form when data is loaded
  useEffect(() => {
    if (notificationSettingsData) {
      notificationsForm.reset(notificationSettingsData);
    }
  }, [notificationSettingsData, notificationsForm]);

  // General settings mutation
  const queryClient = useQueryClient();
  const updateGeneralSettingsMutation = useMutation({
    mutationFn: (settings: GeneralSettingsValues) => 
      apiRequest("PUT", "/api/settings/general", settings),
    onSuccess: () => {
      // Invalidate cache to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/settings/general"] });
      
      // Force refetch to ensure we have the latest data
      refetchGeneralSettings();
      
      // Show a simple success message
      setIsLoading(false);
      alert("Your general settings have been successfully updated.");
    },
    onError: () => {
      setIsLoading(false);
      alert("Failed to update settings. Please try again.");
    },
  });

  // Submit handler for general settings
  const onGeneralSubmit = (data: GeneralSettingsValues) => {
    setIsLoading(true);
    updateGeneralSettingsMutation.mutate(data);
  };

  // Notifications settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: (settings: NotificationsSettingsValues) => 
      apiRequest("PUT", "/api/settings/notifications", settings),
    onSuccess: () => {
      // Invalidate cache to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/settings/notifications"] });
      
      // Show a simple success message
      setIsLoading(false);
      alert("Your notification preferences have been saved.");
    },
    onError: () => {
      setIsLoading(false);
      alert("Failed to update notification settings. Please try again.");
    },
  });

  // Submit handler for notifications settings
  const onNotificationsSubmit = (data: NotificationsSettingsValues) => {
    setIsLoading(true);
    updateNotificationSettingsMutation.mutate(data);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500">Configure your application preferences and settings</p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row gap-6">
          <Card className="md:w-64 flex-shrink-0">
            <CardContent className="pt-6">
              <TabsList className="flex flex-col w-full h-auto space-y-1 bg-transparent p-0">
                <TabsTrigger
                  value="general"
                  className="justify-start px-2 py-1.5 h-9 text-left"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="justify-start px-2 py-1.5 h-9 text-left"
                >
                  <BellRing className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="justify-start px-2 py-1.5 h-9 text-left"
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger
                  value="backup"
                  className="justify-start px-2 py-1.5 h-9 text-left"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Data Backup
                </TabsTrigger>
                <TabsTrigger
                  value="system"
                  className="justify-start px-2 py-1.5 h-9 text-left"
                >
                  <Server className="w-4 h-4 mr-2" />
                  System Info
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <div className="flex-1">
            {/* General Settings */}
            <TabsContent value="general" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure your company information and default settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...generalForm}>
                    <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={generalForm.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter company name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter email address" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter website URL" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={generalForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter business address" 
                                className="resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={generalForm.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="EUR">EUR (€)</SelectItem>
                                  <SelectItem value="GBP">GBP (£)</SelectItem>
                                  <SelectItem value="CAD">CAD ($)</SelectItem>
                                  <SelectItem value="AUD">AUD ($)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="taxRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Tax Rate (%)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 8.5" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="laborRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Labor Rate ($/hr)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 85.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how and when you receive alerts and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationsForm}>
                    <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                      <FormField
                        control={notificationsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Email Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="lowStockAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Low Stock Alerts
                              </FormLabel>
                              <FormDescription>
                                Get notified when components fall below minimum stock levels
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="lowStockThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Low Stock Threshold</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter minimum quantity" {...field} />
                            </FormControl>
                            <FormDescription>
                              Components will trigger alerts when stock falls below this value (unless individually configured)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="repairStatusUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Repair Status Updates
                              </FormLabel>
                              <FormDescription>
                                Receive notifications when repair statuses change
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="invoiceReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Invoice Reminders
                              </FormLabel>
                              <FormDescription>
                                Get reminders about unpaid and overdue invoices
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Notification Settings
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Management */}
            <TabsContent value="users" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>
                        Manage system users and their access permissions
                      </CardDescription>
                    </div>
                    <Button>
                      <UserCog className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.status === "Active" ? "default" : "secondary"}
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Backup */}
            <TabsContent value="backup" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Data Backup and Export</CardTitle>
                  <CardDescription>
                    Manage your data backups and exports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <h3 className="text-lg font-medium mb-2">Export Data</h3>
                    <p className="text-slate-500 mb-4">
                      Export your inventory and repair data to CSV or Excel format
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline">
                        Export Components
                      </Button>
                      <Button variant="outline">
                        Export Clients
                      </Button>
                      <Button variant="outline">
                        Export Repairs
                      </Button>
                      <Button variant="outline">
                        Export Invoices
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="text-lg font-medium mb-2">Backup Database</h3>
                    <p className="text-slate-500 mb-4">
                      Create a complete backup of all your data
                    </p>
                    <Button>
                      <Database className="mr-2 h-4 w-4" />
                      Create Backup
                    </Button>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="text-lg font-medium mb-2">Previous Backups</h3>
                    <p className="text-slate-500 mb-4">
                      Restore data from a previous backup
                    </p>
                    <div className="text-center py-6 text-slate-500">
                      No previous backups found
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Information */}
            <TabsContent value="system" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>
                    View details about the system and application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="text-sm font-medium text-slate-500">Application Version</div>
                      <div className="text-sm">ElectroTrack v1.0.0</div>
                      
                      <div className="text-sm font-medium text-slate-500">Database Type</div>
                      <div className="text-sm">PostgreSQL (In-Memory)</div>
                      
                      <div className="text-sm font-medium text-slate-500">Last Updated</div>
                      <div className="text-sm">{new Date().toLocaleDateString()}</div>
                      
                      <div className="text-sm font-medium text-slate-500">Node.js Version</div>
                      <div className="text-sm">v18.x</div>
                      
                      <div className="text-sm font-medium text-slate-500">Frontend Framework</div>
                      <div className="text-sm">React 18.x + Shadcn UI</div>
                      
                      <div className="text-sm font-medium text-slate-500">Backend Framework</div>
                      <div className="text-sm">Express.js</div>
                    </div>
                    
                    <div className="rounded-lg bg-slate-50 p-4 mt-6">
                      <div className="flex items-center mb-2">
                        <Shield className="text-green-500 mr-2" />
                        <h3 className="text-base font-medium">System Status: Operational</h3>
                      </div>
                      <p className="text-sm text-slate-500">
                        All services are running normally. Last system check: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {/* Voice Test Component */}
                    <div className="rounded-lg border p-4 mt-6">
                      <h3 className="text-base font-medium mb-3">Voice System Test</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Use this tool to test speech synthesis capabilities in your browser. If you're having trouble with the voice assistant, 
                        try the different speech synthesis methods below to troubleshoot.
                      </p>
                      <VoiceTest />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-slate-50 px-6 py-3">
                  <p className="text-xs text-slate-500">
                    © 2023 ElectroTrack. All rights reserved.
                  </p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    Report an Issue
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
