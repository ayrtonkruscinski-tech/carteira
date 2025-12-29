import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Plus, Coins, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#00E599', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const DIVIDEND_TYPES = [
  { value: "dividendo", label: "Dividendo" },
  { value: "jcp", label: "JCP (Juros sobre Capital Próprio)" },
  { value: "rendimento", label: "Rendimento" },
];

export default function Dividends() {
  const [dividends, setDividends] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    stock_id: "",
    ticker: "",
    amount: "",
    payment_date: "",
    type: "dividendo",
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dividendsRes, stocksRes, summaryRes] = await Promise.all([
        fetch(`${API}/dividends`, { credentials: "include" }),
        fetch(`${API}/portfolio/stocks`, { credentials: "include" }),
        fetch(`${API}/dividends/summary`, { credentials: "include" }),
      ]);

      if (dividendsRes.ok) setDividends(await dividendsRes.json());
      if (stocksRes.ok) setStocks(await stocksRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/dividends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          stock_id: formData.stock_id,
          ticker: formData.ticker,
          amount: parseFloat(formData.amount),
          payment_date: formData.payment_date,
          type: formData.type,
        }),
      });

      if (response.ok) {
        toast.success("Dividendo registrado com sucesso!");
        fetchData();
        resetForm();
      }
    } catch (error) {
      toast.error("Erro ao registrar dividendo");
      console.error("Error saving dividend:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      stock_id: "",
      ticker: "",
      amount: "",
      payment_date: "",
      type: "dividendo",
    });
    setIsAddDialogOpen(false);
  };

  const handleStockSelect = (stockId) => {
    const stock = stocks.find((s) => s.stock_id === stockId);
    if (stock) {
      setFormData({
        ...formData,
        stock_id: stockId,
        ticker: stock.ticker,
      });
    }
  };

  const handleSyncDividends = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${API}/dividends/sync`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.synced > 0) {
          toast.success(`${result.synced} dividendos sincronizados!`);
        } else if (result.skipped > 0) {
          toast.info("Todos os dividendos já estão sincronizados.");
        } else {
          toast.info("Nenhum dividendo encontrado para sincronizar.");
        }
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Erro ao sincronizar dividendos");
      }
    } catch (error) {
      console.error("Error syncing dividends:", error);
      toast.error("Erro ao sincronizar dividendos");
    } finally {
      setSyncing(false);
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
      <div data-testid="dividends-page" className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dividendos</h1>
            <p className="text-muted-foreground">Acompanhe seus proventos recebidos</p>
          </div>
          <div className="flex gap-2">
            <Button
              data-testid="sync-dividends-btn"
              variant="outline"
              onClick={handleSyncDividends}
              disabled={syncing || stocks.length === 0}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="add-dividend-btn"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Dividendo
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">Registrar Dividendo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Ação</Label>
                  <Select
                    value={formData.stock_id}
                    onValueChange={handleStockSelect}
                  >
                    <SelectTrigger className="bg-input border-input" data-testid="stock-select">
                      <SelectValue placeholder="Selecione a ação" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {stocks.map((stock) => (
                        <SelectItem key={stock.stock_id} value={stock.stock_id}>
                          {stock.ticker} - {stock.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="bg-input border-input font-mono"
                      data-testid="amount-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_date">Data Pagamento</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      required
                      className="bg-input border-input"
                      data-testid="date-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="bg-input border-input" data-testid="type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {DIVIDEND_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    data-testid="save-dividend-btn"
                  >
                    Registrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Recebido</p>
                  <p className="text-2xl font-bold font-mono text-accent" data-testid="total-dividends">
                    {formatCurrency(summary?.total || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Registros</p>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {dividends.length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Média Mensal</p>
                  <p className="text-2xl font-bold font-mono text-primary">
                    {formatCurrency(
                      summary?.by_month?.length > 0
                        ? summary.total / summary.by_month.length
                        : 0
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Dividendos por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.by_month?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.by_month}>
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
                          backgroundColor: "#121417",
                          border: "1px solid #1E293B",
                          borderRadius: "8px",
                          color: "#E2E8F0",
                        }}
                        labelStyle={{ color: "#94A3B8" }}
                        itemStyle={{ color: "#E2E8F0" }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Bar dataKey="amount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Registre dividendos para ver o gráfico
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Ticker Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Dividendos por Ação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.by_ticker?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.by_ticker}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="amount"
                        nameKey="ticker"
                      >
                        {summary.by_ticker.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#121417",
                          border: "1px solid #1E293B",
                          borderRadius: "8px",
                          color: "#E2E8F0",
                        }}
                        labelStyle={{ color: "#94A3B8" }}
                        itemStyle={{ color: "#E2E8F0" }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Registre dividendos para ver o gráfico
                </div>
              )}
              {summary?.by_ticker?.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {summary.by_ticker.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.ticker}: {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dividends List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Histórico de Dividendos</CardTitle>
          </CardHeader>
          <CardContent>
            {dividends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="dividends-table">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ticker</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dividends
                      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
                      .map((dividend) => (
                        <tr
                          key={dividend.dividend_id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-foreground">
                            {new Date(dividend.payment_date).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-foreground">
                              {dividend.ticker}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                              {dividend.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-accent">
                            {formatCurrency(dividend.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dividendo registrado</p>
                <p className="text-sm mt-2">Clique em "Registrar Dividendo" para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
