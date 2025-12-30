# 📈 Carteira de Investimentos Inteligente

Aplicação web completa para gerenciamento de carteira de ações da B3 (Bolsa de Valores do Brasil), com acompanhamento de rentabilidade, dividendos, cálculo de preço teto e análise fundamentalista.

---

## 🚀 Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Python | 3.11.14 | Linguagem principal |
| FastAPI | 0.110.1 | Framework web assíncrono |
| Motor | 3.3.1 | Driver assíncrono para MongoDB |
| Pydantic | 2.12.5 | Validação de dados |
| Uvicorn | 0.25.0 | Servidor ASGI |
| httpx | 0.28.1 | Cliente HTTP assíncrono |
| BeautifulSoup4 | 4.14.3 | Web scraping |
| tradingview-ta | 3.3.0 | Integração TradingView |
| openpyxl | 3.1.5 | Leitura de arquivos Excel |

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Node.js | 20.19.6 | Runtime JavaScript |
| React | 19.0.0 | Biblioteca UI |
| React Router | 7.5.1 | Roteamento SPA |
| Recharts | 3.6.0 | Gráficos interativos |
| Tailwind CSS | 3.x | Framework CSS |
| Shadcn/ui | - | Componentes UI |
| Lucide React | 0.507.0 | Ícones |

### Banco de Dados
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| MongoDB | 7.0.28 | Banco de dados NoSQL |
| MongoDB Atlas | - | Versão cloud (produção) |

---

## 📁 Estrutura do Projeto

```
/app/
├── backend/                    # API Backend (FastAPI)
│   ├── server.py              # Aplicação principal e endpoints
│   ├── requirements.txt       # Dependências Python
│   └── .env                   # Variáveis de ambiente
│
├── frontend/                   # Frontend (React)
│   ├── public/
│   │   └── index.html         # HTML principal + Google AdSense
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   │   ├── ui/            # Componentes Shadcn/ui
│   │   │   ├── Layout.jsx     # Layout principal com navegação
│   │   │   ├── AdBanner.jsx   # Banners Google AdSense
│   │   │   ├── FloatingSupport.jsx  # Botões de suporte/doação
│   │   │   ├── AuthCallback.jsx     # Callback OAuth
│   │   │   └── ProtectedRoute.jsx   # Proteção de rotas
│   │   ├── context/
│   │   │   └── PortfolioContext.jsx # Estado global de carteiras
│   │   ├── pages/
│   │   │   ├── Landing.jsx    # Página inicial
│   │   │   ├── Dashboard.jsx  # Painel principal
│   │   │   ├── Portfolio.jsx  # Gestão de ações
│   │   │   ├── Dividends.jsx  # Gestão de proventos
│   │   │   ├── Valuation.jsx  # Cálculo de preço teto
│   │   │   └── Analysis.jsx   # Análise com IA
│   │   ├── App.js             # Configuração de rotas
│   │   ├── App.css            # Estilos globais
│   │   └── index.js           # Ponto de entrada
│   ├── package.json           # Dependências Node.js
│   └── .env                   # Variáveis de ambiente
│
├── memory/                     # Documentação do projeto
├── tests/                      # Testes automatizados
├── MOBILE_APP_REQUIREMENTS.md  # Requisitos para app mobile
└── README.md                   # Este arquivo
```

---

## 🔧 Configuração e Execução

### Variáveis de Ambiente

#### Backend (`/app/backend/.env`)
```env
MONGO_URL="mongodb://localhost:27017"          # URL do MongoDB (local ou Atlas)
DB_NAME="test_database"                        # Nome do banco de dados
CORS_ORIGINS="*"                               # Origens permitidas (CORS)
EMERGENT_LLM_KEY=sk-emergent-xxxxx            # Chave para integração IA
ALPHA_VANTAGE_KEY=xxxxx                        # API Key Alpha Vantage
```

#### Frontend (`/app/frontend/.env`)
```env
REACT_APP_BACKEND_URL=https://seu-app.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

### Inicialização dos Serviços

A aplicação utiliza **Supervisor** para gerenciar os processos:

```bash
# Verificar status dos serviços
sudo supervisorctl status

