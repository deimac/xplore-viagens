# Padrão de Containers do Site Xplore Viagens

## Visão Geral

Este documento define o padrão visual consistente para todos os containers do site. O componente `StandardContainer` foi criado para garantir que todos os containers sigam o mesmo estilo visual.

## Componente StandardContainer

**Localização:** `client/src/components/StandardContainer.tsx`

### Estilo Padrão

O `StandardContainer` implementa o seguinte padrão visual:

- **Borda:** `border-2 border-muted/40` (borda cinza sutil de 2px)
- **Sombra branca externa:** `boxShadow: '0 0 0 6px #fff'` (efeito de profundidade com borda branca de 6px)
- **Fundo:** `bg-white` (branco) ou `bg-[#FAFAFA]` (cinza muito claro)
- **Border radius:** `rounded-lg` (cantos arredondados)
- **Sombra interna:** `shadow-md` (sombra sutil para profundidade)
- **Padding padrão:** `p-6 md:p-8` (responsivo)

### Uso Básico

```tsx
import { StandardContainer } from "@/components/StandardContainer";

// Uso simples
<StandardContainer>
  <h2>Título</h2>
  <p>Conteúdo do container</p>
</StandardContainer>
```

### Variantes

#### Variant: "default" (padrão)
Fundo branco - ideal para a maioria dos casos

```tsx
<StandardContainer variant="default">
  Conteúdo
</StandardContainer>
```

#### Variant: "muted"
Fundo cinza claro (#FAFAFA) - usado no container "Explore o mundo"

```tsx
<StandardContainer variant="muted">
  Conteúdo
</StandardContainer>
```

### Opções de Padding

```tsx
// Padding padrão (p-6 md:p-8)
<StandardContainer padding="default">...</StandardContainer>

// Padding grande (p-8 md:p-12)
<StandardContainer padding="lg">...</StandardContainer>

// Padding pequeno (p-4 md:p-6)
<StandardContainer padding="sm">...</StandardContainer>

// Sem padding
<StandardContainer padding="none">...</StandardContainer>
```

### Borda Branca Externa

Por padrão, todos os containers têm a borda branca externa. Para desabilitar:

```tsx
<StandardContainer withOuterBorder={false}>
  Conteúdo
</StandardContainer>
```

### Classes Customizadas

Você pode adicionar classes Tailwind adicionais via prop `className`:

```tsx
<StandardContainer className="h-full flex flex-col space-y-4">
  Conteúdo
</StandardContainer>
```

## Containers Refatorados

Os seguintes containers já foram refatorados para usar `StandardContainer`:

1. **Container "Explore o mundo"** (`client/src/pages/Home.tsx`)
   - Variant: `muted`
   - Padding: `lg`
   - Classes adicionais: `space-y-8 section-transition relative overflow-hidden`

2. **Container de conteúdo da seção TravelerTypes** (`client/src/components/TravelerTypesSection.tsx`)
   - Variant: `default`
   - Padding: `default`
   - Classes adicionais: `h-full flex flex-col`

## Diretrizes para Novos Containers

### ✅ SEMPRE use StandardContainer quando:

- Criar qualquer novo container no site
- O container precisar ter o estilo padrão do site
- Quiser garantir consistência visual

### ⚠️ Escolha a variante apropriada:

- **`variant="default"`** (branco): Para a maioria dos containers de conteúdo
- **`variant="muted"`** (cinza claro): Para containers hero ou de destaque

### 📝 Exemplo de Implementação

```tsx
import { StandardContainer } from "@/components/StandardContainer";

export function MinhaSecao() {
  return (
    <section className="py-20">
      <div className="container">
        <h2>Título da Seção</h2>
        
        {/* Container padronizado */}
        <StandardContainer>
          <h3>Subtítulo</h3>
          <p>Conteúdo do container com estilo consistente</p>
        </StandardContainer>
        
        {/* Container com variante muted e padding grande */}
        <StandardContainer variant="muted" padding="lg">
          <h3>Container de Destaque</h3>
          <p>Conteúdo importante</p>
        </StandardContainer>
      </div>
    </section>
  );
}
```

## Benefícios

1. **Consistência Visual:** Todos os containers seguem o mesmo padrão
2. **Manutenibilidade:** Mudanças no estilo podem ser feitas em um único lugar
3. **Produtividade:** Não precisa reescrever estilos repetidamente
4. **Flexibilidade:** Variantes e props permitem customização quando necessário
5. **Documentação:** Código autodocumentado com JSDoc e TypeScript

## Manutenção

Para alterar o estilo padrão de todos os containers:

1. Edite o arquivo `client/src/components/StandardContainer.tsx`
2. Modifique as classes CSS ou estilos inline conforme necessário
3. Todos os containers que usam `StandardContainer` serão atualizados automaticamente

## Notas Importantes

- **NÃO** crie containers com estilos inline duplicando o padrão
- **NÃO** use `<div>` com classes manuais quando `StandardContainer` for apropriado
- **SEMPRE** documente se criar uma variação especial que não se encaixa no `StandardContainer`
- **SEMPRE** use `StandardContainer` como base e adicione classes via `className` prop quando precisar de customização adicional
