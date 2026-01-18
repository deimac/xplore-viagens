import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TRPCProvider } from "./lib/trpcProvider";
import { trpc } from "./lib/trpc";
import GoogleAnalytics from "./components/GoogleAnalytics";
import Home from "./pages/Home";
import QuotationForm from "./pages/QuotationForm";
import Quotation from "./pages/Quotation";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import TravelDetails from "./pages/TravelDetails";
import CompanySettings from "./pages/CompanySettings";
import ReviewPage from "./pages/ReviewPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/destino/:id"} component={TravelDetails} />
      <Route path={"/orcamento"} component={Quotation} />
      <Route path={"/quotation"} component={QuotationForm} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin"} component={() => <AdminRoute component={AdminDashboard} />} />
      <Route path={"/admin/configuracoes"} component={() => <AdminRoute component={CompanySettings} />} />
      <Route path={"/avaliar"} component={ReviewPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function AppContent() {
  const { data: companySettings } = trpc.companySettings.get.useQuery();

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      // switchable
      >
        <TooltipProvider>
          <Toaster />
          {companySettings?.googleAnalyticsId && (
            <GoogleAnalytics measurementId={companySettings.googleAnalyticsId} />
          )}
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <TRPCProvider>
      <AppContent />
    </TRPCProvider>
  );
}

export default App;