# Reiniciar serviços individualmente
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Reiniciar todos os serviços
sudo supervisorctl restart all
```

### Portas dos Serviços
| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Backend (FastAPI) | 8001 | API REST |
| Frontend (React) | 3000 | Interface web |
| MongoDB | 27017 | Banco de dados |

---

## 📊 Fontes de Dados

### Cotações em Tempo Real (Prioridade de uso)

1. **Yahoo Finance** (Principal)
   - Endpoint: `https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}.SA`
   - Dados: Preço atual, variação, volume
   - Sufixo para B3: `.SA`

2. **TradingView** (Backup)
   - Biblioteca: `tradingview-ta`
   - Exchange: `BMFBOVESPA`
   - Dados: Preço, indicadores técnicos, recomendação

3. **Alpha Vantage** (Último recurso)
   - Endpoint: `https://www.alphavantage.co/query`
   - Sufixo para B3: `.SAO`
   - Requer API Key

4. **Cache Local** (Fallback)
   - Dados estáticos de ações populares
   - Usado quando APIs externas falham

### Dados Fundamentalistas

**Investidor10** (Web Scraping)
- URL: `https://investidor10.com.br/acoes/{ticker}/`
- Dados extraídos:
  - P/L (Preço/Lucro)
  - P/VP (Preço/Valor Patrimonial)
  - ROE (Return on Equity)
  - Payout
  - LPA (Lucro por Ação)
  - VPA (Valor Patrimonial por Ação)
  - Dividend Yield
  - Histórico de dividendos

### Importação de Dados do Usuário

A aplicação suporta importação de carteira via arquivos:

| Formato | Fonte | Colunas Esperadas |
|---------|-------|-------------------|
| CSV | Extrato CEI/B3 | Código, Quantidade, Preço, Data |
| XLSX | Planilha Excel | Ticker, Quantidade, Preço Médio |
| XLS | Excel antigo | Ticker, Quantidade, Preço Médio |

---

## 🔐 Autenticação

### Google OAuth (Emergent Managed)
A autenticação é gerenciada pelo Emergent Auth Service:

```
1. Usuário clica em "Entrar com Google"
2. Redirecionamento para OAuth do Google
3. Callback com session_id no hash da URL
4. Frontend troca session_id por session_token
5. Session_token armazenado em cookie (7 dias)
```

### Fluxo de Autenticação
```
Frontend → Emergent Auth → Google OAuth → Emergent Auth → Backend → MongoDB
```

---

## 🗄️ Esquema do Banco de Dados

### Collections MongoDB

#### `users`
```javascript
{
  user_id: "user_xxxx",           // ID único
  email: "user@email.com",
  name: "Nome do Usuário",
  picture: "https://...",         // URL da foto (Google)
  created_at: ISODate()
}
```

#### `portfolios`
```javascript
{
  portfolio_id: "port_xxxx",
  user_id: "user_xxxx",
  name: "Carteira Principal",
  description: "Descrição opcional",
  is_default: true,               // Carteira padrão
  created_at: ISODate(),
  updated_at: ISODate()
}
```

#### `stocks`
```javascript
{
  stock_id: "stock_xxxx",
  user_id: "user_xxxx",
  portfolio_id: "port_xxxx",
  ticker: "PETR4",
  name: "Petrobras PN",
  quantity: 100,
  average_price: 35.50,
  purchase_date: "2024-01-15",
  sector: "Petróleo",
  current_price: 38.20,
  dividend_yield: 12.5,
  ceiling_price: 40.00,           // Preço teto (opcional)
  created_at: ISODate(),
  updated_at: ISODate()
}
```

#### `dividends`
```javascript
{
  dividend_id: "div_xxxx",
  user_id: "user_xxxx",
  stock_id: "stock_xxxx",
  ticker: "PETR4",
  portfolio_id: "port_xxxx",
  amount: 125.50,
  payment_date: "2024-03-15",
  type: "dividendo",              // dividendo | jcp | rendimento
  created_at: ISODate()
}
```

#### `alerts`
```javascript
{
  alert_id: "alert_xxxx",
  user_id: "user_xxxx",
  stock_id: "stock_xxxx",
  ticker: "PETR4",
  alert_type: "ceiling_reached",  // ceiling_reached | price_drop | price_rise
  message: "PETR4 atingiu o preço teto!",
  is_read: false,
  created_at: ISODate()
}
```

#### `user_sessions`
```javascript
{
  user_id: "user_xxxx",
  session_token: "sess_xxxx",
  expires_at: ISODate(),
  created_at: ISODate()
}
```

