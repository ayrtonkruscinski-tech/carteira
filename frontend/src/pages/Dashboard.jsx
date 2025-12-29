import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PieChart, Coins, BarChart3 } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#00E599', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [dividendSummary, setDividendSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, stocksRes, dividendsRes] = await Promise.all([
        fetch(`${API}/portfolio/summary`, { credentials: 'include' }),
        fetch(`${API}/portfolio/stocks`, { credentials: 'include' }),
        fetch(`${API}/dividends/summary`, { credentials: 'include' }),
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (stocksRes.ok) setStocks(await stocksRes.json());
      if (dividendsRes.ok) setDividendSummary(await dividendsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua carteira de investimentos</p>
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
                        }}
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
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => {
                      const currentPrice = stock.current_price || stock.average_price;
                      const variation = ((currentPrice / stock.average_price) - 1) * 100;
                      return (
                        <tr key={stock.stock_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-foreground">{stock.ticker}</span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{stock.name}</td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">{stock.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">
                            {formatCurrency(stock.average_price)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">
                            {formatCurrency(currentPrice)}
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
