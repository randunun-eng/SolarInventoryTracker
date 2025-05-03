import { Switch, Route } from "wouter";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/components" component={Components} />
      <Route path="/categories" component={Categories} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/stockalerts" component={StockAlerts} />
      <Route path="/clients" component={Clients} />
      <Route path="/repairs" component={Repairs} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Layout>
        <Router />
      </Layout>
    </TooltipProvider>
  );
}

export default App;
