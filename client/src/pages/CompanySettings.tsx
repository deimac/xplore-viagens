import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Mail, Phone, MessageCircle, Instagram, Facebook, Linkedin, Twitter, Link as LinkIcon } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

export default function CompanySettings() {
  const { data: settings, isLoading, refetch } = trpc.companySettings.get.useQuery();
  const updateMutation = trpc.companySettings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    companyName: "",
    cnpj: "",
    foundedDate: "",
    email: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    twitter: "",
    quotationLink: "",
    googleAnalyticsId: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || "",
        cnpj: settings.cnpj || "",
        foundedDate: settings.foundedDate || "",
        email: settings.email || "",
        phone: settings.phone || "",
        whatsapp: settings.whatsapp || "",
        instagram: settings.instagram || "",
        facebook: settings.facebook || "",
        linkedin: settings.linkedin || "",
        twitter: settings.twitter || "",
        quotationLink: settings.quotationLink || "",
        googleAnalyticsId: settings.googleAnalyticsId || "",
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings?.id) {
      toast.error("Configurações não encontradas");
      return;
    }
    updateMutation.mutate({
      id: settings.id,
      ...formData,
    });
  };

  // Funções de máscara
  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const maskWhatsApp = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  // Validação de URL
  const isValidURL = (url: string) => {
    if (!url) return true; // URL vazia é válida (campo opcional)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (field: string, value: string) => {
    let maskedValue = value;
    
    // Aplicar máscaras
    if (field === 'cnpj') {
      maskedValue = maskCNPJ(value);
    } else if (field === 'phone') {
      maskedValue = maskPhone(value);
    } else if (field === 'whatsapp') {
      maskedValue = maskWhatsApp(value);
    }
    
    setFormData((prev) => ({ ...prev, [field]: maskedValue }));
  };

  const handleURLBlur = (field: string) => {
    const value = formData[field as keyof typeof formData];
    if (value && !isValidURL(value)) {
      toast.error(`URL inválida para ${field}. Use o formato: https://exemplo.com`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Configurações não encontradas</CardTitle>
            <CardDescription>
              Nenhuma configuração da empresa foi encontrada no banco de dados.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações da Empresa</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as informações da sua empresa exibidas no site
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Informações básicas sobre a empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Razão Social *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleChange("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foundedDate">Data de Fundação</Label>
                <Input
                  id="foundedDate"
                  value={formData.foundedDate}
                  onChange={(e) => handleChange("foundedDate", e.target.value)}
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contatos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contatos
            </CardTitle>
            <CardDescription>
              Formas de contato com a empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(11) 1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                  placeholder="(11) 91234-5678"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="w-5 h-5" />
              Redes Sociais
            </CardTitle>
            <CardDescription>
              Links para as redes sociais da empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => handleChange("instagram", e.target.value)}
                  onBlur={() => handleURLBlur("instagram")}
                  placeholder="https://instagram.com/empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  value={formData.facebook}
                  onChange={(e) => handleChange("facebook", e.target.value)}
                  onBlur={() => handleURLBlur("facebook")}
                  placeholder="https://facebook.com/empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) => handleChange("linkedin", e.target.value)}
                  onBlur={() => handleURLBlur("linkedin")}
                  placeholder="https://linkedin.com/company/empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter/X
                </Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => handleChange("twitter", e.target.value)}
                  onBlur={() => handleURLBlur("twitter")}
                  placeholder="https://twitter.com/empresa"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link de Cotação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Link de Cotação
            </CardTitle>
            <CardDescription>
              URL para formulário de cotação externo (se houver)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="quotationLink">URL do Formulário</Label>
              <Input
                id="quotationLink"
                value={formData.quotationLink}
                onChange={(e) => handleChange("quotationLink", e.target.value)}
                onBlur={() => handleURLBlur("quotationLink")}
                placeholder="https://forms.google.com/..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Google Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Google Analytics
            </CardTitle>
            <CardDescription>
              ID de rastreamento do Google Analytics (ex: G-XXXXXXXXXX ou UA-XXXXXXXXX-X)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="googleAnalyticsId">ID do Google Analytics</Label>
              <Input
                id="googleAnalyticsId"
                value={formData.googleAnalyticsId}
                onChange={(e) => handleChange("googleAnalyticsId", e.target.value)}
                placeholder="G-XXXXXXXXXX"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
      </div>
    </AdminLayout>
  );
}
