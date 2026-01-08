# Configuração do Google OAuth para Sistema de Avaliações

## Visão Geral

Este documento explica como configurar o Google OAuth para permitir que clientes façam login com suas contas Google e deixem avaliações autênticas com nome real e foto de perfil.

## Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Select a project" → "New Project"
3. Nome do projeto: **Xplore Viagens Reviews**
4. Clique em "Create"

## Passo 2: Ativar Google+ API

1. No menu lateral, vá em **APIs & Services** → **Library**
2. Busque por "Google+ API"
3. Clique em "Enable"

## Passo 3: Criar Credenciais OAuth 2.0

1. Vá em **APIs & Services** → **Credentials**
2. Clique em **"+ CREATE CREDENTIALS"** → **OAuth client ID**
3. Se aparecer aviso sobre OAuth consent screen:
   - Clique em "CONFIGURE CONSENT SCREEN"
   - Escolha **External** (para permitir qualquer usuário Google)
   - Clique "CREATE"
   
### 3.1 Configurar OAuth Consent Screen

**App information:**
- App name: `Xplore Viagens`
- User support email: `seu-email@exemplo.com`
- App logo: (opcional, pode adicionar depois)

**App domain:**
- Application home page: `https://seudominio.com`
- Privacy policy: `https://seudominio.com/privacidade` (criar depois)
- Terms of service: `https://seudominio.com/termos` (criar depois)

**Developer contact information:**
- Email: `seu-email@exemplo.com`

Clique **SAVE AND CONTINUE**

**Scopes:**
- Clique "ADD OR REMOVE SCOPES"
- Selecione:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
- Clique "UPDATE" → "SAVE AND CONTINUE"

**Test users:** (apenas para desenvolvimento)
- Adicione seu email pessoal para testar
- Clique "SAVE AND CONTINUE"

### 3.2 Criar OAuth Client ID

1. Volte para **Credentials** → **"+ CREATE CREDENTIALS"** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `Xplore Viagens Web Client`

**Authorized JavaScript origins:**
```
http://localhost:3000
https://seudominio.com
https://3000-xxxxx.manusvm.computer
```

**Authorized redirect URIs:**
```
http://localhost:3000
https://seudominio.com
https://3000-xxxxx.manusvm.computer
```

4. Clique **CREATE**
5. **COPIE** o **Client ID** e **Client Secret** que aparecerem

## Passo 4: Adicionar Variáveis de Ambiente

### 4.1 No Manus (Management UI)

1. Vá em **Settings** → **Secrets**
2. Adicione as seguintes variáveis:

```
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

**Importante:** 
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` são para o backend (server-side)
- `VITE_GOOGLE_CLIENT_ID` é para o frontend (client-side)

## Passo 5: Testar Configuração

1. Acesse `https://seudominio.com/avaliar/test`
2. Clique no botão "Entrar com Google"
3. Faça login com sua conta Google
4. Autorize o acesso aos dados (email, nome, foto)
5. Você deve ser redirecionado de volta ao site com login bem-sucedido

## Fluxo de Funcionamento

### 1. Cliente recebe link via WhatsApp
```
https://seudominio.com/avaliar/TOKEN_UNICO_123
```

### 2. Cliente acessa página de avaliação
- Vê título da viagem
- Botão "Entrar com Google" aparece

### 3. Cliente clica "Entrar com Google"
- Pop-up do Google abre
- Cliente autoriza acesso (1 clique)
- Google retorna: nome, email, foto

### 4. Sistema salva avaliação
- Nome real do Google
- Foto de perfil do Google
- Rating (1-5 estrelas)
- Comentário escrito

### 5. Avaliação aparece no site
- Nome real (ex: "Maria Silva")
- Foto de perfil do Google
- Rating com estrelas
- Comentário

## Segurança

### ✅ O que o sistema faz:

1. **Valida token no backend** - Não confia no frontend
2. **Verifica com API do Google** - Token é autêntico
3. **Armazena dados mínimos** - Apenas nome, email, foto
4. **Moderação** - Admin pode aprovar/rejeitar reviews
5. **Magic link** - Apenas quem recebeu link pode avaliar

### ❌ O que NÃO fazer:

- ❌ Não compartilhe `GOOGLE_CLIENT_SECRET` publicamente
- ❌ Não confie apenas no token do frontend
- ❌ Não armazene senhas ou tokens de acesso do Google
- ❌ Não permita avaliações sem aprovação (spam)

## Troubleshooting

### Erro: "redirect_uri_mismatch"
**Solução:** Adicione a URL exata em "Authorized redirect URIs" no Google Cloud Console

### Erro: "access_denied"
**Solução:** Verifique se o email está nos "Test users" (modo desenvolvimento)

### Erro: "invalid_client"
**Solução:** Verifique se `GOOGLE_CLIENT_ID` está correto nas variáveis de ambiente

### Pop-up não abre
**Solução:** Desabilite bloqueador de pop-ups para o domínio

## Modo Produção

Quando o site estiver pronto para produção:

1. No Google Cloud Console, vá em **OAuth consent screen**
2. Clique em **PUBLISH APP**
3. Aguarde aprovação do Google (pode levar alguns dias)
4. Após aprovação, qualquer usuário Google pode fazer login

**Enquanto isso:** Adicione emails de teste em "Test users" para permitir que clientes específicos façam login.

## Custos

✅ **Totalmente GRATUITO**
- Google OAuth é gratuito
- Sem limites de usuários
- Sem custos de API

## Referências

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)
- [Google Auth Library](https://www.npmjs.com/package/google-auth-library)
