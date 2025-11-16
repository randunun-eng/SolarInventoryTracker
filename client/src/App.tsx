import { Switch, Route, Redirect } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/sidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "@/pages/dashboard";
import Components from "@/pages/components";
import Clients from "@/pages/clients";
import Repairs from "@/pages/repairs";
import Categories from "@/pages/categories";
import Suppliers from "@/pages/suppliers";
import StockAlerts from "@/pages/stock-alerts";
import Invoices from "@/pages/invoices";
import Settings from "@/pages/settings";
import RepairStatus from "@/pages/repair-status";
import Users from "@/pages/users";
import TrackRepair from "@/pages/track-repair";
import Login from "@/pages/login";
import AccessDenied from "@/pages/access-denied";
import TestDiagnostic from "@/pages/test-diagnostic";
import { ChatBot } from "@/components/ai/chat-bot";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AdminElevationProvider, useAdminElevation } from "@/lib/admin-elevation";
import { AdminPasswordDialog } from "@/components/admin-password-dialog";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface ProtectedRouteProps {
  component: () => JSX.Element;
  requiredRoles?: string[];
}

function ProtectedRoute({ component: Component, requiredRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isElevated, elevate } = useAdminElevation();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const verificationSucceededRef = useRef(false);

  // Check if user has required role or is elevated
  const hasAccess = !requiredRoles || 
                    (user && user.role && requiredRoles.includes(user.role)) || 
                    isElevated;

  // Use useEffect to show password dialog when access is needed (avoid setState during render)
  useEffect(() => {
    if (!hasAccess && requiredRoles && !showPasswordDialog) {
      setShowPasswordDialog(true);
      verificationSucceededRef.current = false; // Reset ref when opening dialog
    }
  }, [hasAccess, requiredRoles, showPasswordDialog]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Block rendering of component until access is granted (prevents 403 errors on mount)
  if (!hasAccess) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-slate-600">Verifying access...</p>
          </div>
        </div>
        <AdminPasswordDialog
          open={showPasswordDialog}
          onOpenChange={(open) => {
            // Only redirect if user cancelled (not if verification succeeded)
            if (!open && !verificationSucceededRef.current) {
              window.location.href = "/repairs";
            }
            setShowPasswordDialog(open);
          }}
          onSuccess={() => {
            verificationSucceededRef.current = true; // Set synchronously before elevation
            elevate();
            setShowPasswordDialog(false); // Close dialog explicitly
          }}
          targetPage={requiredRoles?.join(", ") + " area"}
        />
      </>
    );
  }

  // Only render component when access is granted
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Admin-only routes */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} requiredRoles={['Admin']} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} requiredRoles={['Admin']} />} />
      <Route path="/components" component={() => <ProtectedRoute component={Components} requiredRoles={['Admin']} />} />
      <Route path="/categories" component={() => <ProtectedRoute component={Categories} requiredRoles={['Admin']} />} />
      <Route path="/suppliers" component={() => <ProtectedRoute component={Suppliers} requiredRoles={['Admin']} />} />
      <Route path="/stockalerts" component={() => <ProtectedRoute component={StockAlerts} requiredRoles={['Admin']} />} />
      <Route path="/clients" component={() => <ProtectedRoute component={Clients} requiredRoles={['Admin']} />} />
      <Route path="/invoices" component={() => <ProtectedRoute component={Invoices} requiredRoles={['Admin']} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} requiredRoles={['Admin']} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} requiredRoles={['Admin']} />} />
      
      {/* Shared routes (Admin and Technician) */}
      <Route path="/repairs" component={() => <ProtectedRoute component={Repairs} />} />
      <Route path="/repairs/:id/status" component={() => <ProtectedRoute component={RepairStatus} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary componentName="Application">
      <TooltipProvider>
        <AuthProvider>
          <AdminElevationProvider>
            <Switch>
              {/* Public routes - no auth required */}
              <Route path="/login" component={Login} />
              <Route path="/track/:token" component={TrackRepair} />
              <Route path="/access-denied" component={AccessDenied} />
              <Route path="/test-diagnostic" component={TestDiagnostic} />

              {/* Protected routes with layout */}
              <Route>
                <Layout>
                  <Router />
                  <ErrorBoundary
                    componentName="ChatBot"
                    fallback={null}
                  >
                    <ChatBot />
                  </ErrorBoundary>
                </Layout>
              </Route>
            </Switch>
          </AdminElevationProvider>
        </AuthProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
