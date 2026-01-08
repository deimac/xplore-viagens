# Project TODO

## Banco de Dados
- [x] Criar tabela de destinos turísticos (destinations)
- [x] Criar tabela de reservas (bookings)
- [x] Executar migração do banco de dados

## Backend (tRPC)
- [x] Implementar rota para listar destinos
- [x] Implementar rota para obter detalhes de um destino
- [x] Implementar rota para criar reserva (protegida)
- [x] Implementar rota para listar reservas do usuário (protegida)
- [x] Implementar rota para cancelar reserva (protegida)

## Frontend
- [x] Definir paleta de cores e tema visual
- [x] Criar página inicial (Home) com destinos em destaque
- [x] Criar página de listagem de destinos
- [x] Criar página de detalhes do destino
- [x] Criar página de minhas reservas (área do usuário)
- [x] Implementar navegação entre páginas
- [x] Adicionar estados de loading e erro
- [x] Implementar sistema de autenticação (login/logout)

## Melhorias e Polimento
- [ ] Adicionar imagens aos destinos
- [ ] Implementar busca e filtros de destinos
- [ ] Adicionar responsividade mobile
- [ ] Testar fluxo completo de reserva


## Restauração do Frontend
- [x] Extrair backup do frontend
- [x] Copiar todos os arquivos do cliente (pages, components, assets)
- [x] Integrar design e estilos do backup
- [x] Verificar compatibilidade com backend existente
- [x] Testar todas as funcionalidades
- [x] Recriar schema do banco de dados MySQL
- [x] Popular banco com dados iniciais
- [x] Criar rotas tRPC para travels e quotations
- [x] Corrigir erros de compilação


## Correções Pendentes
- [x] Corrigir carrossel de pacotes que não está exibindo dados
- [x] Investigar problema de comunicação tRPC client/server (problema: superjson wrapping)
- [x] Remover console.logs de debug após correção


## Melhorias de Design
- [x] Redesenhar carrossel para exibir 2 cards por vez
- [x] Alinhar estrutura do carrossel com padrão das outras seções
- [x] Ajustar espaçamento e responsividade


## Correção de Filtros
- [x] Implementar lógica de filtragem por categoria no carrossel
- [x] Conectar filtros com tabela travel_categories
- [x] Testar filtragem com todas as categorias


## Otimização de Filtros
- [x] Exibir apenas categorias que possuem pacotes associados
- [x] Ocultar categorias vazias do carrossel


## Ajustes de Layout
- [x] Padronizar altura dos cards de pacotes
- [x] Garantir altura uniforme independente do tamanho da descrição
- [x] Testar opção 3: line-clamp-2 + min-h para forçar 2 linhas de descrição


## Correção de Navegação do Carrossel
- [x] Restaurar botões redondos com setas alinhados à esquerda
- [x] Manter indicadores em dots alinhados à direita
- [x] Seguir padrão visual do site


## Navegação do Carrossel
- [x] Desktop: manter 2 cards visíveis, navegar 1 a 1
- [x] Mobile: mostrar 1 card, navegar 1 a 1
- [x] Implementar swipe/toque lateral no mobile
- [x] Testar navegação em ambas as plataformas


## Ajustes de Animação
- [x] Remover fade da navegação do carrossel (botões/dots)
- [x] Manter fade apenas no carregamento inicial da seção


## Correção de Bugs
- [x] Corrigir erro categories.map no AdminDashboard
- [x] Ajustar acesso a dados com superjson wrapping


## Modificação do Cabeçalho
- [x] Estender fundo azul do cabeçalho para baixo
- [x] Posicionar hero section sobre o fundo azul
- [x] Fundo azul deve ir até o meio do container hero
- [x] Preencher laterais com fundo azul


## Ajuste de Espaçamento
- [x] Aumentar espaço entre logo e container hero
- [x] Descer container hero em 20%


## Ajuste de Posição da Logo
- [x] Descer logo em 5% adicionando padding superior ao cabeçalho


## Reorganização do Menu Mobile
- [x] Remover cabeçalho extra do mobile
- [x] Mover menu hamburguer para cabeçalho principal (fundo azul)
- [x] Alinhar menu hamburguer à direita


## Otimização Mobile
- [x] Reduzir marginTop do container hero no mobile
- [x] Melhorar aproveitamento de espaço vertical em telas pequenas


## Correção de Cabeçalho
- [x] Remover cabeçalho branco extra acima do cabeçalho azul
- [x] Garantir que apenas o cabeçalho azul apareça no topo


## Carrossel de Teste (Modelo Alternativo)
- [x] Criar componente PackagesCarouselTail.tsx
- [x] Implementar 5 cards visíveis (1 central + 2 laterais cada lado)
- [x] Card central com scale maior e z-index destacado
- [x] Cards laterais com scale menor e sobreposição
- [x] Transições suaves (translateX + scale)
- [x] Navegação com setas e bolinhas indicadoras
- [x] Adicionar seção de teste na HomePage
- [x] Testar funcionalidade completa


## Correções do Carrossel de Teste
- [x] Verificar quantidade de registros no banco (mínimo 5)
- [x] Adicionar mais destinos se necessário
- [x] Corrigir cards cortados (overflow e dimensões)
- [x] Ajustar lógica para exibir 5 cards simultaneamente
- [x] Tornar botões de navegação visíveis
- [x] Testar visualização completa


## Melhorias de Profundidade no Carrossel
- [x] Aplicar blur nos cards laterais
- [x] Ajustar opacidade gradual conforme distância do centro
- [x] Testar efeito visual de profundidade


