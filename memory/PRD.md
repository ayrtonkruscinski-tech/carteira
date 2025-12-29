# StockFolio - Aplicativo de Análise de Carteira de Ações B3

## Problem Statement
Criar um aplicativo de análise de carteira de ações da bolsa de valores brasileira, com gráficos de rendimento, rentabilidade, dividendos e análise de preço teto baseado em valuation.

## Architecture
- **Backend**: FastAPI + MongoDB
- **Frontend**: React + TailwindCSS + Recharts + Shadcn UI
- **Auth**: Emergent Google OAuth
- **AI**: OpenAI GPT via Emergent LLM Key
- **Data**: Alpha Vantage API (cotações) + dados mock fallback

## User Personas
1. **Investidor Individual**: Pessoa física que investe na B3 e quer acompanhar sua carteira
2. **Analista Amador**: Usuário que deseja calcular preço teto usando métodos profissionais

## Core Requirements (Static)
- [x] Autenticação via Google OAuth
- [x] Gestão de carteira (CRUD de ações)
- [x] Registro de dividendos
- [x] Cálculo de preço teto (Gordon, Bazin, DCF)
- [x] Análise com IA
- [x] Dashboard com gráficos
- [x] Importação CSV (CEI/B3 + genérico)
- [x] Exportação CSV
- [x] Data de compra nas ações
- [x] Alertas de preço teto (in-app)
- [x] Gráfico de evolução patrimonial
- [x] Integração Alpha Vantage API

## What's Been Implemented

### Phase 1 (Dec 29, 2025) - MVP
- Auth Google, Dashboard, Portfolio, Dividends, Valuation, Analysis IA
- Gráficos com Recharts
- Tema escuro

### Phase 2 (Dec 29, 2025) - Novas Features
- Alpha Vantage API integration (cotações em tempo real)
- Import CSV (formatos CEI/B3 e genérico)
- Export CSV
- Data de compra nas ações
- Preço teto nas ações
- Sistema de alertas in-app
- Gráfico de evolução patrimonial
- Portfolio snapshots (histórico diário)

### Backend Endpoints
- `/api/auth/*` - Autenticação
- `/api/portfolio/stocks` - CRUD de ações (com purchase_date, ceiling_price)
- `/api/portfolio/summary` - Resumo da carteira
- `/api/portfolio/import/csv` - Importar CSV
- `/api/portfolio/export/csv` - Exportar CSV
- `/api/portfolio/refresh-prices` - Atualizar preços via Alpha Vantage
- `/api/portfolio/snapshot` - Criar snapshot
- `/api/portfolio/history` - Histórico de evolução
- `/api/dividends/*` - CRUD de dividendos
- `/api/valuation/calculate` - Cálculo de valuation
- `/api/analysis/stock` - Análise IA
- `/api/stocks/search/{ticker}` - Busca de ações (Alpha Vantage + cache)
- `/api/stocks/quote/{ticker}` - Cotação em tempo real
- `/api/alerts/*` - Sistema de alertas

### Frontend Pages
- Landing (/) - Página inicial
- Dashboard (/dashboard) - Visão geral + alertas + evolução patrimonial
- Portfolio (/portfolio) - Gestão de ações + import/export
- Dividends (/dividends) - Gestão de dividendos
- Valuation (/valuation) - Cálculo preço teto
- Analysis (/analysis) - Análise IA

## Technical Notes
- Alpha Vantage: Usando chave "demo" (limite de requisições). Para produção, obter chave em https://www.alphavantage.co/
- Alertas: Gerados automaticamente quando preço atual >= preço teto durante refresh
- Snapshots: Criados automaticamente durante refresh de preços
- Import CSV: Suporta formato CEI/B3 e CSV genérico com headers flexíveis

## Prioritized Backlog

### P0 (Done)
- [x] MVP completo
- [x] Import/Export CSV
- [x] Alertas in-app
- [x] Evolução patrimonial
- [x] Alpha Vantage integration

### P1 (Next)
- [ ] Chave Alpha Vantage real (para cotações em tempo real)
- [ ] Alertas por email (requer Resend API key)
- [ ] Múltiplas carteiras por usuário

### P2 (Future)
- [ ] Comparação entre ações
- [ ] Rebalanceamento automático
- [ ] Notificações push
- [ ] App mobile

## Next Tasks
1. Configurar chave Alpha Vantage real para cotações em tempo real
2. Adicionar integração Resend para alertas por email
3. Implementar múltiplas carteiras por usuário
