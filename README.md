# 🌍 Xplore Viagens

Sistema completo de gerenciamento de agência de viagens com painel administrativo, sistema de avaliações com Google OAuth, e interface moderna responsiva.

## ✨ Funcionalidades Principais

- 🏢 **Painel Administrativo Completo** - Gerenciar categorias, viagens, slides e avaliações
- ⭐ **Sistema de Avaliações** - Clientes podem deixar avaliações com Google OAuth (nome e foto automáticos)
- 🎯 **Gerenciamento de Conteúdo** - Criar e editar categorias, pacotes de viagem, ofertas
- 🖼️ **Slides Hero Personalizáveis** - Criar slides com imagens e textos para página inicial
- 👥 **Autenticação Segura** - Manus OAuth para admin + Google OAuth para clientes
- 📱 **Design Responsivo** - Interface adaptada para desktop, tablet e mobile
- 🎨 **Componentes Reutilizáveis** - StandardContainer, SectionTitle e outros padrões
- 🔄 **Animações Suaves** - Fade-in ao rolar página, transições elegantes

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - Framework UI moderno
- **Tailwind CSS 4** - Estilização utilitária
- **shadcn/ui** - Componentes de UI de alta qualidade
- **Wouter** - Roteamento leve
- **Sonner** - Notificações toast

### Backend
- **Express 4** - Framework web
- **tRPC 11** - RPC type-safe end-to-end
- **Drizzle ORM** - ORM moderno para SQL

### Database
- **MySQL/TiDB** - Banco de dados relacional

### Autenticação
- **Manus OAuth** - Autenticação de administrador
- **Google OAuth** - Autenticação de clientes para avaliações

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- pnpm (recomendado) ou npm
- MySQL/TiDB rodando localmente ou em servidor

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/xplore-viagens.git
cd xplore-viagens
```

2. **Instale dependências**
```bash
pnpm install
```

3. **Configure variáveis de ambiente**
```bash
cp .env.example .env
# Edite .env com suas credenciais reais
```

4. **Execute migrações do banco**
```bash
pnpm db:push
```

5. **Inicie o servidor de desenvolvimento**
```bash
pnpm dev
```

6. **Acesse a aplicação**
- Frontend: http://localhost:5173
- Admin: http://localhost:5173/admin
- API: http://localhost:3000/api

## 🔑 Variáveis de Ambiente

Consulte `.env.example` para lista completa. Principais:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/xplore_viagens

# Authentication
JWT_SECRET=sua-chave-secreta
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret

# Manus
VITE_APP_ID=seu-app-id
OWNER_OPEN_ID=seu-owner-id
```

## 📁 Estrutura do Projeto

```
xplore-viagens/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas (Home, AdminDashboard, ReviewPage, etc)
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilitários (tRPC client, etc)
│   │   └── App.tsx        # Roteamento principal
│   ├── public/            # Arquivos estáticos
│   └── index.html         # HTML principal
├── server/                # Backend Express
│   ├── routers.ts         # Procedures tRPC
│   ├── db.ts              # Query helpers
│   ├── _core/             # Core (auth, OAuth, etc)
│   └── index.ts           # Entry point
├── drizzle/               # Schema e migrações
│   └── schema.ts          # Definição de tabelas
├── shared/                # Código compartilhado
└── storage/               # S3 helpers
```

## 🚀 Comandos Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento

# Build
pnpm build            # Build para produção
pnpm preview          # Preview do build

# Database
pnpm db:push          # Push schema para banco
pnpm db:studio        # Abre Drizzle Studio

# Linting
pnpm lint             # Verifica erros de linting

# Testing
pnpm test             # Executa testes
pnpm test:watch       # Testes em modo watch
```

## 🔐 Autenticação

### Admin (Manus OAuth)
- Acesse `/admin/login`
- Clique em "Entrar com Manus"
- Você será reconhecido como admin automaticamente (owner do projeto)

### Clientes (Google OAuth)
- Acesse `/avaliar`
- Clique em "Entrar com Google"
- Sistema coleta automaticamente nome e foto do perfil
- Cliente preenche avaliação (estrelas + comentário)
- Admin aprova na aba "Avaliações"

## 📊 Padrões de Código

### StandardContainer
Componente reutilizável para containers com estilo padrão (borda branca, sombra):

```tsx
import { StandardContainer } from '@/components/StandardContainer';

<StandardContainer>
  Seu conteúdo aqui
</StandardContainer>
```

### SectionTitle
Componente para títulos de seção com palavra em destaque:

```tsx
import { SectionTitle } from '@/components/SectionTitle';

<SectionTitle 
  title="Soluções para Cada Tipo de"
  highlight="Viajante"
  subtitle="Contamos com um suporte completo..."
/>
```

### FadeInContainer
Animação de fade-in ao rolar a página:

```tsx
import FadeInContainer from '@/components/FadeInContainer';

<FadeInContainer>
  Seu conteúdo aqui
</FadeInContainer>
```

## 🎨 Customização

### Cores e Temas
- Edite `client/src/index.css` para alterar variáveis CSS
- Cores principais: `--accent`, `--primary`, `--secondary`

### Títulos e Logo
- Título: `VITE_APP_TITLE` em `.env`
- Logo: `VITE_APP_LOGO` em `.env`

### Conteúdo do Site
- Edite componentes em `client/src/pages/Home.tsx`
- Adicione novas seções em `client/src/components/`

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Modo watch
pnpm test:watch

# Coverage
pnpm test:coverage
```

## 📝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 🐛 Relatando Bugs

Encontrou um bug? Abra uma issue no GitHub descrevendo:
- Comportamento esperado
- Comportamento atual
- Passos para reproduzir
- Screenshots (se aplicável)

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ para Xplore Viagens

## 🙏 Agradecimentos

- [Manus](https://manus.im) - Plataforma de desenvolvimento
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [tRPC](https://trpc.io) - RPC type-safe

---

**Última atualização:** Dezembro 2025
