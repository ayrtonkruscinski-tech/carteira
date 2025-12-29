# 📱 Carteira de Investimentos Inteligente - Requisitos para App Mobile

## 🎯 Visão Geral

**Nome do Aplicativo:** Carteira de Investimentos Inteligente  
**Descrição:** Aplicativo para gerenciamento de carteira de ações da B3 (Bolsa de Valores do Brasil), com acompanhamento de rentabilidade, dividendos e cálculo de preço teto.

---

## 🔐 Autenticação

### Sistema de Login
- **Google OAuth** para autenticação segura
- Sessão persistente por 7 dias
- Logout manual disponível

---

## 📊 Funcionalidades Principais

### 1. Dashboard (Tela Principal)
**Objetivo:** Visão geral consolidada da carteira de investimentos

#### Cards de Resumo:
| Card | Descrição |
|------|-----------|
| Patrimônio Total | Valor atual de todas as ações |
| Rentabilidade | Percentual de ganho/perda |
| Lucro/Prejuízo | Valor em R$ de ganho/perda |
| Dividendos Recebidos | Total de proventos já recebidos |

#### Gráficos:
- **Evolução Patrimonial:** Gráfico de área com filtros de período (Semanal, Mensal, 12 Meses, 5 Anos, Máximo)
- **Distribuição da Carteira:** Gráfico de pizza com percentual por ação
- **Dividendos por Mês:** Gráfico de área com histórico mensal

#### Tabela de Ações:
| Coluna | Descrição |
|--------|-----------|
| Ticker | Código da ação (ex: PETR4) |
| Quantidade | Total de ações |
| Preço Médio | Preço médio de compra |
| Preço Atual | Cotação atual |
| Valor | Valor total investido |
| Variação | % de variação |
| Dividendos | Total de dividendos recebidos |
| Rentabilidade | % rentabilidade total |
| % Carteira | Percentual na carteira |

#### Ordenação:
- Ticker (A-Z)
- Valor (Maior/Menor)
- Variação (Maior/Menor)
- Rentabilidade (Maior/Menor)
- % Carteira (Maior/Menor)

#### Ações:
- Botão "Atualizar Preços" - Sincroniza cotações em tempo real
- Sistema de alertas de preço teto

---

### 2. Minha Carteira (Gerenciamento de Ações)
**Objetivo:** CRUD completo de ações

#### Adicionar Ação:
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Ticker | Texto (busca automática) | ✅ |
| Nome | Texto | ✅ |
| Quantidade | Número decimal | ✅ |
| Preço Médio | Moeda (R$) | ✅ |
| Data de Compra | Data | ❌ |
| Preço Atual | Moeda (R$) | ❌ |
| Dividend Yield | Percentual | ❌ |
| Setor | Seleção | ❌ |
| Preço Teto | Moeda (R$) | ❌ |

#### Setores Disponíveis:
- Bancos
- Energia
- Petróleo
- Mineração
- Varejo
- Seguros
- Bens Industriais
- Consumo
- Saúde
- Tecnologia
- Telecomunicações
- Papel e Celulose
- Alimentos
- Bebidas
- Outros

#### Funcionalidades:
- **Buscar ação:** Busca por ticker com preenchimento automático
- **Editar ação:** Atualizar quantidade, preço médio, etc.
- **Excluir ação:** Individual ou todas de uma vez
- **Importar CSV/Excel:** Suporte a arquivos CEI/B3
- **Exportar CSV:** Download da carteira

#### Exibição de Múltiplos Lotes:
- Agrupamento por ticker
- Preço médio ponderado
- Visualização de lançamentos individuais

---

### 3. Proventos (Dividendos)
**Objetivo:** Controle de proventos recebidos e a receber

#### Cards de Resumo:
| Card | Descrição |
|------|-----------|
| Total Recebido | Soma de proventos pagos |
| A Receber | Proventos futuros |
| Registros | Quantidade total |
| Média Mensal | Média de proventos por mês |