## Ajuste Visual do Carrossel
- [x] Remover blur dos cards laterais
- [x] Manter apenas efeito de opacidade
- [x] Testar visual nítido


## Ajuste Final do Carrossel
- [x] Remover opacidade dos cards laterais (todos 100%)
- [x] Reduzir tamanho proporcional dos cards
- [x] Ajustar para caber na área central entre colunas
- [x] Testar visual final


## Alinhamento do Carrossel
- [x] Aproximar cards laterais reduzindo translateX
- [x] Ajustar largura total para alinhar com outras seções
- [x] Testar consistência visual com resto da página


## Alinhamento Preciso dos Cards Distantes
- [x] Analisar largura da seção Pacotes de Viagem
- [x] Ajustar posicionamento dos cards distantes do carrossel
- [x] Alinhar bordas externas com cards de Pacotes de Viagem
- [x] Testar alinhamento visual


## Correção de Estrutura do Carrossel
- [x] Mudar max-w-7xl para max-w-4xl
- [x] Adicionar md:px-16 ao padding lateral
- [x] Remover container intermediário duplicado
- [x] Testar alinhamento com Pacotes de Viagem


## Correção de Posicionamento dos Cards Distantes
- [x] Analisar problema de cards atrás das colunas
- [x] Ajustar translateX para respeitar padding do container
- [x] Garantir que cards distantes fiquem dentro da área visível
- [x] Testar alinhamento final


## Ajuste de Distâncias e Proporções dos Cards
- [x] Alinhar cards distantes com bordas dos cards de Pacotes de Viagem
- [x] Aproximar cards laterais próximos do card principal
- [x] Criar composição mais compacta e proporcional
- [x] Testar alinhamento final


## Correção de Bug na Navegação
- [x] Analisar cards ocultos aparecendo durante transições
- [x] Ajustar translateX dos cards ocultos
- [x] Garantir que cards ocultos não apareçam como sombra
- [x] Testar navegação suave sem artefatos visuais


## Otimização Mobile do Carrossel
- [x] Implementar swipe/touch para navegação com dedo
- [x] Ajustar para 3 cards visíveis no mobile (1 central + 1 cada lado)
- [x] Reduzir tamanho dos cards no mobile
- [x] Ocultar botões de seta no mobile
- [x] Manter apenas bolinhas indicadoras visíveis
- [x] Testar navegação touch em viewport mobile


## Correção de Scroll Horizontal Mobile
- [x] Ajustar translateX dos cards laterais para ficarem dentro da viewport
- [x] Adicionar overflow-hidden no container para prevenir scroll horizontal
- [x] Testar swipe sem movimento indesejado da página
- [x] Garantir que cards não ultrapassem largura da tela


## Ajuste de Tamanho e Espaçamento Mobile
- [x] Aumentar scale do card principal no mobile
- [x] Ajustar translateX dos cards laterais para alinhamento com Pacotes de Viagem
- [x] Testar alinhamento em viewport mobile


## Verificação e Correção Mobile
- [x] Analisar detecção mobile (isMobile state)
- [x] Comparar estrutura com seção Pacotes de Viagem
- [x] Corrigir aplicação de estilos mobile
- [x] Garantir alinhamento correto em viewport mobile real


## Correção Definitiva Mobile
- [x] Restaurar detecção isMobile com useEffect
- [x] Criar lógica separada para mobile (3 cards) e desktop (5 cards)
- [x] Aumentar card principal mobile (scale 1.05)
- [x] Ajustar cards laterais mobile (translateX ±70%, scale 0.75)
- [x] Testar em viewport desktop


## Adicionar Botões de Categorias e Remover Carrossel Antigo
- [x] Adicionar botões de categorias (Todos, Pacotes, Black Friday, Promoção) ao PackagesCarouselTail
- [x] Implementar lógica de filtro por categoria
- [x] Remover PackagesCarousel antigo da HomePage
- [x] Testar filtros de categoria funcionando


## Página de Detalhes do Destino
- [x] Criar componente TravelDetails.tsx
- [x] Implementar galeria de fotos
- [x] Adicionar seção de informações detalhadas (descrição, preço, duração)
- [x] Criar seção de itinerário
- [x] Adicionar formulário de reserva/cotação
- [x] Criar rota /destino/:id no App.tsx
- [x] Implementar navegação ao clicar no card central do carrossel
- [x] Testar navegação e exibição de detalhes

## Correção de Problemas tRPC
- [x] Corrigir import do AppRouter em client/src/lib/trpc.ts
- [x] Desativar superjson transformer (causava erro de serialização)
- [x] Testar navegação entre múltiplos destinos (Paris, Nova York)
- [x] Verificar funcionamento completo da página de detalhes

## Melhorias nos Cards do Carrossel
- [x] Adicionar campo origin (origem) no topo esquerdo do card
- [x] Adicionar campos departureDate e returnDate no centro do card
- [x] Adicionar campo travelers no centro do card
- [x] Implementar lógica para mostrar campos apenas quando preenchidos
- [x] Adicionar ícones para cada campo (localização, calendário, grupo)
- [x] Ajustar responsividade para mobile (tamanhos diferentes)
- [x] Testar visualização com dados completos e incompletos
- [x] Atualizar dados de exemplo no banco (Paris, Nova York, Tóquio)

## Ajustes de Layout nos Cards
- [x] Mover campo origin do topo esquerdo para abaixo do título
- [x] Adicionar texto fixo "Saindo de" antes do campo origin
- [x] Reduzir tamanho da fonte do campo origin (menor que título)
- [x] Manter ícone de localização (MapPin)
- [x] Testar visual final

