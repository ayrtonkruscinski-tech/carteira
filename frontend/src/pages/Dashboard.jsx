import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { TrendingUp, TrendingDown, Wallet, PieChart, Coins, BarChart3, RefreshCw, Bell, ArrowUpDown } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import { toast } from "sonner";
import { usePortfolioSafe } from "../context/PortfolioContext";
import { AdBannerHorizontal } from "../components/AdBanner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#00E599', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const SORT_OPTIONS = [
  { value: 'ticker', label: 'Ticker (A-Z)' },
  { value: 'value_desc', label: 'Valor (Maior)' },
  { value: 'value_asc', label: 'Valor (Menor)' },
  { value: 'variation_desc', label: 'Variação (Maior)' },
  { value: 'variation_asc', label: 'Variação (Menor)' },
  { value: 'profitability_desc', label: 'Rentabilidade (Maior)' },
  { value: 'profitability_asc', label: 'Rentabilidade (Menor)' },
  { value: 'portfolio_percent_desc', label: '% Carteira (Maior)' },
  { value: 'portfolio_percent_asc', label: '% Carteira (Menor)' },
];

const PERIOD_OPTIONS = [
  { value: '1w', label: 'Semanal' },
  { value: '1m', label: 'Mensal' },
  { value: '12m', label: '12 Meses' },
  { value: '5y', label: '5 Anos' },
  { value: 'max', label: 'Máximo' },
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [dividendSummary, setDividendSummary] = useState(null);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [portfolioEvolution, setPortfolioEvolution] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('ticker');
  const [stockDividends, setStockDividends] = useState({});
  const [evolutionPeriod, setEvolutionPeriod] = useState('1m');
  const [chartVisibility, setChartVisibility] = useState({
    invested: true,
    current: true,
    total: true,
  });

  // Get current portfolio
  const portfolioContext = usePortfolioSafe();
  const currentPortfolio = portfolioContext?.currentPortfolio;
  const portfolioLoading = portfolioContext?.loading;

  useEffect(() => {
    if (!portfolioLoading) {
      fetchData();
    }
  }, [currentPortfolio?.portfolio_id, portfolioLoading]);

  useEffect(() => {
    if (!portfolioLoading) {
      fetchEvolution();
    }
  }, [evolutionPeriod, currentPortfolio?.portfolio_id, portfolioLoading]);

  const fetchEvolution = async () => {
    try {
      const portfolioParam = currentPortfolio?.portfolio_id ? `&portfolio_id=${currentPortfolio.portfolio_id}` : "";
      const response = await fetch(`${API}/portfolio/evolution?period=${evolutionPeriod}${portfolioParam}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPortfolioEvolution(data);
      }
    } catch (error) {
      console.error('Error fetching evolution:', error);
    }
  };

  const fetchData = async () => {
    try {
      const portfolioParam = currentPortfolio?.portfolio_id ? `?portfolio_id=${currentPortfolio.portfolio_id}` : "";
      const portfolioParamAnd = currentPortfolio?.portfolio_id ? `&portfolio_id=${currentPortfolio.portfolio_id}` : "";
      const [summaryRes, stocksRes, dividendsRes, historyRes, alertsRes, allDividendsRes, evolutionRes] = await Promise.all([
        fetch(`${API}/portfolio/summary${portfolioParam}`, { credentials: 'include' }),
        fetch(`${API}/portfolio/stocks${portfolioParam}`, { credentials: 'include' }),
        fetch(`${API}/dividends/summary${portfolioParam}`, { credentials: 'include' }),
        fetch(`${API}/portfolio/history?days=30${portfolioParamAnd}`, { credentials: 'include' }),
        fetch(`${API}/alerts?unread_only=true`, { credentials: 'include' }),
        fetch(`${API}/dividends${portfolioParam}`, { credentials: 'include' }),
        fetch(`${API}/portfolio/evolution?period=${evolutionPeriod}${portfolioParamAnd}`, { credentials: 'include' }),
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (stocksRes.ok) setStocks(await stocksRes.json());
      if (dividendsRes.ok) setDividendSummary(await dividendsRes.json());
      if (historyRes.ok) setPortfolioHistory(await historyRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (evolutionRes.ok) setPortfolioEvolution(await evolutionRes.json());
      
      // Calculate dividends per stock (received and pending)
      if (allDividendsRes.ok) {
        const dividends = await allDividendsRes.json();
        const today = new Date().toISOString().split('T')[0];
        const divByTicker = {};
        dividends.forEach(d => {
          if (!divByTicker[d.ticker]) {
            divByTicker[d.ticker] = { received: 0, pending: 0 };
          }
          if (d.payment_date <= today) {
            divByTicker[d.ticker].received += d.amount;
          } else {
            divByTicker[d.ticker].pending += d.amount;
          }
        });
        setStockDividends(divByTicker);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API}/portfolio/refresh-prices`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(`Preços atualizados: ${data.updated}/${data.total} ações`);
        if (data.alerts_created > 0) {
          toast.info(`${data.alerts_created} alerta(s) de preço teto criado(s)!`);
        }
        fetchData();
      }
    } catch (error) {
      toast.error('Erro ao atualizar preços');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      await fetch(`${API}/alerts/${alertId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      setAlerts(alerts.filter(a => a.alert_id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  // Group stocks by ticker for dashboard display
  const groupedStocks = Object.values(
    stocks.reduce((acc, stock) => {
      const ticker = stock.ticker;
      if (!acc[ticker]) {
        acc[ticker] = {
          ticker,
          name: stock.name,
          quantity: 0,
          totalInvested: 0,
          current_price: stock.current_price,
          ceiling_price: stock.ceiling_price,
          sector: stock.sector,
          stock_id: stock.stock_id, // Keep first stock_id for reference
        };
      }
      acc[ticker].quantity += stock.quantity;
      acc[ticker].totalInvested += stock.quantity * stock.average_price;
      // Update current_price if this entry has one
      if (stock.current_price) {
        acc[ticker].current_price = stock.current_price;
      }
      return acc;
    }, {})
  ).map(stock => ({
    ...stock,
    // Calculate weighted average price
    average_price: stock.totalInvested / stock.quantity,
  }));

  const portfolioData = groupedStocks.map((stock, index) => ({
    name: stock.ticker,
    value: stock.quantity * (stock.current_price || stock.average_price),
    color: COLORS[index % COLORS.length],
  }));

  // Calculate total portfolio value for percentage calculations
  const totalPortfolioValue = groupedStocks.reduce((sum, stock) => {
    return sum + stock.quantity * (stock.current_price || stock.average_price);
  }, 0);

  // Enrich grouped stocks with calculated metrics
  const enrichedStocks = groupedStocks.map(stock => {
    const currentPrice = stock.current_price || stock.average_price;
    const investedValue = stock.quantity * stock.average_price;
    const currentValue = stock.quantity * currentPrice;
    const variation = ((currentPrice / stock.average_price) - 1) * 100;
    const gain = currentValue - investedValue;
    const stockDividendData = stockDividends[stock.ticker] || { received: 0, pending: 0 };
    const dividendsReceived = stockDividendData.received || 0;
    const dividendsPending = stockDividendData.pending || 0;
    const totalDividends = dividendsReceived + dividendsPending;
    const totalReturn = gain + dividendsReceived;
    const profitability = investedValue > 0 ? (totalReturn / investedValue) * 100 : 0;
    const portfolioPercent = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;

    return {
      ...stock,
      currentPrice,
      investedValue,
      currentValue,
      variation,
      gain,
      dividendsReceived,
      dividendsPending,
      totalDividends,
      totalReturn,
      profitability,
      portfolioPercent,
    };
  });

  // Sort stocks based on selected criteria
  const sortedStocks = [...enrichedStocks].sort((a, b) => {
    switch (sortBy) {
      case 'ticker':
        return a.ticker.localeCompare(b.ticker);
      case 'value_desc':
        return b.currentValue - a.currentValue;
      case 'value_asc':
        return a.currentValue - b.currentValue;
      case 'variation_desc':
        return b.variation - a.variation;
      case 'variation_asc':
        return a.variation - b.variation;
      case 'profitability_desc':
        return b.profitability - a.profitability;
      case 'profitability_asc':
        return a.profitability - b.profitability;
      case 'portfolio_percent_desc':
        return b.portfolioPercent - a.portfolioPercent;
      case 'portfolio_percent_asc':
        return a.portfolioPercent - b.portfolioPercent;
      default:
        return 0;
    }
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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
      <div data-testid="dashboard" className="space-y-8 animate-fade-in">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.alert_id}
                className="flex items-center justify-between p-4 bg-accent/10 border border-accent/30 rounded-lg"
                data-testid={`alert-${alert.alert_id}`}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismissAlert(alert.alert_id)}
                >
                  Dispensar
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral da sua carteira de investimentos</p>
          </div>
          <Button
            onClick={handleRefreshPrices}
            disabled={refreshing}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            data-testid="refresh-prices-btn"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar Preços'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patrimônio Total</p>
                  <p className="text-2xl font-bold font-mono text-foreground" data-testid="total-value">
                    {formatCurrency(summary?.total_current || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rentabilidade</p>
                  <div className="flex items-center gap-2">
                    <TooltipUI>
                      <TooltipTrigger asChild>
                        <p className={`text-2xl font-bold font-mono cursor-help ${(summary?.gain_percent || 0) >= 0 ? 'text-primary' : 'text-destructive'}`} data-testid="gain-percent">
                          {(summary?.gain_percent || 0) >= 0 ? '+' : ''}{(summary?.gain_percent || 0).toFixed(2)}%
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-sm">
                          {(summary?.total_gain || 0) >= 0 ? '+' : ''}{formatCurrency(summary?.total_gain || 0)}
                        </p>
                      </TooltipContent>
                    </TooltipUI>
                    {(summary?.gain_percent || 0) >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-primary" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lucro/Prejuízo</p>
                  <p className={`text-2xl font-bold font-mono ${(summary?.total_gain || 0) >= 0 ? 'text-primary' : 'text-destructive'}`} data-testid="total-gain">
                    {formatCurrency(summary?.total_gain || 0)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${(summary?.total_gain || 0) >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                  {(summary?.total_gain || 0) >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-primary" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dividendos Recebidos</p>
                  <TooltipUI>
                    <TooltipTrigger asChild>
                      <p className="text-2xl font-bold font-mono text-accent cursor-help" data-testid="total-dividends">
                        {formatCurrency(summary?.total_dividends || 0)}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Recebido:</span>
                          <span className="font-mono text-accent">{formatCurrency(summary?.total_dividends || 0)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">A Receber:</span>
                          <span className="font-mono text-blue-400">{formatCurrency(summary?.total_dividends_pending || 0)}</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between gap-4">
                          <span className="text-muted-foreground font-medium">Total:</span>
                          <span className="font-mono font-bold">{formatCurrency((summary?.total_dividends || 0) + (summary?.total_dividends_pending || 0))}</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </TooltipUI>
                  {summary?.total_dividends_pending > 0 && (
                    <p className="text-xs text-blue-400 mt-1">
                      + {formatCurrency(summary.total_dividends_pending)} a receber
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ad Banner */}
        <AdBannerHorizontal />

        {/* Portfolio Evolution Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Evolução Patrimonial
            </CardTitle>
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={evolutionPeriod === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEvolutionPeriod(option.value)}
                  className={evolutionPeriod === option.value 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground"
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {portfolioEvolution.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioEvolution}>
                    <defs>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E599" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00E599" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return evolutionPeriod === '1w' || evolutionPeriod === '1m' 
                          ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                          : date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                      }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value >= 1000 ? `R$${(value/1000).toFixed(0)}k` : `R$${value.toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#121417',
                        border: '1px solid #1E293B',
                        borderRadius: '8px',
                        color: '#E2E8F0',
                      }}
                      labelStyle={{ color: '#94A3B8' }}
                      formatter={(value, name) => {
                        const labels = {
                          invested: 'Investido',
                          current: 'Valor Atual',
                          dividends: 'Dividendos',
                          total: 'Total (Valor + Div)',
                        };
                        return [formatCurrency(value), labels[name] || name];
                      }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#colorInvested)"
                      dot={false}
                      hide={!chartVisibility.invested}
                    />
                    <Area
                      type="monotone"
                      dataKey="current"
                      stroke="#00E599"
                      strokeWidth={2}
                      fill="url(#colorCurrent)"
                      dot={false}
                      hide={!chartVisibility.current}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fill="url(#colorTotal)"
                      dot={false}
                      hide={!chartVisibility.total}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado de evolução disponível</p>
              </div>
            )}
            {portfolioEvolution.length > 0 && (
              <div className="flex justify-center gap-4 mt-4 text-sm">
                <button
                  onClick={() => setChartVisibility(prev => ({ ...prev, invested: !prev.invested }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    chartVisibility.invested 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-muted bg-muted/20 opacity-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${chartVisibility.invested ? 'bg-blue-500' : 'bg-muted'}`}></div>
                  <span className={chartVisibility.invested ? 'text-blue-400' : 'text-muted-foreground line-through'}>Investido</span>
                </button>
                <button
                  onClick={() => setChartVisibility(prev => ({ ...prev, current: !prev.current }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    chartVisibility.current 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted bg-muted/20 opacity-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${chartVisibility.current ? 'bg-primary' : 'bg-muted'}`}></div>
                  <span className={chartVisibility.current ? 'text-primary' : 'text-muted-foreground line-through'}>Valor Atual</span>
                </button>
                <button
                  onClick={() => setChartVisibility(prev => ({ ...prev, total: !prev.total }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    chartVisibility.total 
                      ? 'border-amber-500 bg-amber-500/10' 
                      : 'border-muted bg-muted/20 opacity-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${chartVisibility.total ? 'bg-amber-500' : 'bg-muted'}`}></div>
                  <span className={chartVisibility.total ? 'text-amber-400' : 'text-muted-foreground line-through'}>Total (c/ Dividendos)</span>
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ad Banner */}
        <AdBannerHorizontal />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Distribuição da Carteira
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stocks.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#121417',
                          border: '1px solid #1E293B',
                          borderRadius: '8px',
                          color: '#E2E8F0',
                        }}
                        labelStyle={{ color: '#94A3B8' }}
                        itemStyle={{ color: '#E2E8F0' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Adicione ações à sua carteira para ver a distribuição
                </div>
              )}
              {stocks.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {portfolioData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dividends Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-accent" />
                Dividendos por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dividendSummary?.by_month?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dividendSummary.by_month}>
                      <defs>
                        <linearGradient id="colorDividend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        stroke="#94A3B8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `R$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#121417',
                          border: '1px solid #1E293B',
                          borderRadius: '8px',
                          color: '#E2E8F0',
                        }}
                        labelStyle={{ color: '#94A3B8' }}
                        itemStyle={{ color: '#E2E8F0' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#F59E0B"
                        fillOpacity={1}
                        fill="url(#colorDividend)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Registre dividendos para ver o histórico
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stocks Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Suas Ações</CardTitle>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-input border-input">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {sortedStocks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="stocks-table">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ticker</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Qtd</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">PM</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Atual</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Variação</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Dividendos</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Rentab.</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">% Cart.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStocks.map((stock) => {
                      const atCeiling = stock.ceiling_price && stock.currentPrice >= stock.ceiling_price;
                      return (
                        <tr key={stock.stock_id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${atCeiling ? 'bg-accent/5' : ''}`}>
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-foreground">{stock.ticker}</span>
                            {atCeiling && <span className="ml-2 text-xs text-accent">⚠️</span>}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">{stock.quantity.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">
                            {formatCurrency(stock.average_price)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">
                            {formatCurrency(stock.currentPrice)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">
                            {formatCurrency(stock.currentValue)}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-medium ${stock.variation >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            <TooltipProvider>
                              <TooltipUI>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help border-b border-dashed border-current">
                                    {stock.variation >= 0 ? '+' : ''}{stock.variation.toFixed(2)}%
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-mono">
                                    {stock.gain >= 0 ? '+' : ''}{formatCurrency(stock.gain)}
                                  </p>
                                </TooltipContent>
                              </TooltipUI>
                            </TooltipProvider>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-accent">
                            <TooltipProvider>
                              <TooltipUI>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help border-b border-dashed border-accent">
                                    {formatCurrency(stock.dividendsReceived)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="p-3">
                                  <div className="space-y-2">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground">Recebido:</span>
                                      <span className="font-mono text-accent">{formatCurrency(stock.dividendsReceived)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground">A Receber:</span>
                                      <span className="font-mono text-blue-400">{formatCurrency(stock.dividendsPending)}</span>
                                    </div>
                                    <div className="border-t border-border pt-2 flex justify-between gap-4">
                                      <span className="text-muted-foreground font-medium">Total:</span>
                                      <span className="font-mono font-bold">{formatCurrency(stock.totalDividends)}</span>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </TooltipUI>
                            </TooltipProvider>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-medium ${stock.profitability >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            <TooltipProvider>
                              <TooltipUI>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help border-b border-dashed border-current">
                                    {stock.profitability >= 0 ? '+' : ''}{stock.profitability.toFixed(2)}%
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-mono">
                                    {stock.totalReturn >= 0 ? '+' : ''}{formatCurrency(stock.totalReturn)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    (Ganho + Dividendos)
                                  </p>
                                </TooltipContent>
                              </TooltipUI>
                            </TooltipProvider>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {stock.portfolioPercent.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Você ainda não tem ações na carteira</p>
                <p className="text-sm mt-2">Vá para a página Carteira para adicionar suas ações</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
