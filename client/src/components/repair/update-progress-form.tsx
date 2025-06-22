import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { RepairStatusEnum } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema for the update progress form
const updateProgressSchema = z.object({
  status: z.string().min(1, "Status is required"),
  notes: z.string().min(1, "Progress notes are required"),
  timestamp: z.date().optional(),
  photos: z.array(z.string()).optional(),
});

type UpdateProgressFormValues = z.infer<typeof updateProgressSchema>;

interface UpdateProgressFormProps {
  repairId?: number;
  onSuccess: () => void;
}

export function UpdateProgressForm({ repairId, onSuccess }: UpdateProgressFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch repair data
  const { data: repair = {}, isLoading } = useQuery({
    queryKey: repairId ? [`/api/repairs/${repairId}`] : ["no-repair"],
    enabled: !!repairId,
  });
  
  const form = useForm<UpdateProgressFormValues>({
    resolver: zodResolver(updateProgressSchema),
    defaultValues: {
      status: (repair as any)?.status || "In Progress",
      notes: "",
      timestamp: new Date(),
      photos: [],
    },
  });
  
  // Update form values when repair data loads
  useEffect(() => {
    if (repair && Object.keys(repair).length > 0) {
      form.reset({
        status: (repair as any).status || "In Progress",
        notes: "",
        timestamp: new Date(),
        photos: [],
      });
    }
  }, [repair, form]);

  // Photo handling functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    if (photos.length >= 3) {
      toast({
        title: "Maximum photos reached",
        description: "You can only upload up to 3 photos.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPhotos(prev => [...prev.slice(0, 2), dataUrl]);
        
        const currentPhotos = form.getValues("photos") || [];
        form.setValue("photos", [...currentPhotos.slice(0, 2), dataUrl]);
        
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    const currentPhotos = form.getValues("photos") || [];
    form.setValue("photos", currentPhotos.filter((_, i) => i !== index));
  };

  const openCamera = async () => {
    setIsUploading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        setTimeout(() => {
          if (context) {
            context.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            setPhotos(prev => [...prev.slice(0, 2), dataUrl]);
            
            const currentPhotos = form.getValues("photos") || [];
            form.setValue("photos", [...currentPhotos.slice(0, 2), dataUrl]);
            
            toast({
              title: "Photo captured",
              description: "Photo has been added to your progress update.",
            });
          }
          
          stream.getTracks().forEach(track => track.stop());
          setIsUploading(false);
        }, 1000);
      };
      
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Access Error",
        description: "Unable to access camera. Please use file upload instead.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };
  
  const onSubmit = async (data: UpdateProgressFormValues) => {
    if (!repairId) return;
    
    setIsSubmitting(true);
    
    try {
      // Get the current repair data first
      const currentRepair = await fetch(`/api/repairs/${repairId}`).then(res => res.json());
      
      if (!currentRepair) {
        throw new Error("Repair not found");
      }
      
      // Create a status history entry
      const newStatusEntry = {
        status: data.status,
        timestamp: data.timestamp ? data.timestamp.toISOString() : new Date().toISOString(),
        note: data.notes,
        photos: photos,
        userId: null,
        userName: null
      };
      
      // Get existing status history or initialize empty array
      const statusHistory = Array.isArray(currentRepair.statusHistory) 
        ? [...currentRepair.statusHistory, newStatusEntry]
        : [newStatusEntry];
      
      // Update the whole repair record with the new status and history
      const updateResponse = await fetch(`/api/repairs/${repairId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentRepair,
          status: data.status,
          statusHistory: statusHistory
        })
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Error updating repair:", errorText);
        throw new Error(`Error: ${updateResponse.status} - ${errorText}`);
      }
      
      // Invalidate ALL repair data to ensure UI is refreshed
      queryClient.invalidateQueries({ queryKey: ['/api/repairs'] });
      queryClient.invalidateQueries({ queryKey: [`/api/repairs/${repairId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/repairs/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/repairs/recent'] });
      
      toast({
        title: "Progress updated",
        description: "The repair status has been updated successfully.",
      });
      
      // Force a window reload to ensure all components refresh
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      onSuccess();
    } catch (error: any) {
      console.error("Status update error:", error);
      toast({
        title: "Error",
        description: `Failed to update progress: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
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
          name="timestamp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Update Date & Time</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  value={field.value instanceof Date ? 
                    field.value.toISOString().slice(0, 16) : 
                    new Date().toISOString().slice(0, 16)
                  }
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Progress Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter notes about the progress..." 
                  {...field} 
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Progress Photos (Maximum 3)</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {/* Photo upload area */}
                  {photos.length < 3 && (
                    <div className="border border-dashed rounded-md p-4 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Camera className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Add photos to document progress
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={openCamera}
                            disabled={isUploading}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Take Photo
                          </Button>
                          
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
                                Upload
                              </span>
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Display uploaded photos */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={photo} 
                            alt={`Progress photo ${index + 1}`} 
                            className="h-20 w-full object-cover rounded-md border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
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
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Progress
          </Button>
        </div>
      </form>
    </Form>
  );
}