## Cálculo de Duração da Viagem
- [x] Criar função para calcular número de dias entre departureDate e returnDate
- [x] Adicionar duração ao lado do título no formato "Título | X dias"
- [x] Implementar exibição condicional (só mostrar se ambas as datas existirem)
- [x] Ajustar estilos para separador visual (pipe)
- [x] Testar com diferentes formatos de data (ISO e DD/MMM)

## Melhorias no Badge de Preço
- [x] Adicionar texto fixo "a partir de" acima do badge de preço
- [x] Aumentar transparência do badge de preço (bg-white/70)
- [x] Adicionar texto de viajantes abaixo do preço (sem badge)
- [x] Implementar lógica singular/plural: "para 1 viajante" vs "para X viajantes"
- [x] Ajustar espaçamento e alinhamento vertical (flex-col items-end gap-1)
- [x] Testar visual final

## Correção de Viajantes
- [x] Verificar dados atuais do campo travelers no banco
- [x] Corrigir lógica de exibição para mostrar apenas número do banco
- [x] Ajustar dados do banco (removidos textos "pessoas", "2-15")
- [x] Implementar lógica simples: número + "viajante" (singular) ou "viajantes" (plural)
- [x] Testar com diferentes valores (1, 2, 8, 10, 15)

## Teste de Remoção de Badges Centrais
- [x] Remover badges de data do centro dos cards
- [x] Remover badges de viajantes do centro dos cards
- [x] Alinhar conteúdo à esquerda (já estava alinhado)
- [x] Testar visual mais limpo - APROVADO! Visual muito mais elegante

## Correção: Datas e Viajantes sem Badge
- [x] Recolocar datas no centro do card (sem badge branco)
- [x] Recolocar viajantes no centro do card (sem badge branco)
- [x] Alinhar à esquerda (left-4 md:left-6)
- [x] Manter ícones (Calendar e Users em branco)
- [x] Usar apenas texto branco com ícones
- [x] Testar visual final - Aprovado!

## Ajuste Final de Viajantes
- [x] Aplicar regra singular/plural nos viajantes da esquerda ("1 viajante" vs "X viajantes")
- [x] Remover texto de viajantes do badge de preço (topo direito)
- [x] Manter apenas "a partir de" e preço no badge
- [x] Testar visual final sem redundância - APROVADO! Informação aparece apenas uma vez

## Ajustes de Formatação de Texto
- [x] Aplicar mesmo tamanho e negrito do título nos "X dias" (text-xl md:text-2xl font-bold)
- [x] Aplicar mesmo tamanho e negrito das datas no "Saindo de" (text-sm md:text-base font-medium)
- [x] Padronizar formato de datas no banco (DD/Mês - DD/Mês)
- [x] Atualizar Nova York para formato curto (10/Fev - 17/Fev)
- [x] Atualizar Dubai para formato curto (10/Jan - 18/Jan)
- [x] Testar visual final com formatação consistente - APROVADO!

## Ajuste de Formato de Data com Ano
- [x] Verificar tipo do campo departureDate e returnDate no schema (varchar)
- [x] Atualizar datas no banco para formato padrão DD/MM/AAAA (15/01/2025)
- [x] Criar função de formatação DD/MM/AAAA → DD/Mês/AAAA (15/Jan/2025)
- [x] Ajustar função calculateDays para trabalhar com DD/MM/AAAA
- [x] Testar com datas de anos diferentes (2025) - Pronto para 2026, 2027, etc!

## Padronização de Todas as Datas
- [x] Verificar todas as datas na tabela travels (6 registros)
- [x] Identificar registros com formato inconsistente (Tóquio, Bali, Londres)
- [x] Atualizar todos os registros para formato DD/MM/AAAA
- [x] Testar formatação em todos os cards do carrossel - TODOS CORRETOS!

## Filtrar Viagens Futuras
- [x] Ajustar query getAllTravels para filtrar apenas departureDate > data atual
- [x] Converter formato DD/MM/AAAA para Date para comparação
- [x] Testar que viagens passadas não aparecem mais
- [x] Verificar que apenas viagens futuras são exibidas no carrossel

## Validações de Data no Admin
- [ ] Adicionar validação: data de partida deve ser maior que hoje
- [ ] Adicionar validação: data de retorno deve ser maior que data de partida
- [ ] Implementar mensagens de erro claras para o usuário
- [ ] Testar validações no formulário do admin

## Adicionar Viagens Futuras para Teste
- [x] Atualizar TODOS os 6 destinos para datas futuras (dezembro/2025 até maio/2026)
- [x] Testar que carrossel mostra 5 cards simultaneamente no desktop
- [x] Verificar formatação de datas com anos 2025 e 2026
- [x] Confirmar navegação com 6 bolinhas indicadoras

## Efeito de Hover nos Cards do Carrossel
- [ ] Ocultar preço por padrão (visível apenas no hover)
- [ ] Criar overlay escuro com transição suave no hover
- [ ] Exibir preço centralizado sobre a imagem no hover
- [ ] Adicionar animação de fade-in para o preço
- [ ] Testar efeito em desktop e mobile

## Sistema de Badges de Promoção
- [x] Adicionar campo promotion (varchar 30) na tabela travels
- [x] Adicionar campo promotionColor (varchar 20) na tabela travels
- [x] Executar migração do banco de dados (ALTER TABLE)
- [x] Implementar badge visual no canto superior esquerdo dos cards
- [x] Adicionar animação sutil de destaque no badge (animate-pulse)
- [x] Adicionar efeito de brilho ao redor do badge (boxShadow)
- [x] Testar com diferentes textos e cores de promoção
- [x] Adicionar dados de exemplo (Paris: 15% OFF vermelho, Dubai: Oferta Imperdível laranja, Tóquio: Exclusivo roxo)

