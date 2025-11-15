import { Switch, Route, Redirect } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/sidebar";
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
import { ChatBot } from "@/components/ai/chat-bot";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  component: () => JSX.Element;
  requiredRoles?: string[];
}

function ProtectedRoute({ component: Component, requiredRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

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

  // Check if user has required role
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Redirect to="/access-denied" />;
  }

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
    <TooltipProvider>
      <AuthProvider>
        <Switch>
          {/* Public routes - no auth required */}
          <Route path="/login" component={Login} />
          <Route path="/track/:token" component={TrackRepair} />
          <Route path="/access-denied" component={AccessDenied} />
          
          {/* Protected routes with layout */}
          <Route>
            <Layout>
              <Router />
              <ChatBot />
            </Layout>
          </Route>
        </Switch>
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;
