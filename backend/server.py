from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Stock(BaseModel):
    stock_id: str = Field(default_factory=lambda: f"stock_{uuid.uuid4().hex[:12]}")
    user_id: str
    ticker: str
    name: str
    quantity: float
    average_price: float
    sector: Optional[str] = None
    current_price: Optional[float] = None
    dividend_yield: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StockCreate(BaseModel):
    ticker: str
    name: str
    quantity: float
    average_price: float
    sector: Optional[str] = None
    current_price: Optional[float] = None
    dividend_yield: Optional[float] = None

class StockUpdate(BaseModel):
    quantity: Optional[float] = None
    average_price: Optional[float] = None
    current_price: Optional[float] = None
    dividend_yield: Optional[float] = None

class Dividend(BaseModel):
    dividend_id: str = Field(default_factory=lambda: f"div_{uuid.uuid4().hex[:12]}")
    user_id: str
    stock_id: str
    ticker: str
    amount: float
    payment_date: str
    type: str = "dividendo"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DividendCreate(BaseModel):
    stock_id: str
    ticker: str
    amount: float
    payment_date: str
    type: str = "dividendo"

class ValuationRequest(BaseModel):
    ticker: str
    current_price: float
    dividend_per_share: float
    dividend_growth_rate: float = 0.05
    discount_rate: float = 0.12
    desired_yield: float = 0.06
    free_cash_flow: Optional[float] = None
    shares_outstanding: Optional[float] = None
    growth_rate: Optional[float] = 0.05

class AnalysisRequest(BaseModel):
    ticker: str
    current_price: float
    sector: Optional[str] = None
    dividend_yield: Optional[float] = None
    pe_ratio: Optional[float] = None
    question: Optional[str] = None

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# ==================== AUTH ROUTES ====================