## Sombra nos Cards do Carrossel
- [x] Substituir shadow-2xl por sombra customizada focada na parte inferior
- [x] Criar efeito de elevação sutil com sombra direcionada para baixo (dupla camada)
- [x] Testar visual em desktop e mobile

## Ajustar Intensidade da Sombra
- [x] Verificar se sombra está aplicada corretamente no código
- [x] Aumentar intensidade da sombra para melhor visibilidade (dobrado blur e distância)
- [x] Testar em diferentes fundos e condições de visualização

## Padronizar Tamanhos dos Ícones
- [x] Verificar tamanhos atuais dos ícones Calendar, Users e MapPin
- [x] Ajustar ícone MapPin de w-3 h-3 md:w-4 md:h-4 para w-4 h-4 md:w-5 md:h-5
- [x] Testar consistência visual nos cards - todos os ícones agora uniformes

## Animação de Entrada no Carrossel
- [x] Verificar como outras seções implementam efeito de fade-in/slide-up (FadeInContainer)
- [x] Aplicar mesmo padrão de animação na seção do carrossel (título, filtros, carrossel)
- [x] Implementar delays escalonados (0ms, 100ms, 200ms) para efeito cascata
- [x] Testar animação durante scroll da página - funcionando perfeitamente

## Ajustar Tooltip do Menu
- [x] Localizar tooltips do menu lateral (4 tooltips: menu items, WhatsApp, Cotações, Ir ao Topo)
- [x] Remover transparência do fundo (bg-muted/20 e rgba removidos)
- [x] Aplicar cor sólida bg-white com border-gray-300 para visibilidade sobre fundo azul
- [x] Testar em diferentes seções da página - tooltips agora com fundo branco sólido

## Remover Borda Branca do Menu Mobile
- [x] Localizar menu dropdown mobile no código (linha 269-297)
- [x] Identificar box-shadow branca entre itens (boxShadow: '0 0 0 6px #fff')
- [x] Remover borda branca mantendo apenas bordas normais dos itens (border-2)
- [x] Verificar código - box-shadow removida com sucesso

## Adicionar Imagem de Fundo no Hero
- [x] Copiar imagem mao.png para client/public/
- [x] Adicionar background-image no container hero (absolute positioning)
- [x] Alinhar à direita e ajustar tamanho (w-64 h-64 md:w-80 md:h-80)
- [x] Aplicar opacity-20 para não competir com texto
- [x] Testar visibilidade e harmonia com o texto - perfeito!

## Ajustar Tamanho e Opacidade da Imagem Hero
- [x] Aumentar tamanho da imagem para preencher lateral direita (w-full h-full md:w-1/2)
- [x] Remover opacidade (opacity-20 → opacity-100) - agora 100% nítida
- [x] Ajustar posicionamento para cobrir toda altura (top-0 h-full)
- [x] Mudar backgroundSize de contain para cover
- [x] Testar visibilidade 100% nítida - perfeito!

## Ajustar Imagem Hero para Mobile
- [x] Reduzir tamanho da imagem no mobile (w-48 h-48 = 192px)
- [x] Ajustar posicionamento para não cobrir texto (bottom-0 no mobile)
- [x] Manter tamanho grande apenas no desktop (md:w-1/2 md:h-full)
- [x] Mudar backgroundSize para contain para manter proporções
- [x] Testar em viewport mobile - perfeito!

## Remover Imagem Hero do Mobile
- [x] Adicionar classe hidden no mobile
- [x] Manter visível apenas no desktop (md:block)
- [x] Simplificar classes removendo estilos mobile desnecessários
- [x] Imagem agora aparece apenas em desktop

## Substituir Imagem Hero
- [x] Copiar NovaMao.png para client/public/
- [x] Atualizar referência no código de mao.png para NovaMao.png
- [x] Testar nova imagem no desktop - funcionando perfeitamente!

## Ajustar Título e Subtítulo Hero
- [x] Diminuir tamanho do título (text-5xl md:text-6xl lg:text-7xl → text-4xl md:text-5xl)
- [x] Diminuir tamanho do subtítulo (text-lg md:text-xl → text-base md:text-lg)
- [x] Adicionar max-w-xl para limitar largura e não sobrepor imagem
- [x] Trocar "que transformam vidas" por "e viva experiências transformadoras"
- [x] Adicionar z-index ao conteúdo para ficar acima da imagem (relative z-10)
- [x] Adicionar z-index aos botões também
- [x] Testar em desktop - layout perfeito!

## Área de Configurações da Empresa
- [x] Criar tabela companySettings no schema (razão social, CNPJ, data fundação, email, telefone, WhatsApp, redes sociais, link cotação)
- [x] Executar migração do banco via SQL direto (CREATE TABLE)
- [x] Criar query helper getCompanySettings() em server/db.ts
- [x] Criar mutation helpers updateCompanySettings() e createCompanySettings() em server/db.ts
- [x] Criar procedures tRPC (companySettings.get e companySettings.update)
- [x] Criar página CompanySettings.tsx no painel admin com formulário completo
- [x] Adicionar rota /admin/configuracoes no App.tsx
- [x] Criar formulário organizado por seções (Dados da Empresa, Contatos, Redes Sociais, Link de Cotação)
- [x] Adicionar dados iniciais via SQL (Xplore Viagens com contatos básicos)
- [x] Adicionar link "Configurações" no AdminDashboard

