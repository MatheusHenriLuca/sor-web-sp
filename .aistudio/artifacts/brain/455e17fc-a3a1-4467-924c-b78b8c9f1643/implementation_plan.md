# Auditoria Geral de Interface, Usabilidade, Responsividade e Performance

Plano de modernização, padronização visual e otimização de performance para o sistema **Gestamp Sorocaba — 8D Quality Manager**, preservando integralmente todas as regras de negócio, integrações do SharePoint Online, campos dos 25 cards originais do Power Apps e fluxos operacionais existentes.

## Decisões Críticas e Preferências Confirmadas

> [!IMPORTANT]
> As diretrizes abaixo foram confirmadas na fase de alinhamento com o usuário e regem toda a execução técnica deste plano:

- **Escopo Priorizado**: Todas as telas do aplicativo com prioridade máxima nos fluxos operacionais centrais (`Menu2View`, `Lista8DView`, `Detalhes8DView`, `Registro8DView`).
- **Linguagem Visual e Densidade**: **Industrial clean com alta densidade e excelente contraste**, com tokens de design automotivo Gestamp (`#0b5796`), tipografia nítida (`Plus Jakarta Sans` / `Outfit` / `JetBrains Mono`), números tabulares (`tabular-nums`) e superfícies organizadas sem poluição visual.
- **Estratégia de Execução**: **Padronização gradual em 4 etapas**, validando e compilando a cada fase para garantir 100% de integridade dos dados, sem quebras nem regressões.

---

## 1. Visão Geral e Conceito Central

- **Objetivo**: Elevar o sistema ao padrão de software industrial automotivo de classe mundial (World Class Manufacturing), eliminando desalinhamentos, inconsistências de fontes e botões, poluição de bordas/sombras, e gargalos de renderização, ao mesmo tempo em que aprimora o contraste e a usabilidade em postos de fábrica e escritórios de qualidade.
- **Público-Alvo**: Inspetores de Qualidade de Linha, Engenheiros de Qualidade Assegurada, Supervisores de Estamparia/Montagem e Auditores de Clientes (Toyota, Honda, Renault, Hyundai, Stellantis, VW).
- **Compromisso de Não-Regressão**: Nenhuma regra de negócio, validação de campo, vínculo de chave primária/secundária ou integração com o Microsoft Graph/SharePoint será removida ou alterada.

---

## 2. Diagnóstico e Diretrizes nos 13 Eixos de Auditoria

### 1. Tipografia
- **Diagnóstico**: Mistura pontual de pesos de fontes, tamanhos de textos variando arbitrariamente entre componentes criados em fases distintas.
- **Padronização**:
  - Títulos de Nível 1 (Telas): `font-display text-xl font-bold text-slate-900 tracking-tight`.
  - Títulos de Seção / Cards: `font-display text-sm font-semibold text-slate-800`.
  - Corpo / Labels: `font-sans text-xs font-medium text-slate-600` e valores `text-sm font-semibold text-slate-900`.
  - Dados Numéricos / Códigos SAP / RNC IDs: `font-mono tabular-nums text-slate-800`.
  - Garantia de conformidade com contraste WCAG 2.2 AA (mínimo de 4.5:1 para texto normal e 3:1 para textos grandes).

### 2. Botões e Ações
- **Diagnóstico**: Botões com alturas díspares (32px, 36px, 42px), paddings irregulares e ausência de padrão uniforme para botões de ação destrutiva vs neutra.
- **Padronização**:
  - **Ação Primária**: `.btn-primary` (Azul Gestamp `#0b5796`, altura 38px desktop / 44px mobile, peso semi-bold, cantos `rounded-lg`).
  - **Ação Secundária**: `.btn-secondary` (Fundo branco, borda `slate-200`, texto `slate-700`, hover `bg-slate-50`).
  - **Ação Terciária / Ghost**: `.btn-subtle` (Sem borda de repouso, fundo transparente).
  - **Ação Destrutiva**: `.btn-danger` (Vermelho semântico `#e11d48`, reservado para cancelamentos/rejeições).
  - **Estados Desabilitados**: Opacidade 50%, `cursor-not-allowed`, sem hover styling.
  - Alinhamento uniforme via `inline-flex items-center justify-center gap-2`.

### 3. Espaçamentos e Alinhamentos
- **Diagnóstico**: Telas com margens verticais e horizontais inconsistentes (algumas com `p-4`, outras com `p-8` ou sem padding responsivo).
- **Padronização**:
  - Escala modular de espaçamentos: 4px, 8px, 12px, 16px, 20px, 24px, 32px.
  - Grid de conteúdo padronizado em todas as telas principais com `max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6`.
  - Gaps de formulários unificados em `gap-4 sm:gap-6`.

