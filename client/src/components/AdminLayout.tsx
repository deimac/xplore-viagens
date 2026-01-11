import { Link, useLocation } from "wouter";
import { Home, Settings, LogOut, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userQuery = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location === "/admin";
    }
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
          <span className="font-semibold text-lg">Admin</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Voltar ao Site
            </Link>
          </nav>
        </div>
      )}

      <div className="lg:flex">
        {/* Sidebar Desktop */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            <div>
              <h1 className="font-semibold text-lg">{APP_TITLE}</h1>
              <p className="text-xs text-gray-500">Painel Admin</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Voltar ao Site
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64 flex-1">
          {/* Top bar with user info */}
          <div className="hidden lg:flex items-center justify-end gap-4 p-4 border-b border-gray-200 bg-white">
            {userQuery.isLoading ? (
              <div className="text-sm text-gray-500">Carregando...</div>
            ) : userQuery.data ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700">
                  <div className="font-medium">{userQuery.data.name || userQuery.data.email}</div>
                  <div className="text-xs text-gray-500">{userQuery.data.email}</div>
                </div>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await logoutMutation.mutateAsync();
                      toast.success("Logout realizado");
                      // navigate to site root
                      window.location.href = "/";
                    } catch (e) {
                      toast.error("Erro ao deslogar");
                    }
                  }}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Não autenticado</div>
            )}
          </div>
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