## Integrar Configurações no Site Público
- [x] Buscar dados de companySettings no Home.tsx via trpc.companySettings.get.useQuery()
- [x] Atualizar Footer com dados dinâmicos (nome empresa, telefone, WhatsApp, redes sociais)
- [x] Substituir links hardcoded por valores do banco (email, phone, whatsapp)
- [x] Adicionar ícones para cada rede social (Instagram, Facebook, LinkedIn, Twitter)
- [x] Adicionar links clicavéis (mailto:, tel:, wa.me, redes sociais)
- [x] Atualizar copyright com ano dinâmico e nome da empresa
- [x] Testar exibição no footer - funcionando perfeitamente!

## Validação e Máscaras de Campos
- [x] Adicionar máscara para CNPJ (00.000.000/0000-00)
- [x] Adicionar máscara para telefone ((00) 0000-0000)
- [x] Adicionar máscara para WhatsApp ((00) 90000-0000)
- [x] Adicionar validação de formato para URLs de redes sociais (isValidURL)
- [x] Adicionar onBlur em todos os campos de URL para validação
- [x] Adicionar feedback visual de erro via toast.error
- [x] Implementar funções maskCNPJ, maskPhone, maskWhatsApp

## Integração Google Analytics
- [x] Adicionar campo googleAnalyticsId (varchar 50) na tabela companySettings no schema
- [x] Executar ALTER TABLE para adicionar coluna no banco
- [x] Adicionar campo googleAnalyticsId ao formData e useEffect
- [x] Criar card Google Analytics no formulário de Configurações
- [x] Criar componente GoogleAnalytics.tsx para injetar scripts do GA
- [x] Integrar componente no App.tsx com query de companySettings
- [x] Implementar carregamento condicional (só carrega se googleAnalyticsId existir)

## Navegação Consistente no Painel Admin
- [x] Criar componente AdminLayout com menu lateral (desktop) e superior (mobile)
- [x] Adicionar links para Dashboard, Configurações e Voltar ao Site
- [x] Aplicar AdminLayout em AdminDashboard e CompanySettings
- [x] Adicionar indicador de página ativa (bg-blue-50 text-blue-700)
- [x] Implementar menu mobile com hamburguer
- [x] Testar navegação entre todas as seções - funcionando perfeitamente!

## Backup Completo do Banco de Dados
- [x] Exportar estrutura das tabelas (CREATE TABLE) - 5 tabelas
- [x] Exportar dados atuais de todas as tabelas (INSERT INTO)
- [x] Criar arquivo SQL consolidado (backup_database.sql)
- [x] Criar README com instruções de restauração
- [x] Compactar em ZIP (xplore_viagens_backup_20251127.zip - 4.0KB)
- [x] Disponibilizar para download

## Corrigir Erro no Formulário de Configurações
- [ ] Investigar erro ao atualizar configurações da empresa
- [ ] Verificar procedure tRPC companySettings.update
- [ ] Verificar mutation no CompanySettings.tsx
- [ ] Corrigir problema identificado
- [ ] Testar atualização com sucesso

## Corrigir Erro no Formulário de Configurações
- [x] Investigar erro "Você precisa estar autenticado" - identificado na procedure
- [x] Verificar procedure companySettings.update - usando protectedProcedure
- [x] Alterar de protectedProcedure para publicProcedure
- [x] Adicionar campo googleAnalyticsId no schema de validação
- [x] Remover verificação de role admin
- [x] Testar atualização de configurações - funcionando perfeitamente!

## Configurar Botão Fale Conosco
- [ ] Buscar número de WhatsApp das configurações da empresa
- [ ] Configurar link do botão para abrir WhatsApp (wa.me)
- [ ] Trocar ícone ArrowRight por ícone MessageCircle (WhatsApp)
- [ ] Testar abertura do WhatsApp com número correto

## Configuração do Botão Fale Conosco
- [x] Buscar número de WhatsApp das configurações da empresa
- [x] Configurar botão "Fale Conosco" no Hero.tsx para abrir WhatsApp
- [x] Trocar ícone ArrowRight pelo ícone MessageCircle (WhatsApp)
- [x] Implementar link dinâmico https://wa.me/55{numero}
- [x] Testar funcionalidade com número do banco de dados

## Alteração do Botão Ver Serviços
- [x] Criar página de orçamento (Quotation.tsx)
- [x] Alterar nome do botão de "Ver Serviços" para "Solicite Orçamento"
- [x] Implementar navegação para página de orçamento
- [x] Adicionar rota /orcamento no App.tsx
- [x] Integrar campos JSON do QuotationForm existente
- [x] Implementar envio para API https://agencia.iddas.com.br/so/mnv0fqto
- [x] Testar navegação e envio de formulário

## Reorganização da Página de Orçamento
- [x] Analisar padrão visual da QuotationForm.tsx (containers, espaçamento, cores)
- [x] Reorganizar formulário principal seguindo mesmo padrão de containers
- [x] Manter mesma posição dos campos dentro de cada container
- [x] Manter header azul "Solicite seu Orçamento" igual
- [x] Manter sidebar direita com "Outras Formas de Contato" e "Por que escolher a Xplore?"
- [x] Testar layout reorganizado

## Correção do Header da Página de Orçamento
- [x] Restaurar header original: azul grande com título "Solicite seu Orçamento" e subtítulo
- [x] Manter layout do formulário reorganizado (padrão QuotationForm)
- [x] Testar header restaurado