### 4. Bordas, Cards e Fundos
- **Diagnóstico**: Concorrência entre múltiplos níveis de sombra e contornos duplicados (card dentro de card com bordas escuras).
- **Padronização**:
  - Eliminação de sombras excessivas; adoção de elevação sutil única: `box-shadow: 0 1px 3px rgba(15,23,42,0.03)`.
  - Bordas padrão uniformes: `border border-slate-200` com hover sutil `border-slate-300`.
  - Fundo do app consolidado em `--bg-app: #f8fafc` e superfícies de cards em `#ffffff`.
  - Raio de arredondamento consistente: `rounded-xl` para containers principais e `rounded-lg` para sub-cards e controles.

### 5. Ícones e Elementos Visuais
- **Diagnóstico**: Variação de tamanhos nos ícones da biblioteca Lucide (14px, 15px, 18px, 24px) e falta de alinhamento vertical com rótulos.
- **Padronização**:
  - Escala de ícones: Ações/Botões (16px `w-4 h-4`), Headers de Cards (18px `w-[18px] h-[18px]`), Destaques Principais (20px `w-5 h-5`).
  - `shrink-0` em todos os ícones para impedir deformações durante redução de viewport.
  - Remoção de ícones puramente decorativos sem valor funcional.

### 6. Campos e Formulários
- **Diagnóstico**: Alturas distintas entre inputs de texto, selects e date-pickers; mensagens de obrigatoriedade não padronizadas.
- **Padronização**:
  - Classe unificada `.form-input` em todos os inputs com altura de 38px (desktop) e 44px (touch).
  - Rótulos consistentes com indicador visual `text-rose-500 font-bold ml-0.5 *` para campos obrigatórios.
  - Alinhamento de foco acessível com anel `focus:ring-2 focus:ring-blue-500/20 focus:border-[#0b5796]`.
  - Componente `SearchableSelect` harmonizado esteticamente com os inputs nativos.

### 7. Tabelas, Listas e Galerias
- **Diagnóstico**: A Galeria do `Lista8DView` agora é a visualização padrão. Necessita de densidade visual refinada para facilitar a leitura rápida de 20 a 50 cards por página.
- **Padronização**:
  - Grid responsivo de 1 coluna (mobile), 2 colunas (tablet/laptop) e 3 colunas (desktop ultrawide).
  - Metadados sem enquadramentos redundantes (zero-pill discipline para informações estáticas; pílulas apenas para status interativos/semânticos).
  - Rolagem vertical fluida sem cortes de conteúdo ou quebras forçadas de texto.

### 8. Padronização entre Telas
- **Diagnóstico**: Diferenças de estrutura entre o cabeçalho de `Menu2View`, `Lista8DView` e `Detalhes8DView`.
- **Padronização**:
  - Cabeçalho padronizado em todas as telas: Breadcrumb de localização à esquerda + Título e Subtítulo + Grupo de Ações Primárias/Secundárias à direita.
  - Barra de navegação `AppHeader` e `AppSidebar` com estados ativos e badges alinhados com o mesmo padrão visual.

### 9. Responsividade
- **Diagnóstico**: Alguns grids quebram ou comprimem colunas em telas de tablets industriais (1024x768).
- **Padronização**:
  - Ajuste minucioso de breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
  - Wrappers horizontais flexíveis com `flex-wrap` defensivo e `min-w-0` para prevenir transbordamento de texto (`overflow-x-hidden`).
  - Alvos de clique móveis com altura mínima de 44px para operação com luvas fabris ou touch.

### 10. Usabilidade e Ergonomia Fabril
- **Diagnóstico**: Dificuldade de identificar em que etapa do 8D um chamado se encontra ao abrir a listagem rápida.
- **Padronização**:
  - Indicador visual progressivo unificado para os passos 8D (D0 a D8) com cores de progresso semânticas.
  - Acesso imediato às ações mais frequentes: "Ver Ocorrência", "Imprimir Relatório", "Atualizar Ação".

### 11. Performance e Otimizações de Renderização
- **Diagnóstico**: Recálculos de filtragem ocorrendo em cada render do componente `Lista8DView` e `Menu2View`.
- **Padronização**:
  - Aplicação estrita de `useMemo` para listas filtradas e agrupamentos de montadoras.
  - Redução de chamadas repetidas a seletores de array no corpo de renderização.
  - Carregamento de imagens com `loading="lazy"` e fallbacks leves via `ImageWithFallback`.

### 12. Estados e Feedbacks
- **Diagnóstico**: Estados de "Nenhum resultado encontrado" eram genéricos ou desprovidos de ação clara para limpar filtros.
- **Padronização**:
  - Empty states informativos com ícone sutil, descrição clara do filtro aplicado e botão imediato "Limpar Filtros".
  - Toasts e alertas consistentes para operações de salvamento e sincronização com o SharePoint.

