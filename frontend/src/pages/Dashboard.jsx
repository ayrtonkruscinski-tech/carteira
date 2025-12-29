import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { TrendingUp, TrendingDown, Wallet, PieChart, Coins, BarChart3, RefreshCw, Bell } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#00E599', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [dividendSummary, setDividendSummary] = useState(null);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, stocksRes, dividendsRes, historyRes, alertsRes] = await Promise.all([
        fetch(`${API}/portfolio/summary`, { credentials: 'include' }),
        fetch(`${API}/portfolio/stocks`, { credentials: 'include' }),
        fetch(`${API}/dividends/summary`, { credentials: 'include' }),
        fetch(`${API}/portfolio/history?days=30`, { credentials: 'include' }),
        fetch(`${API}/alerts?unread_only=true`, { credentials: 'include' }),
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (stocksRes.ok) setStocks(await stocksRes.json());
      if (dividendsRes.ok) setDividendSummary(await dividendsRes.json());
      if (historyRes.ok) setPortfolioHistory(await historyRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
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

  const portfolioData = stocks.map((stock, index) => ({
    name: stock.ticker,
    value: stock.quantity * (stock.current_price || stock.average_price),
    color: COLORS[index % COLORS.length],
  }));

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
                    <p className={`text-2xl font-bold font-mono ${(summary?.gain_percent || 0) >= 0 ? 'text-primary' : 'text-destructive'}`} data-testid="gain-percent">
                      {(summary?.gain_percent || 0) >= 0 ? '+' : ''}{(summary?.gain_percent || 0).toFixed(2)}%
                    </p>
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
                  <p className="text-sm text-muted-foreground mb-1">Dividendos Totais</p>
                  <p className="text-2xl font-bold font-mono text-accent" data-testid="total-dividends">
                    {formatCurrency(summary?.total_dividends || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Evolution Chart */}
        {portfolioHistory.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Evolução Patrimonial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={portfolioHistory}>
                    <defs>
                      <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E599" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00E599" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
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
                      formatter={(value) => [formatCurrency(value), 'Patrimônio']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                    />
                    <Line
                      type="monotone"
                      dataKey="total_current"
                      stroke="#00E599"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: '#00E599' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

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
                        }}
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
          <CardHeader>
            <CardTitle>Suas Ações</CardTitle>
          </CardHeader>
          <CardContent>
            {stocks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="stocks-table">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ticker</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Qtd</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">PM</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Atual</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Teto</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => {
                      const currentPrice = stock.current_price || stock.average_price;
                      const variation = ((currentPrice / stock.average_price) - 1) * 100;
                      const atCeiling = stock.ceiling_price && currentPrice >= stock.ceiling_price;
                      return (
                        <tr key={stock.stock_id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${atCeiling ? 'bg-accent/5' : ''}`}>
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-foreground">{stock.ticker}</span>
                            {atCeiling && <span className="ml-2 text-xs text-accent">⚠️ Teto</span>}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{stock.name}</td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">{stock.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">
                            {formatCurrency(stock.average_price)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">
                            {formatCurrency(currentPrice)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {stock.ceiling_price ? formatCurrency(stock.ceiling_price) : '-'}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-medium ${variation >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {variation >= 0 ? '+' : ''}{variation.toFixed(2)}%
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
