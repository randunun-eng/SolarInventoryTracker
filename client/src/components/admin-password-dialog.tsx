import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock } from "lucide-react";

interface AdminPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  targetPage?: string;
}

export function AdminPasswordDialog({
  open,
  onOpenChange,
  onSuccess,
  targetPage,
}: AdminPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter the admin password",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifying(true);
      await apiRequest("POST", "/api/auth/verify-admin", { password });
      
      toast({
        title: "Access granted",
        description: "Admin password verified successfully",
      });
      
      setPassword("");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Access denied",
        description: error.message || "Invalid admin password",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            Admin Password Required
          </DialogTitle>
          <DialogDescription>
            {targetPage 
              ? `This area requires admin privileges. Enter the admin password to access ${targetPage}.`
              : "This area requires admin privileges. Enter the admin password to continue."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isVerifying}
                autoFocus
                data-testid="input-admin-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isVerifying}
              data-testid="button-cancel-admin-auth"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isVerifying}
              data-testid="button-verify-admin-password"
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
