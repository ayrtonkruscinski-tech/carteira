import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calculator, TrendingUp, TrendingDown, HelpCircle, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Valuation() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [formData, setFormData] = useState({
    ticker: "",
    current_price: "",
    dividend_per_share: "",
    dividend_growth_rate: "5",
    discount_rate: "12",
    desired_yield: "6",
    free_cash_flow: "",
    shares_outstanding: "",
    growth_rate: "5",
    // Campos para método Buffett
    net_income: "",
    depreciation: "",
    capex: "",
    roe: "",
    payout: "",
  });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch(`${API}/portfolio/stocks`, {
        credentials: "include",
      });
      if (response.ok) {
        setStocks(await response.json());
      }
    } catch (error) {
      console.error("Error fetching stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockSelect = async (ticker) => {
    const stock = stocks.find((s) => s.ticker === ticker);
    if (stock) {
      setFormData({
        ...formData,
        ticker: stock.ticker,
        current_price: stock.current_price?.toString() || "",
        dividend_per_share: "",
      });
      // Fetch detailed valuation data
      await fetchValuationData(stock.ticker);
    }
  };

  const fetchValuationData = async (ticker) => {
    setSearching(true);
    try {
      const response = await fetch(`${API}/stocks/valuation-data/${ticker}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          ticker: data.ticker,
          current_price: data.current_price?.toString() || prev.current_price,
          dividend_per_share: data.dividend_per_share?.toString() || prev.dividend_per_share,
          dividend_growth_rate: data.dividend_growth_rate?.toString() || prev.dividend_growth_rate,
          net_income: data.net_income ? (data.net_income / 1000000).toFixed(0) : prev.net_income,
          depreciation: data.depreciation ? (data.depreciation / 1000000).toFixed(0) : prev.depreciation,
          capex: data.capex ? (data.capex / 1000000).toFixed(0) : prev.capex,
          free_cash_flow: data.free_cash_flow ? (data.free_cash_flow / 1000000).toFixed(0) : prev.free_cash_flow,
          shares_outstanding: data.shares_outstanding ? (data.shares_outstanding / 1000000).toFixed(0) : prev.shares_outstanding,
          roe: data.roe?.toString() || prev.roe,
          payout: data.payout?.toString() || prev.payout,
        }));
        toast.success(`Dados de ${ticker} carregados do Investidor10`);
      }
    } catch (error) {
      console.error("Fetch valuation data error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!formData.ticker) return;
    await fetchValuationData(formData.ticker.toUpperCase());
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setCalculating(true);

    try {
      const response = await fetch(`${API}/valuation/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticker: formData.ticker,
          current_price: parseFloat(formData.current_price),
          dividend_per_share: parseFloat(formData.dividend_per_share),
          dividend_growth_rate: parseFloat(formData.dividend_growth_rate) / 100,
          discount_rate: parseFloat(formData.discount_rate) / 100,
          desired_yield: parseFloat(formData.desired_yield) / 100,
          free_cash_flow: formData.free_cash_flow ? parseFloat(formData.free_cash_flow) * 1000000 : null,
          shares_outstanding: formData.shares_outstanding ? parseFloat(formData.shares_outstanding) * 1000000 : null,
          growth_rate: parseFloat(formData.growth_rate) / 100,
          // Campos para método Buffett (em milhões)
          net_income: formData.net_income ? parseFloat(formData.net_income) * 1000000 : null,
          depreciation: formData.depreciation ? parseFloat(formData.depreciation) * 1000000 : null,
          capex: formData.capex ? parseFloat(formData.capex) * 1000000 : null,
          roe: formData.roe ? parseFloat(formData.roe) : null,
          payout: formData.payout ? parseFloat(formData.payout) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        toast.success("Valuation calculado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao calcular valuation");
      console.error("Valuation error:", error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="valuation-page" className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Valuation - Preço Teto</h1>
          <p className="text-muted-foreground">
            Calcule o preço justo das ações usando métodos profissionais
          </p>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Parâmetros de Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCalculate} className="space-y-6">
                  {/* Stock Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Ação
                    </Label>
                    <div className="flex gap-2">
                      <Select value={formData.ticker} onValueChange={handleStockSelect}>
                        <SelectTrigger className="bg-input border-input flex-1" data-testid="stock-select">
                          <SelectValue placeholder="Selecione ou digite" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {/* Agrupar ações por ticker e ordenar alfabeticamente */}
                          {[...new Map(stocks.map(s => [s.ticker, s])).values()]
                            .sort((a, b) => a.ticker.localeCompare(b.ticker))
                            .map((stock) => (
                              <SelectItem key={stock.ticker} value={stock.ticker}>
                                {stock.ticker} - {stock.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="TICKER"
                        value={formData.ticker}
                        onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                        className="bg-input border-input font-mono w-28"
                        data-testid="ticker-input"
                      />
                      <Button type="button" variant="secondary" onClick={handleSearch}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_price">Preço Atual (R$)</Label>
                      <Input
                        id="current_price"
                        type="number"
                        step="0.01"
                        value={formData.current_price}
                        onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                        required
                        className="bg-input border-input font-mono"
                        data-testid="current-price-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dividend_per_share" className="flex items-center gap-1">
                        Dividendo/Ação (R$)
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover border-border">
                            Dividendo anual por ação
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="dividend_per_share"
                        type="number"
                        step="0.01"
                        value={formData.dividend_per_share}
                        onChange={(e) => setFormData({ ...formData, dividend_per_share: e.target.value })}
                        required
                        className="bg-input border-input font-mono"
                        data-testid="dividend-input"
                      />
                    </div>
                  </div>

                  {/* Gordon/Bazin Parameters */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Parâmetros Gordon & Bazin</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dividend_growth_rate" className="flex items-center gap-1">
                          Cresc. Div (%)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover border-border">
                              Taxa de crescimento esperada dos dividendos
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="dividend_growth_rate"
                          type="number"
                          step="0.1"
                          value={formData.dividend_growth_rate}
                          onChange={(e) => setFormData({ ...formData, dividend_growth_rate: e.target.value })}
                          className="bg-input border-input font-mono"
                          data-testid="growth-rate-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount_rate" className="flex items-center gap-1">
                          Taxa Desc (%)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover border-border">
                              Taxa de desconto (retorno esperado)
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="discount_rate"
                          type="number"
                          step="0.1"
                          value={formData.discount_rate}
                          onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                          className="bg-input border-input font-mono"
                          data-testid="discount-rate-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="desired_yield" className="flex items-center gap-1">
                          Yield Desej (%)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover border-border">
                              Dividend Yield mínimo desejado (Bazin)
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="desired_yield"
                          type="number"
                          step="0.1"
                          value={formData.desired_yield}
                          onChange={(e) => setFormData({ ...formData, desired_yield: e.target.value })}
                          className="bg-input border-input font-mono"
                          data-testid="desired-yield-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DCF Parameters */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Parâmetros DCF (Opcional)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="free_cash_flow" className="flex items-center gap-1">
                          FCF (milhões)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover border-border">
                              Fluxo de Caixa Livre em milhões
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="free_cash_flow"
                          type="number"
                          step="0.01"
                          value={formData.free_cash_flow}
                          onChange={(e) => setFormData({ ...formData, free_cash_flow: e.target.value })}
                          className="bg-input border-input font-mono"
                          data-testid="fcf-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shares_outstanding" className="flex items-center gap-1">
                          Ações (milhões)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover border-border">
                              Total de ações em circulação
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="shares_outstanding"
                          type="number"
                          step="0.01"
                          value={formData.shares_outstanding}
                          onChange={(e) => setFormData({ ...formData, shares_outstanding: e.target.value })}
                          className="bg-input border-input font-mono"
                          data-testid="shares-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="growth_rate" className="flex items-center gap-1">
                          Cresc. Perp (%)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover border-border">
                              Taxa de crescimento perpétuo
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="growth_rate"
                          type="number"
                          step="0.1"
                          value={formData.growth_rate}
                          onChange={(e) => setFormData({ ...formData, growth_rate: e.target.value })}
                          className="bg-input border-input font-mono"
                          data-testid="perp-growth-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Warren Buffett Parameters */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Método Warren Buffett (Opcional)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="net_income" className="flex items-center gap-1">
                          Lucro Líq (mi)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Lucro Líquido anual em milhões
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="net_income"
                          type="number"
                          step="0.01"
                          value={formData.net_income}
                          onChange={(e) => setFormData({ ...formData, net_income: e.target.value })}
                          className="bg-input border-input font-mono"
                          placeholder="Ex: 5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="depreciation" className="flex items-center gap-1">
                          Deprec (mi)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Depreciação e Amortização em milhões
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="depreciation"
                          type="number"
                          step="0.01"
                          value={formData.depreciation}
                          onChange={(e) => setFormData({ ...formData, depreciation: e.target.value })}
                          className="bg-input border-input font-mono"
                          placeholder="Ex: 800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capex" className="flex items-center gap-1">
                          CapEx (mi)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Capital Expenditure em milhões
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="capex"
                          type="number"
                          step="0.01"
                          value={formData.capex}
                          onChange={(e) => setFormData({ ...formData, capex: e.target.value })}
                          className="bg-input border-input font-mono"
                          placeholder="Ex: 600"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="roe" className="flex items-center gap-1">
                          ROE Médio (%)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Média do ROE dos últimos 5 anos (ou anos disponíveis). Usado para calcular taxa de crescimento.
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="roe"
                          type="number"
                          step="0.1"
                          value={formData.roe}
                          onChange={(e) => setFormData({ ...formData, roe: e.target.value })}
                          className="bg-input border-input font-mono"
                          placeholder="Ex: 15"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payout" className="flex items-center gap-1">
                          Payout Médio (%)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Média do Payout dos últimos 5 anos. Taxa de retenção = 1 - Payout
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="payout"
                          type="number"
                          step="0.1"
                          value={formData.payout}
                          onChange={(e) => setFormData({ ...formData, payout: e.target.value })}
                          className="bg-input border-input font-mono"
                          placeholder="Ex: 40"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      DCF com Owner Earnings: projeta 10 anos de fluxo de caixa usando crescimento = ROE médio × (1 - Payout médio). Margem de segurança de 25%.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={calculating}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,229,153,0.3)]"
                    data-testid="calculate-btn"
                  >
                    {calculating ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Calcular Preço Teto
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              {results ? (
                <>
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="font-mono text-2xl text-foreground">{results.ticker}</span>
                        <span className="text-lg text-muted-foreground">
                          Atual: {formatCurrency(results.current_price)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {Object.entries(results.valuations).map(([key, valuation]) => (
                    <Card
                      key={key}
                      className={`bg-card border-border transition-all duration-300 hover:-translate-y-1 ${
                        valuation.upside > 0 ? "hover:border-primary/30" : "hover:border-destructive/30"
                      }`}
                      data-testid={`valuation-${key}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-foreground">{valuation.name}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              valuation.recommendation === "Comprar"
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {valuation.recommendation}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Preço Teto</p>
                            <p className="text-3xl font-bold font-mono text-foreground">
                              {formatCurrency(valuation.ceiling_price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Potencial</p>
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-3xl font-bold font-mono ${
                                  valuation.upside >= 0 ? "text-primary" : "text-destructive"
                                }`}
                              >
                                {valuation.upside >= 0 ? "+" : ""}
                                {valuation.upside}%
                              </p>
                              {valuation.upside >= 0 ? (
                                <TrendingUp className="w-6 h-6 text-primary" />
                              ) : (
                                <TrendingDown className="w-6 h-6 text-destructive" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-6">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                valuation.upside >= 0 ? "bg-primary" : "bg-destructive"
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(0, (results.current_price / valuation.ceiling_price) * 100))}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>Preço Atual: {((results.current_price / valuation.ceiling_price) * 100).toFixed(0)}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="py-16 text-center">
                    <Calculator className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Calcule o Preço Teto
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Preencha os parâmetros ao lado para calcular o preço justo da ação usando os métodos Gordon, Bazin e DCF
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
    </Layout>
  );
}
