import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Brain, Send, Sparkles, Search, Clock, Briefcase, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Analysis() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingPortfolio, setAnalyzingPortfolio] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [formData, setFormData] = useState({
    ticker: "",
    current_price: "",
    sector: "",
    dividend_yield: "",
    pe_ratio: "",
    question: "",
  });

  useEffect(() => {
    fetchStocks();
    // Load history from localStorage
    const savedHistory = localStorage.getItem("analysis_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    
    // Cleanup function - clear data when leaving the page
    return () => {
      // Clear analysis states
      setAnalysis(null);
      setPortfolioAnalysis(null);
      setFormData({
        ticker: "",
        current_price: "",
        sector: "",
        dividend_yield: "",
        pe_ratio: "",
        question: "",
      });
      // Clear localStorage
      localStorage.removeItem("portfolio_analysis");
      localStorage.removeItem("analysis_history");
    };
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

  const handleStockSelect = (ticker) => {
    const stock = stocks.find((s) => s.ticker === ticker);
    if (stock) {
      setFormData({
        ...formData,
        ticker: stock.ticker,
        current_price: stock.current_price?.toString() || "",
        sector: stock.sector || "",
        dividend_yield: stock.dividend_yield?.toString() || "",
      });
    }
  };

  const handleSearch = async () => {
    if (!formData.ticker) return;
    try {
      const response = await fetch(`${API}/stocks/search/${formData.ticker}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData,
          ticker: data.ticker,
          current_price: data.current_price?.toString() || formData.current_price,
          sector: data.sector || formData.sector,
          dividend_yield: data.dividend_yield?.toString() || formData.dividend_yield,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setAnalyzing(true);

    try {
      const response = await fetch(`${API}/analysis/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticker: formData.ticker,
          current_price: parseFloat(formData.current_price),
          sector: formData.sector || null,
          dividend_yield: formData.dividend_yield ? parseFloat(formData.dividend_yield) : null,
          pe_ratio: formData.pe_ratio ? parseFloat(formData.pe_ratio) : null,
          question: formData.question || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);

        // Save to history
        const newHistory = [
          { ...data, id: Date.now() },
          ...history.slice(0, 4),
        ];
        setHistory(newHistory);
        localStorage.setItem("analysis_history", JSON.stringify(newHistory));

        toast.success("Análise gerada com sucesso!");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Erro ao gerar análise");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzePortfolio = async () => {
    setAnalyzingPortfolio(true);

    try {
      const response = await fetch(`${API}/analysis/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioAnalysis(data);
        localStorage.setItem("portfolio_analysis", JSON.stringify(data));
        toast.success("Análise da carteira gerada com sucesso!");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Erro ao gerar análise da carteira");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
      console.error("Portfolio analysis error:", error);
    } finally {
      setAnalyzingPortfolio(false);
    }
  };

  const loadFromHistory = (item) => {
    setAnalysis(item);
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
      <div data-testid="analysis-page" className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Análise com IA</h1>
          <p className="text-muted-foreground">
            Obtenha insights inteligentes sobre suas ações usando inteligência artificial
          </p>
        </div>

        {/* Tabs for Stock vs Portfolio Analysis */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Ação Individual
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Carteira Completa
            </TabsTrigger>
          </TabsList>

          {/* Stock Analysis Tab */}
          <TabsContent value="stock" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-secondary" />
                Dados da Ação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <div className="flex gap-2">
                    <Select value={formData.ticker} onValueChange={handleStockSelect}>
                      <SelectTrigger className="bg-input border-input flex-1" data-testid="stock-select">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {stocks.map((stock) => (
                          <SelectItem key={stock.stock_id} value={stock.ticker}>
                            {stock.ticker}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="TICKER"
                      value={formData.ticker}
                      onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                      className="bg-input border-input font-mono w-24"
                      data-testid="ticker-input"
                    />
                    <Button type="button" variant="secondary" size="icon" onClick={handleSearch}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_price">Preço (R$)</Label>
                    <Input
                      id="current_price"
                      type="number"
                      step="0.01"
                      value={formData.current_price}
                      onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                      required
                      className="bg-input border-input font-mono"
                      data-testid="price-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dividend_yield">DY (%)</Label>
                    <Input
                      id="dividend_yield"
                      type="number"
                      step="0.01"
                      value={formData.dividend_yield}
                      onChange={(e) => setFormData({ ...formData, dividend_yield: e.target.value })}
                      className="bg-input border-input font-mono"
                      data-testid="dy-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor</Label>
                    <Input
                      id="sector"
                      value={formData.sector}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      className="bg-input border-input"
                      data-testid="sector-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pe_ratio">P/L</Label>
                    <Input
                      id="pe_ratio"
                      type="number"
                      step="0.01"
                      value={formData.pe_ratio}
                      onChange={(e) => setFormData({ ...formData, pe_ratio: e.target.value })}
                      className="bg-input border-input font-mono"
                      data-testid="pe-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question">Pergunta Específica (opcional)</Label>
                  <Textarea
                    id="question"
                    placeholder="Ex: Qual o potencial de crescimento?"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="bg-input border-input resize-none"
                    rows={3}
                    data-testid="question-input"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={analyzing || !formData.ticker || !formData.current_price}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  data-testid="analyze-btn"
                >
                  {analyzing ? (
                    <div className="w-5 h-5 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analisar com IA
                    </>
                  )}
                </Button>
              </form>

              {/* History */}
              {history.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Análises Recentes
                  </h4>
                  <div className="space-y-2">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="font-mono font-semibold text-foreground">{item.ticker}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(item.generated_at).toLocaleDateString("pt-BR")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Result */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {analysis ? `Análise: ${analysis.ticker}` : "Resultado da Análise"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-4" data-testid="analysis-result">
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {analysis.analysis}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Gerado em: {new Date(analysis.generated_at).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ Esta análise é gerada por IA e não constitui recomendação de investimento.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Análise Inteligente
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Preencha os dados da ação ao lado e clique em &quot;Analisar com IA&quot; para obter insights
                    sobre o ativo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          </TabsContent>

          {/* Portfolio Analysis Tab */}
          <TabsContent value="portfolio" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Portfolio Info Card */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Análise da Carteira
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Obtenha uma análise completa da sua carteira de investimentos, incluindo:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">•</span> Diversificação setorial
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">•</span> Riscos de concentração
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">•</span> Qualidade dos ativos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">•</span> Pontos fortes e fracos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">•</span> Sugestões de otimização
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">•</span> Nota geral da carteira
                    </li>
                  </ul>

                  {stocks.length > 0 ? (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-4">
                        Sua carteira possui <span className="text-foreground font-semibold">{stocks.length}</span> lançamentos
                      </p>
                      <Button
                        onClick={handleAnalyzePortfolio}
                        disabled={analyzingPortfolio}
                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      >
                        {analyzingPortfolio ? (
                          <div className="w-5 h-5 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Analisar Minha Carteira
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-amber-500">
                        Você precisa ter ações na carteira para gerar a análise.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Portfolio Analysis Result */}
              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Resultado da Análise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolioAnalysis ? (
                    <div className="space-y-4" data-testid="portfolio-analysis-result">
                      {/* Summary Cards */}
                      {portfolioAnalysis.summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Investido</p>
                            <p className="text-lg font-semibold text-foreground">
                              {formatCurrency(portfolioAnalysis.summary.total_invested)}
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Valor Atual</p>
                            <p className="text-lg font-semibold text-foreground">
                              {formatCurrency(portfolioAnalysis.summary.total_current)}
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Proventos Recebidos</p>
                            <p className="text-lg font-semibold text-accent">
                              {formatCurrency(portfolioAnalysis.summary.proventos_received || portfolioAnalysis.summary.total_dividends || 0)}
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Proventos a Receber</p>
                            <p className="text-lg font-semibold text-purple-400">
                              {formatCurrency(portfolioAnalysis.summary.proventos_pending || 0)}
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Yield on Cost</p>
                            <p className="text-lg font-semibold text-accent">
                              {(portfolioAnalysis.summary.yield_on_cost || 0).toFixed(2)}%
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Ganho de Capital</p>
                            <p className={`text-lg font-semibold ${portfolioAnalysis.summary.total_gain_percent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              {portfolioAnalysis.summary.total_gain_percent >= 0 ? '+' : ''}{portfolioAnalysis.summary.total_gain_percent.toFixed(2)}%
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Retorno Total</p>
                            <p className={`text-lg font-semibold ${portfolioAnalysis.summary.total_return_percent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              {portfolioAnalysis.summary.total_return_percent >= 0 ? '+' : ''}{portfolioAnalysis.summary.total_return_percent.toFixed(2)}%
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Nº de Ativos</p>
                            <p className="text-lg font-semibold text-foreground">
                              {portfolioAnalysis.summary.stocks_count}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Analysis Text */}
                      <div className="prose prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                          {portfolioAnalysis.analysis}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Gerado em: {new Date(portfolioAnalysis.generated_at).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ⚠️ Esta análise é gerada por IA e não constitui recomendação de investimento.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Análise de Carteira
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Clique em &quot;Analisar Minha Carteira&quot; para obter uma análise completa
                        da sua carteira de investimentos
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
