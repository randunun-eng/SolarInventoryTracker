import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { RepairStatusEnum } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema for the update progress form
const updateProgressSchema = z.object({
  status: z.string().min(1, "Status is required"),
  notes: z.string().min(1, "Progress notes are required"),
});

type UpdateProgressFormValues = z.infer<typeof updateProgressSchema>;

interface UpdateProgressFormProps {
  repairId?: number;
  onSuccess: () => void;
}

export function UpdateProgressForm({ repairId, onSuccess }: UpdateProgressFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    },
  });
  
  // Update form values when repair data loads
  useEffect(() => {
    if (repair && Object.keys(repair).length > 0) {
      form.reset({
        status: (repair as any).status || "In Progress",
        notes: "",
      });
    }
  }, [repair, form]);
  
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
        timestamp: new Date().toISOString(),
        note: data.notes,
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
      
      toast({
        title: "Progress updated",
        description: "The repair status has been updated successfully.",
      });
      
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