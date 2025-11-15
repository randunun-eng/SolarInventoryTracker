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
import { ChatBot } from "@/components/ai/chat-bot";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();

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

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/components" component={() => <ProtectedRoute component={Components} />} />
      <Route path="/categories" component={() => <ProtectedRoute component={Categories} />} />
      <Route path="/suppliers" component={() => <ProtectedRoute component={Suppliers} />} />
      <Route path="/stockalerts" component={() => <ProtectedRoute component={StockAlerts} />} />
      <Route path="/clients" component={() => <ProtectedRoute component={Clients} />} />
      <Route path="/repairs" component={() => <ProtectedRoute component={Repairs} />} />
      <Route path="/repairs/:id/status" component={() => <ProtectedRoute component={RepairStatus} />} />
      <Route path="/invoices" component={() => <ProtectedRoute component={Invoices} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
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
