# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para o Xplore Viagens! Este documento fornece diretrizes e instruções para contribuir com o projeto.

## 📋 Código de Conduta

Todos os contribuidores devem seguir nosso código de conduta:
- Seja respeitoso com outros contribuidores
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros da comunidade

## 🐛 Relatando Bugs

Antes de criar um relatório de bug, verifique se o problema já foi reportado. Se você encontrar um bug:

1. **Use um título claro e descritivo**
2. **Descreva os passos exatos para reproduzir o problema**
3. **Forneça exemplos específicos** para demonstrar os passos
4. **Descreva o comportamento observado** e o que esperava
5. **Inclua screenshots ou GIFs** se possível
6. **Mencione sua versão do Node.js e sistema operacional**

### Exemplo de Relatório de Bug

```
Título: [BUG] Avaliações não aparecem no painel admin após login

Descrição:
Quando faço login como admin e vou para a aba "Avaliações", nenhuma avaliação aparece, 
mesmo tendo criado uma anteriormente.

Passos para reproduzir:
1. Faça login em /avaliar com Google OAuth
2. Crie uma avaliação com 5 estrelas
3. Faça login no admin com Manus OAuth
4. Vá para a aba "Avaliações"
5. Nenhuma avaliação aparece

Comportamento esperado:
A avaliação deve aparecer na lista com status "Pendente"

Comportamento atual:
Lista vazia com mensagem "Nenhuma avaliação ainda"

Screenshots:
[Anexar imagem aqui]

Ambiente:
- Node.js: v18.0.0
- Sistema: Windows 11
- Navegador: Chrome 120
```

## 💡 Sugerindo Melhorias

Sugestões de melhorias são sempre bem-vindas! Para sugerir uma melhoria:

1. **Use um título claro e descritivo**
2. **Forneça uma descrição detalhada da melhoria sugerida**
3. **Liste alguns exemplos de como a melhoria seria útil**
4. **Mencione outras aplicações similares que implementam essa feature**

## 🔄 Pull Requests

### Processo

1. **Fork o repositório** e crie sua branch
```bash
git checkout -b feature/sua-feature
```

2. **Faça suas mudanças** seguindo os padrões de código do projeto

3. **Commit suas mudanças** com mensagens claras
```bash
git commit -m "Adiciona nova feature X"
```

4. **Push para sua branch**
```bash
git push origin feature/sua-feature
```

5. **Abra um Pull Request** descrevendo suas mudanças

### Padrões de Código

#### React/TypeScript
- Use componentes funcionais com hooks
- Adicione tipos TypeScript (evite `any`)
- Use nomes descritivos para variáveis e funções
- Mantenha componentes pequenos e focados

```tsx
// ✅ Bom
interface UserProps {
  name: string;
  email: string;
}

export function UserCard({ name, email }: UserProps) {
  return (
    <div className="p-4 border rounded">
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}

// ❌ Evitar
export function UserCard(props: any) {
  return (
    <div>
      <h3>{props.name}</h3>
      <p>{props.email}</p>
    </div>
  );
}
```

#### Tailwind CSS
- Use classes Tailwind ao invés de CSS customizado
- Mantenha a ordem: layout → spacing → colors → effects
- Use componentes StandardContainer e SectionTitle quando aplicável

```tsx
// ✅ Bom
<div className="flex items-center justify-between p-4 bg-card rounded-lg border border-muted">
  <h2 className="text-lg font-semibold text-foreground">Título</h2>
  <button className="px-4 py-2 bg-accent text-accent-foreground rounded hover:opacity-90">
    Ação
  </button>
</div>

// ❌ Evitar
<div style={{ display: 'flex', padding: '16px', backgroundColor: '#f5f5f5' }}>
  <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Título</h2>
  <button style={{ padding: '8px 16px', backgroundColor: '#3b82f6' }}>Ação</button>
</div>
```

#### Nomes de Commits
```
✅ Bom:
- "Adiciona validação de email no formulário de contato"
- "Corrige bug de avaliações não aparecendo no admin"
- "Refatora componente ReviewCard para melhor performance"

❌ Evitar:
- "fix bug"
- "update"
- "changes"
```

## 📚 Estrutura de Pastas

Ao adicionar novos componentes:

```
client/src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── StandardContainer.tsx
│   ├── SectionTitle.tsx
│   └── [NovosComponentes].tsx
├── pages/
│   ├── Home.tsx
│   ├── AdminDashboard.tsx
│   └── [NovasPáginas].tsx
└── hooks/
    └── [NovosHooks].ts
```

## 🧪 Testes

Ao adicionar novas features:

1. **Escreva testes** para sua funcionalidade
2. **Execute testes localmente** antes de fazer push
3. **Mantenha cobertura de testes** acima de 80%

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

## 📖 Documentação

Se sua mudança afeta a funcionalidade:

1. **Atualize o README.md** se necessário
2. **Adicione comentários** no código complexo
3. **Documente novas variáveis de ambiente** em `.env.example`

## 🎯 Checklist Antes de Fazer Push

- [ ] Código segue os padrões do projeto
- [ ] Sem erros de TypeScript (`pnpm lint`)
- [ ] Testes passam (`pnpm test`)
- [ ] Sem console.log ou código de debug
- [ ] Commits têm mensagens claras
- [ ] README atualizado se necessário
- [ ] Sem mudanças em `.env` ou `.env.example` com valores reais

## 🚀 Processo de Review

1. Um mantenedor revisará seu PR
2. Pode ser solicitadas mudanças
3. Uma vez aprovado, será feito merge
4. Sua contribuição será creditada!

## ❓ Dúvidas?

- Abra uma issue com a tag `[PERGUNTA]`
- Consulte a documentação em README.md
- Verifique issues anteriores similares

## 📝 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a Licença MIT.

---

**Obrigado por contribuir! 🎉**
