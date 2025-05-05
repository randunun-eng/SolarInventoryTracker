import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertComponentSchema } from "@shared/schema";
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

// Extend the insertComponentSchema with custom validations
const componentFormSchema = insertComponentSchema.extend({
  name: z.string().min(1, "Component name is required"),
  minimumStock: z.number().int().min(0, "Minimum stock cannot be negative").nullable().optional(),
  currentStock: z.number().int().min(0, "Current stock cannot be negative").nullable().optional(),
  supplierPrice: z.number().min(0, "Price cannot be negative").nullable().optional(),
});

type ComponentFormValues = z.infer<typeof componentFormSchema>;

interface ComponentFormProps {
  componentId?: number;
  onSuccess?: () => void;
}

export function ComponentForm({ componentId, onSuccess }: ComponentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch component data if editing
  const { data: component, isLoading: isLoadingComponent } = useQuery({
    queryKey: componentId ? [`/api/components/${componentId}`] : null,
    enabled: !!componentId,
  });

  // Fetch categories for dropdown
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch suppliers for dropdown
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Set up form with default values or component data
  const form = useForm<ComponentFormValues>({
    resolver: zodResolver(componentFormSchema),
    defaultValues: component || {
      name: "",
      partNumber: "",
      categoryId: undefined,
      description: "",
      datasheet: "",
      image: "",
      location: "",
      minimumStock: 10,
      currentStock: 0,
      supplierPrice: 0,
      supplierId: undefined,
      lastPurchaseDate: undefined,
    },
  });

  // Update form values when component data is loaded
  useEffect(() => {
    if (component) {
      form.reset(component);
    }
  }, [component, form]);

  // Create or update component mutation
  const mutation = useMutation({
    mutationFn: async (data: ComponentFormValues) => {
      if (componentId) {
        return apiRequest("PUT", `/api/components/${componentId}`, data);
      } else {
        return apiRequest("POST", "/api/components", data);
      }
    },
    onSuccess: () => {
      toast({
        title: componentId ? "Component updated" : "Component created",
        description: componentId 
          ? "The component has been updated successfully." 
          : "The component has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      if (componentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/components/${componentId}`] });
      }
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${componentId ? "update" : "create"} component. ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ComponentFormValues) => {
    console.log("Form submitted with data:", data);
    
    // Ensure numeric fields are not undefined or null for API request
    const processedData = {
      ...data,
      minimumStock: data.minimumStock ?? 0,
      currentStock: data.currentStock ?? 0,
      supplierPrice: data.supplierPrice ?? 0
    };
    
    console.log("Processed data for API:", processedData);
    mutation.mutate(processedData);
  };

  const isLoading = isLoadingComponent || isLoadingCategories || isLoadingSuppliers || mutation.isPending || isUploading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Component Name*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter component name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="partNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Package Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., TO-220, SOP-8, DIP-8" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString()}
                  disabled={isLoadingCategories}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
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
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Bin A-25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter component description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="currentStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? 0 : parseInt(value));
                    }}
                    value={isNaN(field.value) ? 0 : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minimumStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? 0 : parseInt(value));
                    }}
                    value={isNaN(field.value) ? 0 : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplierPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? 0 : parseFloat(value));
                    }}
                    value={isNaN(field.value) ? 0 : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value?.toString()}
                disabled={isLoadingSuppliers}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="datasheet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Datasheet</FormLabel>
                <FormControl>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input 
                        placeholder="Enter datasheet URL" 
                        value={field.value || ''} 
                        onChange={field.onChange}
                      />
                    </div>
                    <div className="flex-shrink-0">
                      <FileUpload
                        label="Upload Datasheet"
                        accept=".pdf,.doc,.docx"
                        onUploadComplete={(urls) => {
                          if (urls.length > 0) {
                            field.onChange(urls[0]);
                            setIsUploading(false);
                          }
                        }}
                        currentFiles={field.value ? [field.value] : []}
                      />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input 
                        placeholder="Enter image URL" 
                        value={field.value || ''} 
                        onChange={field.onChange}
                      />
                    </div>
                    <div className="flex-shrink-0">
                      <FileUpload
                        label="Upload Image"
                        accept="image/*"
                        onUploadComplete={(urls) => {
                          if (urls.length > 0) {
                            field.onChange(urls[0]);
                            setIsUploading(false);
                          }
                        }}
                        currentFiles={field.value ? [field.value] : []}
                        isImage={true}
                      />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            {componentId ? "Update" : "Create"} Component
          </Button>
        </div>
      </form>
    </Form>
  );
}