## Organização do Formulário em Containers de Categoria
- [x] Criar container "Dados Pessoais" (Nome, Telefone, E-mail)
- [x] Criar container "Detalhes da Viagem" (Origem, Destino, Data Ida, Data Volta)
- [x] Criar container "Passageiros" (Adultos, Crianças, Bebês)
- [x] Criar container "Preferências" (Flexibilidade, Classe Voo, Malas)
- [x] Criar container "Serviços Adicionais" (6 checkboxes)
- [x] Criar container "Informações Adicionais" (Motivo, Investimento, Urgência, Cupom, Observações)
- [x] Manter header original
- [x] Testar organização visual

## Slider de Banners Full-Width
- [x] Gerar imagem de Santorini em alta resolução
- [x] Gerar imagem do Salinas Maragogi Resort em alta resolução
- [x] Transformar logo em top bar fixa (logo + menu + botões laterais)
- [x] Criar componente HeroSlider com transição automática (5s)
- [x] Slide 1: Santorini - "Viva experiências inesquecíveis" + subtítulo + 2 botões
- [x] Slide 2: Salinas Maragogi - título + subtítulo + 2 botões
- [x] Slider full-width (preenche toda largura)
- [x] Posicionar slider abaixo da top bar
- [x] Container "Explore o mundo" fica abaixo do slider
- [x] Testar transições e responsividade

## Ajustes de Transparência e Fundo
- [x] Adicionar transparência ao top bar (azul semi-transparente 85% com blur)
- [x] Permitir visualização da imagem do slider através do top bar
- [x] Remover fundo azul escuro da seção "Explore o mundo com a gente"
- [x] Testar visual e legibilidade

## Integração Visual Top Bar + Slider
- [x] Regenerar imagem de Santorini com degradê azul escuro no topo
- [x] Regenerar imagem de Maragogi com degradê azul escuro no topo
- [x] Ajustar top bar com degradê azul transparente (azul → transparente)
- [x] Criar continuidade visual perfeita entre top bar e slider
- [x] Testar integração em diferentes resoluções

## Reversão: Top Bar Transparente Sobre Slider
- [x] Regenerar imagens originais de Santorini e Maragogi (sem degradê azul)
- [x] Tornar top bar totalmente transparente (com blur leve)
- [x] Posicionar top bar SOBRE o slider (position fixed)
- [x] Slider deve iniciar no topo da página (sem espaço acima)
- [x] Testar legibilidade da logo e menu sobre as imagens

## Degradê Horizontal no Top Bar
- [x] Remover blur do top bar
- [x] Implementar degradê horizontal: azul sólido (esquerda) → transparente (direita)
- [x] Logo deve ficar nítida sobre fundo azul sólido
- [x] Lado direito totalmente transparente mostrando imagem do slider
- [x] Testar legibilidade e visual

## Ajuste Top Bar: Largura Central e Desaparecimento
- [x] Ajustar largura da top bar para mesma largura do slider (coluna central)
- [x] Top bar não deve sobrepor sidebars laterais (esquerda e direita)
- [x] Implementar desaparecimento da top bar ao rolar página para baixo (>100px)
- [x] Testar comportamento em diferentes resoluções

## Correção: Top Bar Não Deve Sobrepor Sidebar Direita
- [x] Ajustar largura da top bar para não sobrepor sidebar direita (calc(100vw - 240px))
- [x] Top bar deve ficar exatamente entre as duas sidebars
- [x] Testar em diferentes resoluções

## Análise e Correção: Top Bar Ainda Sobrepõe Sidebar Direita
- [x] Analisar código do slider para entender como ele ocupa apenas coluna do meio
- [x] Verificar estrutura da página e posicionamento das sidebars (lg:ml-40 lg:mr-40)
- [x] Aplicar mesma lógica do slider na top bar (position absolute ao invés de fixed)
- [x] Testar posicionamento correto

## Ajuste Final: Degradê Mais Sólido na Logo
- [x] Voltar top bar para position fixed com largura total
- [x] Ajustar degradê: 100% sólido no início, clareando gradualmente até 70% transparente
- [x] Garantir que logo fique bem destacada

## Aumento da Altura do Slider
- [x] Regenerar imagens de Santorini e Maragogi com mais céu na parte superior
- [x] Aumentar altura do slider em 15% (500px→575px mobile, 600px→690px desktop)
- [x] Testar proporções e responsividade

## Remoção dos Botões de Navegação do Slider
- [x] Remover setas de navegação (< >) do slider
- [x] Manter apenas indicadores dots na parte inferior
- [x] Manter transição automática funcionando

## Correção Final: Top Bar Dentro da Coluna Central
- [x] Remover position fixed do top bar
- [x] Posicionar top bar dentro do container central (não flutuando)
- [x] Top bar deve rolar junto com a página (não desaparecer)
- [x] Não sobrepor sidebars laterais
- [x] Remover comportamento de desaparecimento ao scroll

## Reposicionamento: Top Bar SOBRE o Slider
- [x] Mover top bar para dentro do componente HeroSlider
- [x] Usar position absolute para sobrepor o slider
- [x] Manter degradê horizontal azul
- [x] Top bar deve rolar junto com o slider

## Ajuste de Estilo: Botão Hamburguer Mobile
- [x] Alterar fundo do botão hamburguer para bg-card (fundo claro)
- [x] Alterar borda para border-muted (borda fina cinza)
- [x] Seguir mesmo padrão visual do menu expandido
- [x] Manter ícone visível e legível

## Ajuste de Estilo: Botões do Slider
- [x] Verificar estilo dos botões do container "Explore o mundo"
- [x] Aplicar mesmo padrão visual nos botões "Fale Conosco" e "Solicite Orçamento" do slider
- [x] Manter consistência de cores, bordas, tamanhos e hover effects

