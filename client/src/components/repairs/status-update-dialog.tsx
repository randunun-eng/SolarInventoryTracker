import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Upload, X, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const statusUpdateSchema = z.object({
  note: z.string().optional(),
  date: z.date().optional(),
  photos: z.array(z.string()).optional(),
});

type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;

interface StatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string, photos?: string[], date?: Date) => void;
  currentStatus: string;
  newStatus: string;
  isLoading?: boolean;
}

export function StatusUpdateDialog({
  open,
  onOpenChange,
  onConfirm,
  currentStatus,
  newStatus,
  isLoading = false,
}: StatusUpdateDialogProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      note: "",
      date: new Date(),
      photos: [],
    },
  });

  const handleSubmit = (values: StatusUpdateFormValues) => {
    onConfirm(values.note || "", photos, values.date);
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    if (photos.length >= 5) {
      toast({
        title: "Maximum photos reached",
        description: "You can only upload up to 5 photos per status update.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      // Create video element for preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Wait for video to be ready
      video.onloadedmetadata = () => {
        setTimeout(() => {
          // Create canvas to capture frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          
          if (context) {
            context.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Add photo to the list
            setPhotos(prev => [...prev, dataUrl]);
            
            toast({
              title: "Photo captured",
              description: "Photo has been added to your status update.",
            });
          }
          
          // Stop camera stream
          stream.getTracks().forEach(track => track.stop());
          setIsUploading(false);
        }, 1000);
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

  // Handle file upload with improved validation and multiple file support
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Check remaining slots
    const remainingSlots = 5 - photos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Maximum photos reached",
        description: "You can only upload up to 5 photos per status update.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    // Process multiple files up to the remaining slots
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newPhotos: string[] = [];
    let processedCount = 0;
    
    filesToProcess.forEach((file) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB. Skipping.`,
          variant: "destructive"
        });
        processedCount++;
        if (processedCount === filesToProcess.length) {
          setPhotos(prev => [...prev, ...newPhotos]);
          setIsUploading(false);
        }
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file. Skipping.`,
          variant: "destructive"
        });
        processedCount++;
        if (processedCount === filesToProcess.length) {
          setPhotos(prev => [...prev, ...newPhotos]);
          setIsUploading(false);
        }
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const dataUrl = e.target.result as string;
          newPhotos.push(dataUrl);
        }
        processedCount++;
        
        if (processedCount === filesToProcess.length) {
          setPhotos(prev => [...prev, ...newPhotos]);
          setIsUploading(false);
          
          if (newPhotos.length > 0) {
            toast({
              title: "Photos uploaded",
              description: `${newPhotos.length} photo(s) added to status update.`,
            });
          }
        }
      };
      
      reader.onerror = () => {
        processedCount++;
        toast({
          title: "Upload failed",
          description: `Failed to read ${file.name}.`,
          variant: "destructive"
        });
        
        if (processedCount === filesToProcess.length) {
          setPhotos(prev => [...prev, ...newPhotos]);
          setIsUploading(false);
        }
      };
      
      reader.readAsDataURL(file);
    });

    // Reset input for future uploads
    event.target.value = '';
  };

  // Remove a photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Repair Status</DialogTitle>
          <DialogDescription>
            Change status from <strong>{currentStatus}</strong> to{" "}
            <strong>{newStatus}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Date Picker */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Status Update Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Update Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about this status change..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Attachments (Optional)</FormLabel>
                <span className="text-sm text-muted-foreground">
                  {photos.length}/5 photos
                </span>
              </div>
              
              {/* Photo Upload Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCameraCapture}
                  disabled={isUploading || photos.length >= 5}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Take Photo
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={isUploading || photos.length >= 5}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </Button>
                
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              {photos.length >= 5 && (
                <p className="text-sm text-muted-foreground">
                  Maximum number of photos reached. Remove some to add more.
                </p>
              )}
              
              {/* Photo Preview Grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={photo} 
                        alt={`Status photo ${index + 1}`} 
                        className="w-full h-20 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {photos.length > 0 && (
                <p className="text-xs text-gray-500">
                  {photos.length}/3 photos added
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}