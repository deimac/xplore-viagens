import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Mail } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar login via tRPC
      // Por enquanto, vamos fazer um login simulado
      if (email === "deimac@gmail.com" && password === "123Xplore#") {
        // Salvar token na sessão
        sessionStorage.setItem("adminToken", "logged-in");
        toast.success("Login realizado com sucesso!");
        navigate("/admin");
      } else {
        toast.error("Email ou senha incorretos");
      }
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent mb-2">Xplore Admin</h1>
          <p className="text-accent/60">Acesso exclusivo para administradores</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-accent/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                className="w-full pl-10 pr-4 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-accent/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-foreground hover:opacity-90 py-2 font-medium"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-accent/60">ou</span>
          </div>
        </div>

        {/* Manus OAuth Button */}
        <Button
          type="button"
          onClick={() => window.location.href = getLoginUrl()}
          className="w-full bg-primary text-primary-foreground hover:opacity-90 py-2 font-medium"
        >
          Entrar com Manus
        </Button>

        {/* Info */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-muted/50">
          <p className="text-xs text-accent/60 text-center">
            <strong>Recomendado:</strong> Use "Entrar com Manus" para login automático como administrador
          </p>
        </div>
      </div>
    </div>
  );
}