@api_router.get("/auth/session")
async def exchange_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session ID")
    
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        data = resp.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data.get("picture")}}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    session_token = data.get("session_token", f"sess_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== PORTFOLIO ROUTES ====================

@api_router.get("/portfolio/stocks")
async def get_stocks(user: User = Depends(get_current_user)):
    stocks = await db.stocks.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    return stocks

@api_router.post("/portfolio/stocks")
async def add_stock(stock_data: StockCreate, user: User = Depends(get_current_user)):
    stock = Stock(
        user_id=user.user_id,
        ticker=stock_data.ticker.upper(),
        name=stock_data.name,
        quantity=stock_data.quantity,
        average_price=stock_data.average_price,
        sector=stock_data.sector,
        current_price=stock_data.current_price,
        dividend_yield=stock_data.dividend_yield
    )
    doc = stock.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.stocks.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/portfolio/stocks/{stock_id}")
async def update_stock(stock_id: str, stock_data: StockUpdate, user: User = Depends(get_current_user)):
    update_fields = {k: v for k, v in stock_data.model_dump().items() if v is not None}
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.stocks.update_one(
            {"stock_id": stock_id, "user_id": user.user_id},
            {"$set": update_fields}
        )
    stock = await db.stocks.find_one({"stock_id": stock_id, "user_id": user.user_id}, {"_id": 0})
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock

@api_router.delete("/portfolio/stocks/{stock_id}")
async def delete_stock(stock_id: str, user: User = Depends(get_current_user)):
    result = await db.stocks.delete_one({"stock_id": stock_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stock not found")
    return {"message": "Stock deleted"}

@api_router.get("/portfolio/summary")
async def get_portfolio_summary(user: User = Depends(get_current_user)):
    stocks = await db.stocks.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    
    total_invested = sum(s["quantity"] * s["average_price"] for s in stocks)
    total_current = sum(s["quantity"] * (s.get("current_price") or s["average_price"]) for s in stocks)
    total_gain = total_current - total_invested
    gain_percent = (total_gain / total_invested * 100) if total_invested > 0 else 0
    
    dividends = await db.dividends.find({"user_id": user.user_id}, {"_id": 0}).to_list(10000)
    total_dividends = sum(d["amount"] for d in dividends)
    
    return {
        "total_invested": round(total_invested, 2),
        "total_current": round(total_current, 2),
        "total_gain": round(total_gain, 2),
        "gain_percent": round(gain_percent, 2),
        "total_dividends": round(total_dividends, 2),
        "stocks_count": len(stocks)
    }

# ==================== DIVIDENDS ROUTES ====================

@api_router.get("/dividends")
async def get_dividends(user: User = Depends(get_current_user)):
    dividends = await db.dividends.find({"user_id": user.user_id}, {"_id": 0}).to_list(10000)
    return dividends

@api_router.post("/dividends")
async def add_dividend(dividend_data: DividendCreate, user: User = Depends(get_current_user)):
    dividend = Dividend(
        user_id=user.user_id,
        stock_id=dividend_data.stock_id,
        ticker=dividend_data.ticker.upper(),
        amount=dividend_data.amount,
        payment_date=dividend_data.payment_date,
        type=dividend_data.type
    )
    doc = dividend.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.dividends.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/dividends/summary")
async def get_dividends_summary(user: User = Depends(get_current_user)):
    dividends = await db.dividends.find({"user_id": user.user_id}, {"_id": 0}).to_list(10000)
    
    by_month = {}
    by_ticker = {}
    
    for d in dividends:
        month = d["payment_date"][:7]
        by_month[month] = by_month.get(month, 0) + d["amount"]
        by_ticker[d["ticker"]] = by_ticker.get(d["ticker"], 0) + d["amount"]
    
    return {
        "total": round(sum(d["amount"] for d in dividends), 2),
        "by_month": [{"month": k, "amount": round(v, 2)} for k, v in sorted(by_month.items())],
        "by_ticker": [{"ticker": k, "amount": round(v, 2)} for k, v in sorted(by_ticker.items(), key=lambda x: -x[1])]
    }

# ==================== VALUATION ROUTES ====================

@api_router.post("/valuation/calculate")
async def calculate_valuation(data: ValuationRequest, user: User = Depends(get_current_user)):
    results = {}
    
    # Modelo de Gordon
    if data.discount_rate > data.dividend_growth_rate:
        gordon_price = data.dividend_per_share * (1 + data.dividend_growth_rate) / (data.discount_rate - data.dividend_growth_rate)
        results["gordon"] = {
            "name": "Modelo de Gordon",
            "ceiling_price": round(gordon_price, 2),
            "upside": round((gordon_price / data.current_price - 1) * 100, 2),
            "recommendation": "Comprar" if gordon_price > data.current_price else "Aguardar"
        }
    
    # Método Bazin
    if data.desired_yield > 0:
        bazin_price = data.dividend_per_share / data.desired_yield
        results["bazin"] = {
            "name": "Método Bazin",
            "ceiling_price": round(bazin_price, 2),
            "upside": round((bazin_price / data.current_price - 1) * 100, 2),
            "recommendation": "Comprar" if bazin_price > data.current_price else "Aguardar"
        }
    
    # DCF Simplificado
    if data.free_cash_flow and data.shares_outstanding and data.discount_rate > data.growth_rate:
        terminal_value = data.free_cash_flow * (1 + data.growth_rate) / (data.discount_rate - data.growth_rate)
        dcf_price = terminal_value / data.shares_outstanding
        results["dcf"] = {
            "name": "Fluxo de Caixa Descontado",
            "ceiling_price": round(dcf_price, 2),
            "upside": round((dcf_price / data.current_price - 1) * 100, 2),
            "recommendation": "Comprar" if dcf_price > data.current_price else "Aguardar"
        }
    
    return {
        "ticker": data.ticker,
        "current_price": data.current_price,
        "valuations": results
    }

# ==================== AI ANALYSIS ROUTES ====================

@api_router.post("/analysis/stock")
async def analyze_stock(data: AnalysisRequest, user: User = Depends(get_current_user)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM key not configured")
        
        prompt = f"""Analise a ação {data.ticker} da bolsa brasileira B3.

Dados disponíveis:
- Preço atual: R$ {data.current_price}
- Setor: {data.sector or 'Não informado'}
- Dividend Yield: {data.dividend_yield or 'Não informado'}%
- P/L: {data.pe_ratio or 'Não informado'}

{f'Pergunta específica: {data.question}' if data.question else ''}

Faça uma análise fundamentalista breve e objetiva em português, incluindo:
1. Avaliação do preço atual
2. Pontos fortes e fracos
3. Recomendação (Comprar, Manter ou Vender)

Seja direto e use no máximo 200 palavras."""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"analysis_{user.user_id}_{data.ticker}",
            system_message="Você é um analista financeiro especializado no mercado brasileiro de ações. Forneça análises precisas e objetivas."
        ).with_model("openai", "gpt-4o-mini")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return {
            "ticker": data.ticker,
            "analysis": response,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="LLM integration not available")
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== STOCK DATA ROUTES ====================

@api_router.get("/stocks/search/{ticker}")
async def search_stock(ticker: str):
    # Dados mock para ações brasileiras populares
    brazilian_stocks = {
        "PETR4": {"ticker": "PETR4", "name": "Petrobras PN", "sector": "Petróleo", "current_price": 38.50, "dividend_yield": 12.5},
        "VALE3": {"ticker": "VALE3", "name": "Vale ON", "sector": "Mineração", "current_price": 62.30, "dividend_yield": 8.2},
        "ITUB4": {"ticker": "ITUB4", "name": "Itaú Unibanco PN", "sector": "Bancos", "current_price": 32.80, "dividend_yield": 5.1},
        "BBDC4": {"ticker": "BBDC4", "name": "Bradesco PN", "sector": "Bancos", "current_price": 14.20, "dividend_yield": 4.8},
        "BBAS3": {"ticker": "BBAS3", "name": "Banco do Brasil ON", "sector": "Bancos", "current_price": 28.90, "dividend_yield": 9.3},
        "WEGE3": {"ticker": "WEGE3", "name": "WEG ON", "sector": "Bens Industriais", "current_price": 42.50, "dividend_yield": 1.2},
        "RENT3": {"ticker": "RENT3", "name": "Localiza ON", "sector": "Consumo", "current_price": 45.60, "dividend_yield": 2.1},
        "MGLU3": {"ticker": "MGLU3", "name": "Magazine Luiza ON", "sector": "Varejo", "current_price": 2.15, "dividend_yield": 0.0},
        "ABEV3": {"ticker": "ABEV3", "name": "Ambev ON", "sector": "Bebidas", "current_price": 12.80, "dividend_yield": 5.5},
        "EGIE3": {"ticker": "EGIE3", "name": "Engie Brasil ON", "sector": "Energia", "current_price": 43.20, "dividend_yield": 7.8},
        "TAEE11": {"ticker": "TAEE11", "name": "Taesa Unit", "sector": "Energia", "current_price": 35.40, "dividend_yield": 9.5},
        "BBSE3": {"ticker": "BBSE3", "name": "BB Seguridade ON", "sector": "Seguros", "current_price": 35.20, "dividend_yield": 8.0},
    }
    
    ticker_upper = ticker.upper()
    if ticker_upper in brazilian_stocks:
        return brazilian_stocks[ticker_upper]
    
    # Retorna dados genéricos para outros tickers
    return {
        "ticker": ticker_upper,
        "name": f"Ação {ticker_upper}",
        "sector": "Outros",
        "current_price": None,
        "dividend_yield": None
    }

@api_router.get("/")
async def root():
    return {"message": "Stock Portfolio API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