#### Registrar Provento:
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Ação | Seleção | ✅ |
| Valor | Moeda (R$) | ✅ |
| Data de Pagamento | Data | ✅ |
| Tipo | Seleção | ✅ |

#### Tipos de Provento:
- Dividendo
- JCP (Juros sobre Capital Próprio)
- Rendimento

#### Gráficos:
- **Proventos por Mês:** Gráfico de barras com filtros
  - Status: Todos, Recebido, A Receber
  - Período: 1 Mês, 6 Meses, 12 Meses, Máximo
- **Proventos por Ação:** Gráfico de pizza

#### Funcionalidades:
- **Sincronizar dividendos:** Busca automática de proventos (Investidor10)
- **Excluir todos:** Remove todos os registros
- **Paginação:** 10 itens por página

---

### 4. Valuation (Cálculo de Preço Teto)
**Objetivo:** Calcular preço teto usando diferentes métodos

#### Métodos de Valuation:
1. **Graham:** Preço justo baseado em P/L e P/VP
2. **Gordon:** Modelo de desconto de dividendos
3. **Bazin:** Baseado em dividend yield mínimo
4. **DCF:** Fluxo de caixa descontado
5. **Warren Buffett:** Owner Earnings

#### Dados Automáticos (Investidor10):
- Preço atual
- Dividend Yield
- P/L e P/VP
- ROE
- Payout
- LPA e VPA
- Lucro Líquido

#### Resultado:
- Preço teto calculado
- Indicação: "BARATA" (verde) ou "CARA" (vermelho)
- Margem de segurança
- Explicação do cálculo

---

### 5. Análise de Ações (IA)
**Objetivo:** Análise inteligente com IA (MOCKED - funcionalidade simulada)

#### Funcionalidades:
- Análise fundamentalista
- Recomendações de compra/venda
- Perguntas personalizadas sobre ações

> ⚠️ **NOTA:** Esta funcionalidade está MOCKADA na versão atual.

---

### 6. Multi-Carteiras
**Objetivo:** Gerenciar múltiplas carteiras de investimento

#### Funcionalidades:
- Criar nova carteira
- Renomear carteira (incluindo a padrão)
- Excluir carteira (exceto a padrão)
- Alternar entre carteiras
- Dados isolados por carteira

---

### 7. Suporte e Doações
**Objetivo:** Canal de comunicação e monetização

#### Botões Flutuantes:
- **Suporte:** Email para ajuda
- **Feedback:** Enviar sugestões
- **Doação:** Chaves PIX

#### Informações de Contato:
- **Email:** ayrtonkruscinski@hotmail.com
- **PIX Celular:** +5547988607103
- **PIX Aleatória:** 5c435619-f86c-4e64-8f49-8f36b4a4004b

---

## 🛠️ Integrações de API

### Fontes de Dados de Cotação (Prioridade):
1. **Yahoo Finance** (Principal)
2. **TradingView** (Backup)
3. **Alpha Vantage** (Último recurso)

### Dados Fundamentalistas:
- **Investidor10** (Web Scraping)

### Formato de Ticker:
- Yahoo Finance: `TICKER.SA` (ex: PETR4.SA)
- TradingView: `TICKER` com exchange BMFBOVESPA
- Alpha Vantage: `TICKER.SAO` (ex: PETR4.SAO)

---

## 📐 Esquema de Dados (MongoDB)

### Users
```json
{
  "user_id": "string",
  "email": "string",
  "name": "string",
  "picture": "string (opcional)",
  "created_at": "datetime"
}
```

