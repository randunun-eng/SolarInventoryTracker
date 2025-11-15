import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";

export default function AccessDenied() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 text-center">
            This page is restricted to administrators only. If you believe you should have access, please contact your system administrator.
          </p>
          <Button 
            className="w-full" 
            onClick={() => setLocation("/repairs")}
            data-testid="button-go-to-repairs"
          >
            Go to Repair Logs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