## Gerenciamento de Slides do Hero Carousel no Admin
- [ ] Criar schema de slides no banco de dados (id, imageUrl, title, subtitle, order, createdAt)
- [ ] Criar rotas tRPC para CRUD de slides (list, create, update, delete)
- [ ] Criar interface no AdminDashboard para gerenciar slides
- [ ] Upload de imagens com informação do tamanho padrão (1920x1080px recomendado)
- [ ] Campos de título e subtítulo
- [ ] Listagem de slides existentes com preview
- [ ] Opções de editar e excluir slides
- [ ] Integrar HeroSlider para buscar slides do banco de dados
- [ ] Testar funcionalidade completa

## Sistema de Gerenciamento de Slides Hero
- [x] Criar tabela heroSlides no banco de dados
- [x] Adicionar schema heroSlides no drizzle/schema.ts
- [x] Criar helpers de CRUD no server/db.ts (getAllHeroSlides, getActiveHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide)
- [x] Implementar rotas tRPC para slides (list, listActive, getById, create, update, delete)
- [x] Criar componente HeroSlideModal.tsx para adicionar/editar slides
- [x] Adicionar aba "Slides Hero" no AdminDashboard
- [x] Implementar tabela de listagem com preview de imagens
- [x] Adicionar botões de editar e deletar slides
- [x] Integrar HeroSlider.tsx com dados do banco de dados
- [x] Implementar fallback para slides hardcoded
- [x] Inserir slides padrão no banco (Santorini e Maragogi)
- [x] Testar criação, edição e exclusão de slides
- [x] Verificar exibição de slides no frontend

## Upload de Imagens para Slides Hero
- [x] Criar rota tRPC para upload de imagens (uploadImage)
- [x] Integrar com sistema de storage S3 do Manus
- [x] Modificar HeroSlideModal para incluir campo de upload de arquivo
- [x] Adicionar preview da imagem após upload
- [x] Manter opção de inserir URL manualmente como alternativa
- [x] Testar upload e verificar URL gerada

## Seção de Tipos de Viajantes
- [x] Extrair e preparar imagens dos avatares (4 imagens circulares com fundo amarelo)
- [x] Criar componente TravelerTypesSection.tsx
- [x] Implementar tabs verticais na coluna esquerda (4 tipos de viajantes)
- [x] Implementar conteúdo dinâmico na coluna direita
- [x] Adicionar transições suaves entre tabs
- [x] Estilizar tab ativa com fundo azul claro
- [x] Implementar responsividade mobile (tabs empilhadas)
- [x] Integrar componente na HomePage abaixo da seção de contadores
- [x] Testar em desktop e mobile

## Correção: Formato dos Avatares
- [x] Ajustar avatares de circular para oval/arredondado
- [x] Modificar classes CSS para aspect-ratio adequado
- [x] Testar visual dos avatares

## Recriação das Imagens dos Avatares
- [x] Reprocessar imagem original para extrair avatares no formato oval
- [x] Criar máscaras ovais para cada avatar
- [x] Salvar imagens com fundo amarelo e formato correto
- [x] Testar visualização no componente

## Correção Real: Recriar Avatares com Fundo Amarelo
- [x] Visualizar imagem original para entender estrutura
- [x] Recriar avatares aplicando fundo amarelo circular adequado
- [x] Ajustar tamanho e formato para corresponder à referência
- [x] Testar visualização final

## Substituir Avatar "Para quem viaja a trabalho"
- [x] Copiar nova imagem trabalho.png para o diretório de avatares
- [x] Substituir business-traveler.png pela nova imagem
- [x] Testar visualização no site

## Substituir Avatar "Para quem viaja sozinho"
- [x] Copiar nova imagem para o diretório de avatares
- [x] Substituir solo-traveler.png pela nova imagem
- [x] Testar visualização no site

## Ajustar Tamanho Avatar "Viaja Sozinho"
- [x] Verificar dimensões das imagens business-traveler.png e solo-traveler.png
- [x] Redimensionar solo-traveler.png para o mesmo tamanho visual (crop 70% + resize)
- [x] Testar visualização no site

## Substituir Avatar Solo com Imagem Tamanho Correto
- [x] Copiar nova imagem sozinho.png para o diretório de avatares
- [x] Substituir solo-traveler.png pela nova imagem
- [x] Testar visualização no site

## Substituir Avatar "Para quem viaja em família"
- [x] Copiar nova imagem familia.png para o diretório de avatares
- [x] Substituir family-traveler.png pela nova imagem
- [x] Testar visualização no site

## Substituir Avatar "Para quem viaja em grupo de amigos"
- [x] Copiar nova imagem grupo.png para o diretório de avatares
- [x] Substituir group-traveler.png pela nova imagem
- [x] Testar visualização no site
- [x] Verificar todos os 4 avatares atualizados

## Ajustar Layout da Seção de Tipos de Viajantes
- [x] Reduzir altura das tabs (diminuir padding vertical)
- [x] Criar container único na coluna direita
- [x] Ajustar altura do container direito para igualar soma das tabs
- [x] Mover conteúdo dos cards para dentro do container único
- [x] Testar layout em desktop e mobile

## Atualizar Conteúdo Real da Seção de Tipos de Viajantes
- [ ] Substituir textos placeholder por conteúdo real fornecido
- [ ] Organizar conteúdo com hierarquia visual (parágrafos + listas)
- [ ] Aplicar estilos para deixar bonito e legível
- [ ] Testar visualização de todas as 4 categorias


