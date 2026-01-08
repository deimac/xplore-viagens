# Padrão de Títulos de Seção

## Visão Geral

Este documento define o padrão de títulos e subtítulos usado em todas as seções do site Xplore Viagens. O componente `SectionTitle` centraliza os estilos em um único lugar, garantindo consistência visual e facilitando manutenção.

## Componente: SectionTitle

**Localização:** `client/src/components/SectionTitle.tsx`

### Características

- **Título grande** com fonte leve (`font-light`)
- **Palavra-chave em destaque** com fonte em negrito (`font-semibold`)
- **Subtítulo descritivo** em cinza médio (`text-muted-foreground`)
- **Alinhamento configurável** (esquerda, centro, direita)
- **Cor do título:** `text-accent` (azul do tema)
- **Espaçamento padrão:** `mb-12 md:mb-16`

### Props

```typescript
interface SectionTitleProps {
  title?: string;          // Primeira parte do título
  highlight?: string;      // Palavra em destaque (negrito)
  fullTitle?: string;      // Título completo sem destaque
  subtitle?: string;       // Subtítulo descritivo
  align?: "left" | "center" | "right";  // Alinhamento (padrão: center)
  className?: string;      // Classes CSS adicionais
}
```

## Uso

### Exemplo 1: Título com Palavra em Destaque

```tsx
<SectionTitle 
  title="Soluções para Cada Tipo de"
  highlight="Viajante"
  subtitle="Contamos com um suporte completo para quem busca um simples deslocamento..."
/>
```

**Resultado:** "Soluções para Cada Tipo de **Viajante**"

### Exemplo 2: Título Simples

```tsx
<SectionTitle 
  fullTitle="Ofertas de Destinos"
  subtitle="Deixe-nos inspirar sua próxima viagem"
/>
```

**Resultado:** "Ofertas de Destinos"

### Exemplo 3: Com Alinhamento Customizado

```tsx
<SectionTitle 
  title="Pronto para Sua Próxima"
  highlight="Aventura?"
  subtitle="Entre em contato e vamos criar algo incrível juntos"
  align="left"
/>
```

## Seções Refatoradas

As seguintes seções já utilizam o componente `SectionTitle`:

1. ✅ **Soluções para Cada Tipo de Viajante** (`TravelerTypesSection.tsx`)
2. ✅ **Ofertas de Destinos** (`PackagesCarouselTail.tsx`)
3. ✅ **Serviços Sob Medida para o Sucesso** (`Home.tsx`)
4. ✅ **Descubra Nossas Últimas Criações** (`Home.tsx`)
5. ✅ **O que Nossos Clientes Dizem** (`Home.tsx`)
6. ✅ **Pronto para Sua Próxima Aventura?** (`Home.tsx`)

## Benefícios da Padronização

### 1. Manutenção Centralizada
Alterar cor, tamanho ou fonte em **um único arquivo** (`SectionTitle.tsx`) atualiza **todos os títulos** do site automaticamente.

### 2. Consistência Visual
Todos os títulos seguem exatamente o mesmo padrão visual, criando identidade forte e profissional.

### 3. Menos Código Duplicado
Elimina repetição de classes CSS e estrutura HTML em múltiplos arquivos.

### 4. Facilidade de Uso
Desenvolvedores podem criar novos títulos rapidamente sem se preocupar com estilos.

## Como Alterar Estilos Globalmente

### Mudar Cor do Título

Edite a linha 72 em `SectionTitle.tsx`:

```tsx
<h2 className="text-4xl font-light text-accent mb-2">
//                                  ^^^^^^^^^^
// Altere para: text-primary, text-blue-600, etc.
```

### Mudar Tamanho do Título

Edite a linha 72 em `SectionTitle.tsx`:

```tsx
<h2 className="text-4xl font-light text-accent mb-2">
//            ^^^^^^^^
// Altere para: text-5xl, text-6xl, etc.
```

### Mudar Cor do Subtítulo

Edite a linha 83 em `SectionTitle.tsx`:

```tsx
<p className="text-muted-foreground">
//           ^^^^^^^^^^^^^^^^^^^^^
// Altere para: text-gray-600, text-accent/70, etc.
```

## Uso Futuro

**Sempre que criar uma nova seção com título:**

1. Importe o componente:
   ```tsx
   import { SectionTitle } from "@/components/SectionTitle";
   ```

2. Use o componente em vez de criar HTML manualmente:
   ```tsx
   <SectionTitle 
     title="Primeira Parte do"
     highlight="Título"
     subtitle="Descrição da seção"
   />
   ```

3. Envolva com `FadeInContainer` para animação:
   ```tsx
   <FadeInContainer>
     <SectionTitle 
       title="Primeira Parte do"
       highlight="Título"
       subtitle="Descrição da seção"
     />
   </FadeInContainer>
   ```

## Notas Importantes

- **NÃO crie títulos manualmente** com `<h2>` e classes CSS
- **SEMPRE use SectionTitle** para manter consistência
- **Envolva com FadeInContainer** para animação de scroll
- **Use props `title` + `highlight`** quando houver palavra em destaque
- **Use prop `fullTitle`** quando o título não tiver palavra em destaque

## Relação com Outros Padrões

Este padrão trabalha em conjunto com:

- **StandardContainer** (padrão de containers)
- **FadeInContainer** (padrão de animações)

Juntos, eles garantem consistência visual total no site.