#### `portfolio_snapshots`
```javascript
{
  snapshot_id: "snap_xxxx",
  user_id: "user_xxxx",
  date: "2024-03-15",
  total_invested: 50000.00,
  total_current: 55000.00,
  total_dividends: 2500.00,
  stocks_count: 10,
  created_at: ISODate()
}
```

---

## 🔌 API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/auth/session` | Trocar session_id por token |
| GET | `/api/auth/me` | Dados do usuário logado |
| POST | `/api/auth/logout` | Encerrar sessão |

### Carteiras (Portfolios)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/portfolios` | Listar carteiras |
| POST | `/api/portfolios` | Criar carteira |
| PUT | `/api/portfolios/{id}` | Atualizar carteira |
| DELETE | `/api/portfolios/{id}` | Excluir carteira |

### Ações (Stocks)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/portfolio/stocks` | Listar ações |
| POST | `/api/portfolio/stocks` | Adicionar ação |
| PUT | `/api/portfolio/stocks/{id}` | Atualizar ação |
| DELETE | `/api/portfolio/stocks/{id}` | Excluir ação |
| POST | `/api/portfolio/refresh-prices` | Atualizar cotações |
| GET | `/api/portfolio/summary` | Resumo da carteira |
| GET | `/api/portfolio/evolution` | Evolução patrimonial |
| POST | `/api/portfolio/import` | Importar CSV/Excel |
| GET | `/api/portfolio/export/csv` | Exportar carteira |

### Cotações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/stocks/search/{ticker}` | Buscar ação |
| GET | `/api/stocks/quote/{ticker}` | Cotação em tempo real |
| GET | `/api/stocks/valuation-data/{ticker}` | Dados para valuation |

### Dividendos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/dividends` | Listar dividendos |
| POST | `/api/dividends` | Registrar dividendo |
| GET | `/api/dividends/summary` | Resumo de dividendos |
| POST | `/api/dividends/sync` | Sincronizar (Investidor10) |
| DELETE | `/api/dividends/all` | Excluir todos |

### Valuation
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/valuation/calculate` | Calcular preço teto |

### Alertas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/alerts` | Listar alertas |
| GET | `/api/alerts/count` | Contador de alertas |
| PUT | `/api/alerts/{id}/read` | Marcar como lido |

### Health Check
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Status da aplicação |

---

## 🧮 Métodos de Valuation

A aplicação implementa 5 métodos para cálculo de preço teto:

### 1. Método Graham
```
Preço Justo = √(22.5 × LPA × VPA)
```

### 2. Modelo de Gordon (DDM)
```
Preço Justo = DPA × (1 + g) / (r - g)
Onde: DPA = Dividendo por ação, g = crescimento, r = taxa de desconto
```

### 3. Método Bazin
```
Preço Teto = DPA / Yield Mínimo Desejado
```

### 4. DCF (Fluxo de Caixa Descontado)
```
Valor = Σ (FCF × (1 + g)^n) / (1 + r)^n
```

### 5. Warren Buffett (Owner Earnings)
```
Owner Earnings = Lucro Líquido + Depreciação - CapEx
Valor = Owner Earnings / Taxa de Desconto
```

---

## 🚀 Deploy em Produção

### Emergent Deployments (Kubernetes)

A aplicação está otimizada para deploy no Emergent:

1. **MongoDB Atlas**: Conexão configurada com retry e timeouts adequados
2. **CORS**: Configurado para aceitar qualquer origem (`*`)
3. **Health Check**: Endpoint `/api/health` para probes K8s
4. **Variáveis de Ambiente**: Todas as configurações via `.env`

### Configuração MongoDB Atlas
```python
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=30000,
    socketTimeoutMS=60000,
    maxPoolSize=50,
    minPoolSize=5,
    retryWrites=True,
    retryReads=True,
    w='majority',
    directConnection=False,
)
```

---

## 📱 Versão Mobile

Documentação para criação de app mobile disponível em:
- `/app/MOBILE_APP_REQUIREMENTS.md`

---

## 💰 Monetização

### Google AdSense
- Publisher ID: `pub-1859251402912948`
- Banners entre seções das páginas principais

### Doações (PIX)
- Celular: `+5547988607103`
- Chave Aleatória: `5c435619-f86c-4e64-8f49-8f36b4a4004b`

---

## 📞 Suporte

- **Email**: ayrtonkruscinski@hotmail.com
- **Feedback**: Via botão flutuante na aplicação

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

*Documentação atualizada em Dezembro/2025*