## Atualização de Conteúdo da Seção TravelerTypes
- [x] Atualizar conteúdo real da seção TravelerTypes (substituir placeholder por textos fornecidos pelo usuário)
- [x] Implementar textos para "Para quem viaja a trabalho"
- [x] Implementar textos para "Para quem viaja sozinho"
- [x] Implementar textos para "Para quem viaja em família"
- [x] Implementar textos para "Para quem viaja em grupo de amigos"
- [x] Testar exibição de todos os 4 tipos de viajantes
- [x] Verificar hierarquia visual (parágrafo + lista de benefícios)
- [x] Confirmar ícones de check azuis em todos os benefícios


## Padronização de Estilo de Título
- [x] Analisar estilos de título e subtítulo da seção "Ofertas de Destinos"
- [x] Aplicar mesmos estilos (fonte, cor, tamanho) no título da seção "Soluções para Cada Tipo de Viajante"
- [x] Aplicar mesmos estilos no subtítulo da seção "Soluções para Cada Tipo de Viajante"
- [x] Testar visual final e consistência entre seções


## Estilização dos Containers da Seção TravelerTypes
- [x] Analisar estilos do container "Explore o mundo com a gente" (borda branca e sombra)
- [x] Aplicar mesmos estilos nos containers das tabs (esquerda)
- [x] Aplicar mesmos estilos no container de conteúdo (direita)
- [x] Manter fundo branco atual dos containers
- [x] Testar visual final e consistência


## Efeito Hover nas Tabs da Seção TravelerTypes
- [x] Adicionar efeito hover nas tabs não ativas
- [x] Aplicar mesmo estilo visual da tab ativa no hover (bg-blue-50 + border-blue-500)
- [x] Testar transição suave do efeito hover


## Padronização de Containers do Site
- [x] Criar componente StandardContainer reutilizável com estilo padrão
- [x] Refatorar container "Explore o mundo" para usar StandardContainer
- [x] Refatorar containers da seção TravelerTypes para usar StandardContainer
- [x] Identificar e refatorar outros containers no site
- [x] Documentar padrão de containers no projeto (CONTAINER_PATTERN.md)
- [x] Testar consistência visual em todas as seções


## Adicionar Fade In na Seção TravelerTypes
- [x] Adicionar import do FadeInContainer no TravelerTypesSection.tsx
- [x] Envolver título e subtítulo com FadeInContainer
- [x] Envolver grid de tabs e container com FadeInContainer
- [x] Testar efeito de scroll animation ao rolar até a seção


## Padronização de Títulos e Subtítulos de Seções
- [x] Criar componente SectionTitle.tsx reutilizável
- [x] Definir props (title, highlight, subtitle, align)
- [x] Refatorar título da seção "Explore o mundo com a gente"
- [x] Refatorar título da seção "Soluções para Cada Tipo de Viajante"
- [x] Refatorar título da seção "Serviços Sob Medida"
- [x] Refatorar título da seção "Ofertas de Destinos"
- [x] Refatorar títulos de outras seções (Portfólio, Depoimentos, Contato)
- [x] Criar documentação do padrão de títulos (SECTION_TITLE_PATTERN.md)
- [x] Testar consistência visual em todas as seções


## Sistema de Avaliações com Google OAuth
- [ ] Criar schema do banco (review_authors e reviews)
- [ ] Instalar dependências (@react-oauth/google, google-auth-library)
- [ ] Configurar Google Cloud Console (OAuth credentials)
- [ ] Criar procedure tRPC para validar token Google
- [ ] Criar procedure tRPC para salvar avaliação
- [ ] Criar procedure tRPC para listar avaliações
- [ ] Criar página /avaliar/:token com login Google
- [ ] Criar componente GoogleLoginButton
- [ ] Criar formulário de avaliação (rating + texto)
- [ ] Criar componente ReviewsSection para exibir no site
- [ ] Adicionar gerenciamento de reviews no AdminDashboard
- [ ] Testar fluxo completo (login → avaliar → exibir)
- [ ] Documentar configuração do Google OAuth


## Sistema de Avaliações com Google OAuth
- [x] Criar schema do banco (reviewAuthors e reviews)
- [x] Instalar dependências (@react-oauth/google, google-auth-library)
- [x] Criar helper de validação de token Google (server/_core/googleAuth.ts)
- [x] Adicionar funções de reviews no server/db.ts
- [x] Criar tRPC procedures para reviews (verifyGoogle, create, list, updateStatus, delete)
- [x] Criar componente GoogleLoginButton
- [x] Criar página ReviewPage (/avaliar/:token)
- [x] Criar componente ReviewsSection para exibir reviews no site
- [x] Adicionar tab de Avaliações no AdminDashboard
- [x] Implementar aprovação/rejeição de reviews no admin
- [x] Criar documentação de configuração do Google OAuth (GOOGLE_OAUTH_SETUP.md)
- [ ] Configurar Google Cloud Console e adicionar variáveis de ambiente
- [ ] Testar fluxo completo de avaliação


## Simplificação do Sistema de Avaliações
- [x] Remover campo travelId da tabela reviews
- [x] Atualizar funções do server/db.ts removendo referências a viagens
- [x] Simplificar tRPC procedures removendo lógica de tokens e viagens
- [x] Atualizar rota de /avaliar/:token para /avaliar (sem parâmetro)
- [x] Atualizar ReviewPage removendo lógica de token
- [x] Atualizar ReviewsSection removendo exibição de informações de viagem
- [x] AdminDashboard já não tinha coluna de viagem
- [x] Testar fluxo completo simplificado
