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
import AdminRoute from "./components/AdminRoute";
import CompanySettings from "./pages/CompanySettings";
import ReviewPage from "./pages/ReviewPage";
import PrivacidadePage from "./pages/PrivacidadePage";
import ExclusaoDadosPage from "./pages/ExclusaoDadosPage";
import DebugApi from "./pages/DebugApi";
import RoomTypesManager from "./components/RoomTypesManager";
import BedTypesManager from "./components/BedTypesManager";
import Dashboard from "./pages/admin/Dashboard";
import VoosPremiumPage from "./pages/admin/VoosPremiumPage";
import HospedagensPage from "./pages/admin/HospedagensPage";
import ViagensPage from "./pages/admin/ViagensPage";
import CategoriasViagensPage from "./pages/admin/CategoriasViagensPage";
import DestaquesViagensPage from "./pages/admin/DestaquesViagensPage";
import SlidesHeroPage from "./pages/admin/SlidesHeroPage";
import AvaliacoesPage from "./pages/admin/AvaliacoesPage";
import { Redirect } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/hospedagem/:slug"} component={Home} />
      <Route path={"/orcamento"} component={Quotation} />
      <Route path={"/quotation"} component={QuotationForm} />
      <Route path={"/debug-api"} component={DebugApi} />
      <Route path={"/admin/login"} component={AdminLogin} />

      {/* Admin Routes */}
      <Route path={"/admin"} component={() => <Redirect to="/admin/dashboard" />} />
      <Route path={"/admin/dashboard"} component={() => <AdminRoute component={Dashboard} />} />
      <Route path={"/admin/voos-premium"} component={() => <AdminRoute component={VoosPremiumPage} />} />
      <Route path={"/admin/hospedagens"} component={() => <AdminRoute component={HospedagensPage} />} />
      <Route path={"/admin/viagens"} component={() => <AdminRoute component={ViagensPage} />} />
      <Route path={"/admin/viagens/categorias"} component={() => <AdminRoute component={CategoriasViagensPage} />} />
      <Route path={"/admin/viagens/destaques"} component={() => <AdminRoute component={DestaquesViagensPage} />} />
      <Route path={"/admin/slides-hero"} component={() => <AdminRoute component={SlidesHeroPage} />} />
      <Route path={"/admin/avaliacoes"} component={() => <AdminRoute component={AvaliacoesPage} />} />
      <Route path={"/admin/tipos-quartos"} component={() => <AdminRoute component={RoomTypesManager} />} />
      <Route path={"/admin/tipos-camas"} component={() => <AdminRoute component={BedTypesManager} />} />
      <Route path={"/admin/configuracoes"} component={() => <AdminRoute component={CompanySettings} />} />

      <Route path={"/avaliar"} component={ReviewPage} />
      <Route path={"/politica-de-privacidade"} component={PrivacidadePage} />
      <Route path={"/exclusao-de-dados"} component={ExclusaoDadosPage} />
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
