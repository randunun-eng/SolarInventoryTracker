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
import { Loader2, Camera, Upload, Cloud, QrCode } from "lucide-react";
import { BrowserMultiFormatReader } from '@zxing/library';
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/common/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Extend the insertRepairSchema with custom validations
const PriorityEnum = z.enum(["Top", "Medium", "Low"]);

const repairFormSchema = insertRepairSchema.extend({
  inverterId: z.number().nullable().optional(),
  clientId: z.number().nullable().optional(), // Make clientId optional
  faultTypeId: z.number().nullable().optional(), // Make faultTypeId optional
  faultTypeName: z.string().optional(), // Add field for fault type text input
  faultDescription: z.string().min(1, "Fault description is required"),
  receivedDate: z.date().or(z.string()).transform((val) => {
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return val;
  }),
  // Remove estimated and completion date fields
  status: z.string().optional().nullable().refine(
    (val) => !val || Object.values(RepairStatusEnum.enum).includes(val as any), {
    message: "Invalid repair status",
  }),
  // Additional fields
  inverterModel: z.string().min(1, "Inverter model is required"),
  inverterSerialNumber: z.string().min(1, "Serial number is required"),
  remarks: z.string().optional(), // Add optional remarks field
  priority: z.string().optional(), // Add optional priority field
  repairPhotos: z.array(z.string()).optional().default([]), // New field for repair photos
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUploadMethod, setPhotoUploadMethod] = useState<'camera' | 'file' | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Fetch repair data if editing
  const { data: repair, isLoading: isLoadingRepair } = useQuery({
    queryKey: repairId ? [`/api/repairs/${repairId}`] : ["no-repair"],
    enabled: !!repairId,
  });

  // Fetch clients for dropdown
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Fetch fault types for dropdown
  const { data: faultTypes = [], isLoading: isLoadingFaultTypes } = useQuery({
    queryKey: ["/api/fault-types"],
  });

  // Fetch unique inverter models for autocomplete
  const { data: inverterModels = [], isLoading: isLoadingInverterModels } = useQuery({
    queryKey: ["/api/inverter-models"],
  });

  // State for selected client to filter inverters
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(
    repair?.clientId
  );

  // Fetch inverters for the selected client
  const { data: clientInverters = [], isLoading: isLoadingInverters } = useQuery({
    queryKey: selectedClientId ? [`/api/clients/${selectedClientId}/inverters`] : ["no-inverters"],
    enabled: !!selectedClientId,
  });

  // Set up form with default values or repair data
  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: repair || {
      inverterId: null,
      clientId: undefined,
      faultTypeId: undefined,
      faultTypeName: "",
      faultDescription: "",
      status: "Received",
      receivedDate: new Date(),
      completionDate: null,
      laborHours: 0,
      laborRate: 85,
      technicianName: "",
      technicianNotes: "",
      beforePhotos: [],
      afterPhotos: [],
      repairPhotos: [],
      totalPartsCost: 0,
      totalCost: 0,
      inverterModel: "",
      inverterSerialNumber: "",
      remarks: "",
      priority: "Medium", // Default priority
    },
  });

  // Update form values when repair data is loaded
  useEffect(() => {
    if (repair) {
      form.reset({
        ...repair,
        receivedDate: new Date(repair.receivedDate),
        completionDate: repair.completionDate 
          ? new Date(repair.completionDate) 
          : null,
      });
      // Set photos from the repair data
      if (repair.repairPhotos && repair.repairPhotos.length > 0) {
        setPhotos(repair.repairPhotos);
      }
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
  
  // Set up camera access
  const openCamera = async () => {
    setPhotoUploadMethod('camera');
    setIsUploading(true);
    
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Create video element to capture photo
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true; // Important for iOS
      
      // Wait for video to be ready
      video.onloadedmetadata = () => {
        // Create canvas to capture frame
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Capture frame after a short delay
        setTimeout(() => {
          if (context) {
            context.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Add photo to the list
            setPhotos(prev => [...prev, dataUrl]);
            
            // Update form value
            const currentPhotos = form.getValues("repairPhotos") || [];
            form.setValue("repairPhotos", [...currentPhotos, dataUrl]);
            
            toast({
              title: "Photo captured",
              description: "Photo has been added to your repair record.",
            });
          }
          
          // Stop camera stream
          stream.getTracks().forEach(track => track.stop());
          setIsUploading(false);
        }, 1000); // Give user 1 second to see the preview
      };
      
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Access Error",
        description: "Unable to access camera. Please check permissions or use file upload instead.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Limit to 3 photos
    if (photos.length >= 3) {
      toast({
        title: "Maximum photos reached",
        description: "You can only upload up to 3 photos.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    // In a real implementation, this would upload the file to a server
    // For now, we'll create a data URL for preview
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        const dataUrl = e.target.result as string;
        setPhotos(prev => [...prev, dataUrl]);
        
        // Update form value
        const currentPhotos = form.getValues("repairPhotos") || [];
        form.setValue("repairPhotos", [...currentPhotos, dataUrl]);
      }
      setIsUploading(false);
    };
    
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Failed to read the image file.",
        variant: "destructive"
      });
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Remove a photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    
    // Update form value
    const currentPhotos = form.getValues("repairPhotos") || [];
    form.setValue(
      "repairPhotos", 
      currentPhotos.filter((_, i) => i !== index)
    );
  };

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
    // Set default values for labor fields that were removed from UI
    const laborHours = 0;
    const laborRate = 85;
    const totalPartsCost = 0;
    
    // Calculate total cost based on labor and parts
    const totalCost = (laborHours) * (laborRate) + (totalPartsCost);
    
    // If a fault type name is provided, try to find a matching fault type
    if (data.faultTypeName && faultTypes) {
      const matchingFaultType = faultTypes.find(
        ft => ft.name.toLowerCase() === data.faultTypeName?.toLowerCase()
      );
      
      if (matchingFaultType) {
        data.faultTypeId = matchingFaultType.id; // Use existing fault type ID
      }
      // Note: If no match, we'll just send the text and let the server handle it
    }
    
    mutation.mutate({
      ...data,
      laborHours,
      laborRate,
      totalPartsCost,
      totalCost,
      technicianName: "",
      technicianNotes: "",
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
                    <FormLabel>Client</FormLabel>
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
                name="inverterModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inverter Model*</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          field.onChange('');
                        } else {
                          field.onChange(value);
                        }
                      }}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select or enter inverter model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {inverterModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">+ Enter new model</SelectItem>
                      </SelectContent>
                    </Select>
                    {(field.value === '' || !inverterModels.includes(field.value)) && (
                      <Input 
                        placeholder="Enter new inverter model" 
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="mt-2"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="inverterSerialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number*</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Enter serial number or scan barcode" {...field} className="flex-1" />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          disabled={isScanning}
                          onClick={async () => {
                            setIsScanning(true);
                            
                            try {
                              // Try to read from clipboard (works if user copied from scanner app)
                              const clipboardText = await navigator.clipboard.readText();
                              
                              // Check if clipboard contains a likely serial number (numbers/letters, reasonable length)
                              if (clipboardText && clipboardText.trim().length >= 5 && /^[A-Za-z0-9\-_]+$/.test(clipboardText.trim())) {
                                field.onChange(clipboardText.trim());
                                toast({
                                  title: "Serial number pasted!",
                                  description: `From clipboard: ${clipboardText.trim()}`,
                                });
                                setIsScanning(false);
                                return;
                              }
                              
                              // If no valid clipboard content, show instructions
                              toast({
                                title: "Use your barcode scanner app",
                                description: "1. Open your Google Scan app\n2. Scan the barcode\n3. Tap 'Copy'\n4. Click this button again to paste",
                              });
                              
                            } catch (error) {
                              // Clipboard access might be restricted, show instructions
                              toast({
                                title: "Use your barcode scanner app",
                                description: "1. Open your Google Scan app\n2. Scan the barcode\n3. Tap 'Copy'\n4. Manually paste in the field above",
                              });
                            }
                            
                            setIsScanning(false);
                          }}
                        >
                          {isScanning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <QrCode className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
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
            <h3 className="text-lg font-semibold mb-4">Repair Details</h3>
            
            {/* First row: Received Date and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value || ""}
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
            </div>
            
            {/* Second row: Priority and Fault Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value || "Medium"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Top">Top</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="faultTypeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fault Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter fault type" 
                        list="fault-types"
                        {...field} 
                      />
                    </FormControl>
                    <datalist id="fault-types">
                      {faultTypes?.map((faultType) => (
                        <option key={faultType.id} value={faultType.name} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Remarks field (optional) */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional remarks (optional)"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fault Description */}
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
            
            {/* Photo Upload Section */}
            <FormField
              control={form.control}
              name="repairPhotos"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Pictures (Maximum 3)</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Only show upload area if less than 3 photos */}
                      {photos.length < 3 && (
                        <div className="border border-dashed rounded-md p-6 text-center">
                          <div className="flex flex-col items-center space-y-2">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                            <div className="flex flex-col items-center">
                              <p className="text-sm text-muted-foreground mb-2">
                                Drag & drop photos here, or click to upload
                              </p>
                              <div className="flex flex-wrap justify-center gap-2">
                                <label className="cursor-pointer">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    disabled={isUploading}
                                    asChild
                                  >
                                    <span>
                                      <Camera className="h-4 w-4 mr-2" />
                                      Take Photo
                                    </span>
                                  </Button>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                  />
                                </label>
                                
                                <label className="cursor-pointer">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    disabled={isUploading}
                                    asChild
                                  >
                                    <span>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload File
                                    </span>
                                  </Button>
                                  <input
                                    id="photo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                  />
                                </label>
                                
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Google Drive",
                                      description: "Google Drive integration would be implemented here."
                                    });
                                  }}
                                  disabled={isUploading}
                                >
                                  <Cloud className="h-4 w-4 mr-2" />
                                  Google Drive
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Display uploaded photos */}
                      {photos.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          {photos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={photo} 
                                alt={`Repair photo ${index + 1}`} 
                                className="h-40 w-full object-cover rounded-md border"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removePhoto(index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