### Portfolios
```json
{
  "portfolio_id": "string",
  "user_id": "string",
  "name": "string",
  "description": "string (opcional)",
  "is_default": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Stocks
```json
{
  "stock_id": "string",
  "user_id": "string",
  "portfolio_id": "string",
  "ticker": "string",
  "name": "string",
  "quantity": "number",
  "average_price": "number",
  "purchase_date": "string (opcional)",
  "sector": "string (opcional)",
  "current_price": "number (opcional)",
  "dividend_yield": "number (opcional)",
  "ceiling_price": "number (opcional)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Dividends
```json
{
  "dividend_id": "string",
  "user_id": "string",
  "stock_id": "string",
  "ticker": "string",
  "portfolio_id": "string (opcional)",
  "amount": "number",
  "payment_date": "string",
  "type": "string (dividendo|jcp|rendimento)",
  "created_at": "datetime"
}
```

### Alerts
```json
{
  "alert_id": "string",
  "user_id": "string",
  "stock_id": "string",
  "ticker": "string",
  "alert_type": "string (ceiling_reached|price_drop|price_rise)",
  "message": "string",
  "is_read": "boolean",
  "created_at": "datetime"
}
```

---

## 🎨 Design e UX

### Tema:
- **Dark Mode** como padrão
- Cor principal: Verde (#00E599)
- Cor secundária: Azul (#3B82F6)
- Cor de destaque/accent: Âmbar (#F59E0B)
- Background: Escuro (#121417)

### Formatação:
- **Moeda:** R$ 1.234,56 (formato brasileiro)
- **Data:** DD/MM/YYYY
- **Percentual:** +12,34% ou -5,67%
- **Fonte numérica:** Monospace

### Indicadores Visuais:
- ✅ Verde para valores positivos
- 🔴 Vermelho para valores negativos
- 🔵 Azul para valores pendentes
- 🟡 Âmbar/Amarelo para alertas

---

## 📱 Telas do App Mobile

1. **Splash Screen** - Logo e carregamento
2. **Login** - Google OAuth
3. **Dashboard** - Tela principal com resumo
4. **Carteira** - Lista de ações com CRUD
5. **Adicionar/Editar Ação** - Formulário
6. **Proventos** - Lista e gráficos
7. **Adicionar Provento** - Formulário
8. **Valuation** - Calculadora de preço teto
9. **Análise** - Chat com IA (mockado)
10. **Configurações** - Multi-carteiras, logout
11. **Suporte/Doação** - Modal com informações

---

## 🔧 Requisitos Técnicos

### Stack Recomendada (Emergent Mobile Agent):
- **Frontend:** React Native (Expo)
- **Backend:** FastAPI (reutilizar existente)
- **Database:** MongoDB (reutilizar existente)

### APIs Necessárias:
- Google OAuth
- Yahoo Finance
- TradingView TA
- Investidor10 (scraping)
- Alpha Vantage (backup)

### Dependências Backend:
```
fastapi
motor (MongoDB async)
httpx
beautifulsoup4
lxml
tradingview-ta
openpyxl
```

---

## 📋 Checklist de Funcionalidades

### MVP (Prioridade Alta):
- [ ] Login com Google
- [ ] Dashboard com cards de resumo
- [ ] CRUD de ações
- [ ] Atualização de cotações
- [ ] CRUD de proventos
- [ ] Gráficos básicos

### Fase 2 (Prioridade Média):
- [ ] Multi-carteiras
- [ ] Importação CSV/Excel
- [ ] Exportação CSV
- [ ] Sincronização de dividendos
- [ ] Alertas de preço teto
- [ ] Valuation (cálculo de preço teto)

### Fase 3 (Prioridade Baixa):
- [ ] Análise com IA
- [ ] Push notifications
- [ ] Widget para home screen
- [ ] Modo offline

---

## 💡 Observações Importantes

1. **Dados de Mercado:** Usar Yahoo Finance como fonte principal por ser mais confiável
2. **Scraping:** Investidor10 para dados fundamentalistas (ROE, Payout, etc.)
3. **Performance:** Cache de cotações para evitar muitas requisições
4. **Offline:** Considerar armazenamento local para uso offline
5. **Monetização:** Google AdSense já integrado na versão web

---

## 📞 Contato do Projeto

- **Email:** ayrtonkruscinski@hotmail.com
- **Chave PIX (Celular):** +5547988607103
- **Chave PIX (Aleatória):** 5c435619-f86c-4e64-8f49-8f36b4a4004b

---

*Documento gerado automaticamente para facilitar a criação da versão mobile do aplicativo.*
