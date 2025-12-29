# StockFolio - Aplicativo de Análise de Carteira de Ações B3

## Problem Statement
Criar um aplicativo de análise de carteira de ações da bolsa de valores brasileira, com gráficos de rendimento, rentabilidade, dividendos e análise de preço teto baseado em valuation.

## Architecture
- **Backend**: FastAPI + MongoDB
- **Frontend**: React + TailwindCSS + Recharts + Shadcn UI
- **Auth**: Emergent Google OAuth
- **AI**: OpenAI GPT via Emergent LLM Key

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

## What's Been Implemented (Dec 29, 2025)

### Backend Endpoints
- `/api/auth/session` - Exchange session for user data
- `/api/auth/me` - Get current user
- `/api/auth/logout` - Logout
- `/api/portfolio/stocks` - CRUD de ações
- `/api/portfolio/summary` - Resumo da carteira
- `/api/dividends` - CRUD de dividendos
- `/api/dividends/summary` - Resumo de dividendos
- `/api/valuation/calculate` - Cálculo de valuation
- `/api/analysis/stock` - Análise IA
- `/api/stocks/search/{ticker}` - Busca de ações

### Frontend Pages
- Landing (/) - Página inicial
- Dashboard (/dashboard) - Visão geral
- Portfolio (/portfolio) - Gestão de ações
- Dividends (/dividends) - Gestão de dividendos
- Valuation (/valuation) - Cálculo preço teto
- Analysis (/analysis) - Análise IA

### Features
- Tema escuro profissional
- Gráficos interativos (Recharts)
- 3 métodos de valuation (Gordon, Bazin, DCF)
- Análise IA com GPT
- Dados mock de ações brasileiras

## Prioritized Backlog

### P0 (Done)
- [x] MVP completo

### P1 (Next)
- [ ] Integração real com Alpha Vantage API
- [ ] Histórico de cotações
- [ ] Alertas de preço teto

### P2 (Future)
- [ ] Comparação entre ações
- [ ] Rebalanceamento automático
- [ ] Exportação de relatórios

## Next Tasks
1. Integrar Alpha Vantage para dados reais de cotação
2. Implementar gráfico de evolução patrimonial
3. Adicionar notificações de preço teto