### 13. Acessibilidade (A11y)
- **Diagnóstico**: Falta de rótulos acessíveis (`aria-label`) em botões de apenas ícone e foco indistinto em navegadores baseados em Chromium.
- **Padronização**:
  - Inclusão de `aria-label` e `title` descritivos em todos os botões de ícone.
  - Foco visível `:focus-visible` com anel duplo em alto contraste para navegação por teclado fabril.

---

## 3. Plano de Implementação em 4 Fases

```
┌────────────────────────────────────────────────────────────────────────┐
│                      FASE 1: Design Tokens & Layout                    │
│   • Atualização de src/index.css (tokens, botões, inputs, foco)        │
│   • Padronização de AppHeader.tsx e AppSidebar.tsx                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  FASE 2: Fluxos Operacionais Centrais                  │
│   • Lista8DView.tsx: Galeria de alta densidade, filtros e memoização   │
│   • Detalhes8DView.tsx: Cabeçalho 8D, etapas D0-D8, contraste e grids  │
│   • Registro8DView.tsx: Formulário padronizado, campos e validações    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  FASE 3: Telas de Gestão e Auxiliares                  │
│   • Menu2View.tsx: Dashboard principal, KPIs e busca inteligente      │
│   • RegistroProtCliView.tsx: Formulário de contenção de cliente        │
│   • CadastroUsuariosView.tsx & FalhaEntregaView.tsx: Grids e botões    │
│   • DetalhesImpressaoView.tsx & RastreabilidadeView.tsx                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                 FASE 4: Verificação, Lint & Compilação                 │
│   • Teste de responsividade (320px, 768px, 1024px, 1440px)             │
│   • Auditoria de contraste WCAG 2.2 AA                                 │
│   • Verificação com compile_applet e lint_applet                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Detalhamento das Fases

#### Fase 1: Fundação de Design e Estrutura Global
- Consolidar em `src/index.css` as classes de alta densidade: botões primários/secundários/destrutivos, inputs, cards saas, e badges de status.
- Ajustar `src/components/AppHeader.tsx` e `src/components/AppSidebar.tsx` para garantir alinhamento perfeito, responsividade no mobile (menu gaveta) e contraste impecável.

#### Fase 2: Fluxos Centrais (Lista8D, Detalhes8D e Registro8D)
- **`Lista8DView.tsx`**:
  - Aperfeiçoar os cards da Galeria (modo de visualização único definido pelo usuário), com tipografia nítida, badges semânticos de montadora e status, contadores com `tabular-nums` e botões de ação ergonômicos.
  - Otimizar a filtragem com `useMemo` para garantir resposta instantânea mesmo com milhares de registros em cache.
- **`Detalhes8DView.tsx`**:
  - Reestruturar as seções D0 a D8 com cabeçalho de status industrial, navegação suave por abas, cards de contenção e análise de causa raiz com alto contraste.
- **`Registro8DView.tsx`**:
  - Padronizar todos os campos dos 25 cards de acordo com as especificações extraídas do Power Apps em `/docs/powerapps-reference/`, preservando regras condicionais e de validação com visual limpo e claro.

#### Fase 3: Telas de Gestão e Suporte
- **`Menu2View.tsx`**:
  - Harmonizar os cards de KPI (Total Ocorrências, Em Aberto, Concluídas, Proteção ao Cliente) com micro-bordas `slate-200`, números tabulares grandes e gráficos limpos.
- **`RegistroProtCliView.tsx`, `CadastroUsuariosView.tsx`, `FalhaEntregaView.tsx`, `RastreabilidadeView.tsx`**:
  - Aplicar os mesmos tokens de botões, inputs, tabelas e cabeçalhos em todas as telas secundárias para alcançar 100% de consistência em todo o software.

#### Fase 4: Validação e Testes
- Executar `compile_applet` para assegurar ausência de erros de compilação TypeScript.
- Executar `lint_applet` para certificar conformidade com boas práticas.
- Validar visualmente o dev server no navegador para confirmar que nenhum dado, botão ou fluxo foi quebrado.

---

## 4. Garantia de Conformidade e Regras de Negócio

| Regra / Componente | Estado Atual | Garantia Pós-Auditoria |
| :--- | :--- | :--- |
| **Integração SharePoint** | Serviço `spStore` via Graph API | Preservado 100% sem alterações nos endpoints |
| **25 Cards Power Apps** | Mapeamento em `/docs/powerapps-reference/` | Todos os campos e validações estritamente mantidos |
| **Galeria como Listagem** | Modo padrão atual | Mantida como visão principal com densidade aprimorada |
| **Regras de Validação 8D** | Bloqueios por status e campos obrigatórios | 100% preservadas e visualmente sinalizadas |
| **Permissões de Usuário** | RBAC baseado no perfil de qualidade | 100% preservado |
