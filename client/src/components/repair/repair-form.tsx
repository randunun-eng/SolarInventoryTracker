import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertRepairSchema, RepairStatusEnum } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/common/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Extend the insertRepairSchema with custom validations
const repairFormSchema = insertRepairSchema.extend({
  faultDescription: z.string().min(1, "Fault description is required"),
  receivedDate: z.string().or(z.date()).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  estimatedCompletionDate: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .optional()
    .nullable(),
  completionDate: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .optional()
    .nullable(),
  status: z.string().refine((val) => Object.values(RepairStatusEnum.enum).includes(val as any), {
    message: "Invalid repair status",
  }),
});

type RepairFormValues = z.infer<typeof repairFormSchema>;

interface RepairFormProps {
  repairId?: number;
  onSuccess?: () => void;
}

export function RepairForm({ repairId, onSuccess }: RepairFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch repair data if editing
  const { data: repair, isLoading: isLoadingRepair } = useQuery({
    queryKey: repairId ? [`/api/repairs/${repairId}`] : null,
    enabled: !!repairId,
  });

  // Fetch clients for dropdown
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Fetch fault types for dropdown
  const { data: faultTypes, isLoading: isLoadingFaultTypes } = useQuery({
    queryKey: ["/api/fault-types"],
  });

  // State for selected client to filter inverters
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(
    repair?.clientId
  );

  // Fetch inverters for the selected client
  const { data: clientInverters, isLoading: isLoadingInverters } = useQuery({
    queryKey: selectedClientId ? [`/api/clients/${selectedClientId}/inverters`] : null,
    enabled: !!selectedClientId,
  });

  // Set up form with default values or repair data
  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: repair || {
      inverterId: undefined,
      clientId: undefined,
      faultTypeId: undefined,
      faultDescription: "",
      status: "Received",
      receivedDate: new Date(),
      estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      completionDate: null,
      laborHours: 0,
      laborRate: 85,
      technicianName: "",
      technicianNotes: "",
      beforePhotos: [],
      afterPhotos: [],
      totalPartsCost: 0,
      totalCost: 0,
    },
  });

  // Update form values when repair data is loaded
  useEffect(() => {
    if (repair) {
      form.reset({
        ...repair,
        receivedDate: new Date(repair.receivedDate),
        estimatedCompletionDate: repair.estimatedCompletionDate 
          ? new Date(repair.estimatedCompletionDate) 
          : null,
        completionDate: repair.completionDate 
          ? new Date(repair.completionDate) 
          : null,
      });
      setSelectedClientId(repair.clientId);
    }
  }, [repair, form]);

  // Update selectedClientId when the clientId changes in the form
  const watchClientId = form.watch("clientId");
  useEffect(() => {
    if (watchClientId) {
      setSelectedClientId(watchClientId);
    }
  }, [watchClientId]);

  // Create or update repair mutation
  const mutation = useMutation({
    mutationFn: async (data: RepairFormValues) => {
      if (repairId) {
        return apiRequest("PUT", `/api/repairs/${repairId}`, data);
      } else {
        return apiRequest("POST", "/api/repairs", data);
      }
    },
    onSuccess: () => {
      toast({
        title: repairId ? "Repair updated" : "Repair created",
        description: repairId 
          ? "The repair has been updated successfully." 
          : "The repair has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repairs"] });
      if (repairId) {
        queryClient.invalidateQueries({ queryKey: [`/api/repairs/${repairId}`] });
      }
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${repairId ? "update" : "create"} repair. ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RepairFormValues) => {
    // Calculate total cost based on labor and parts
    const totalCost = (data.laborHours || 0) * (data.laborRate || 85) + (data.totalPartsCost || 0);
    mutation.mutate({
      ...data,
      totalCost,
    });
  };

  const isLoading = isLoadingRepair || isLoadingClients || isLoadingFaultTypes || isLoadingInverters || mutation.isPending || isUploading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Client & Inverter Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                      disabled={isLoadingClients}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inverterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inverter*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                      disabled={isLoadingInverters || !selectedClientId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedClientId ? "Select an inverter" : "Select a client first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientInverters?.map((inverter) => (
                          <SelectItem key={inverter.id} value={inverter.id.toString()}>
                            {inverter.model} - {inverter.serialNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Repair Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(RepairStatusEnum.enum).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="faultTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fault Type</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                      disabled={isLoadingFaultTypes}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a fault type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {faultTypes?.map((faultType) => (
                          <SelectItem key={faultType.id} value={faultType.id.toString()}>
                            {faultType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="faultDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fault Description*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the fault or issue with the inverter"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <FormField
                control={form.control}
                name="receivedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received Date*</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedCompletionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Completion Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="completionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Labor & Technician Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <FormField
                control={form.control}
                name="laborHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labor Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="laborRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labor Rate ($/hr)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalPartsCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parts Cost ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="technicianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technician Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter technician name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technicianNotes"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Technician Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any repair notes or observations"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess && onSuccess()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {repairId ? "Update" : "Create"} Repair
          </Button>
        </div>
      </form>
    </Form>
  );
}
