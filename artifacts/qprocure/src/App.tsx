import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuantumProvider } from "@/lib/quantum-context";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/dashboard";
import Procurement from "@/pages/procurement";
import Inventory from "@/pages/inventory";
import Sales from "@/pages/sales";
import QuantumLab from "@/pages/quantum-lab";
import QuantumCode from "@/pages/quantum-code";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/procurement" component={Procurement} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/sales" component={Sales} />
        <Route path="/quantum-lab" component={QuantumLab} />
        <Route path="/quantum-code" component={QuantumCode} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <QuantumProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </QuantumProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
