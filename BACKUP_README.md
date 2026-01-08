# Backup Completo - Xplore Viagens

**Data do Backup:** 27/11/2025  
**Versão do Projeto:** fa7b5362

## 📋 Conteúdo do Backup

Este backup contém a estrutura completa e os dados do banco de dados MySQL do projeto Xplore Viagens.

### Tabelas Incluídas:

1. **users** - Usuários do sistema (autenticação OAuth)
2. **categories** - Categorias de viagens (Pacotes, Passagens, Hospedagens, etc)
3. **travels** - Pacotes de viagem com destinos
4. **travelCategories** - Relacionamento entre viagens e categorias
5. **companySettings** - Configurações da empresa (contatos, redes sociais, Google Analytics)

## 🔧 Como Restaurar o Backup

### Opção 1: Via MySQL Command Line

```bash
mysql -u seu_usuario -p nome_do_banco < backup_database.sql
```

### Opção 2: Via phpMyAdmin

1. Acesse o phpMyAdmin
2. Selecione o banco de dados
3. Clique na aba "Importar"
4. Escolha o arquivo `backup_database.sql`
5. Clique em "Executar"

### Opção 3: Via Drizzle ORM (Desenvolvimento)

1. Copie o arquivo `backup_database.sql` para o projeto
2. Execute o comando:
```bash
mysql -u root -p xplore_viagens < backup_database.sql
```

## 📊 Dados Incluídos

### Categorias (5 registros)
- Pacotes
- Passagens
- Hospedagens
- Black Friday
- Promoção

### Viagens (6 destinos)
- Paris (15% OFF)
- Nova York
- Dubai (Oferta Imperdível)
- Tóquio (Exclusivo)
- Bali
- Londres

### Configurações da Empresa
- Nome: Xplore Viagens
- Email: contato@xplore.com.br
- Telefone: (11) 1234-5678
- WhatsApp: (11) 91234-5678
- Redes Sociais: Instagram, Facebook, LinkedIn, Twitter
- Google Analytics: G-XXXXXXXXXX (configurado)

## ⚠️ Observações Importantes

1. **Chaves Estrangeiras:** O script desabilita temporariamente as verificações de chave estrangeira durante a importação
2. **DROP TABLE:** O script remove tabelas existentes antes de criar novas (cuidado com dados existentes!)
3. **Timestamps:** Todos os registros têm timestamps de 27/11/2025 12:00:00
4. **Auto Increment:** Os IDs são preservados para manter relacionamentos

## 🔐 Segurança

- **NÃO** compartilhe este backup publicamente
- Mantenha em local seguro
- Atualize senhas e tokens após restauração em produção
- O Google Analytics ID incluído é um exemplo (G-XXXXXXXXXX)

## 📝 Estrutura do Schema

```
users
├── id (PK, AUTO_INCREMENT)
├── openId (UNIQUE)
├── name
├── email
├── loginMethod
├── role (ENUM: 'user', 'admin')
└── timestamps

categories
├── id (PK, AUTO_INCREMENT)
├── name
├── description
├── icon
└── timestamps

travels
├── id (PK, AUTO_INCREMENT)
├── title
├── description
├── origin
├── departureDate
├── returnDate
├── travelers
├── price
├── imageUrl
├── promotion (NOVO)
├── promotionColor (NOVO)
└── timestamps

travelCategories
├── travelId (FK → travels.id)
├── categoryId (FK → categories.id)
└── createdAt

companySettings
├── id (PK, AUTO_INCREMENT)
├── companyName
├── cnpj
├── foundedDate
├── email
├── phone
├── whatsapp
├── instagram
├── facebook
├── linkedin
├── twitter
├── quotationLink
├── googleAnalyticsId (NOVO)
└── timestamps
```

## 🚀 Próximos Passos Após Restauração

1. Verifique a conexão com o banco de dados
2. Execute `pnpm db:push` para sincronizar o schema Drizzle
3. Teste o acesso ao painel administrativo
4. Atualize as configurações da empresa conforme necessário
5. Configure um Google Analytics ID real (se aplicável)

## 📞 Suporte

Para dúvidas ou problemas na restauração, consulte a documentação do projeto ou entre em contato com o desenvolvedor.

---

**Gerado automaticamente em:** 27/11/2025  
**Projeto:** Xplore Viagens - Sistema de Gestão de Viagens
