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
import { Plus, Trash2, Edit2, Search, Briefcase } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SECTORS = [
  "Bancos",
  "Energia",
  "Petróleo",
  "Mineração",
  "Varejo",
  "Seguros",
  "Bens Industriais",
  "Consumo",
  "Saúde",
  "Tecnologia",
  "Telecomunicações",
  "Outros",
];

export default function Portfolio() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [searchTicker, setSearchTicker] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [formData, setFormData] = useState({
    ticker: "",
    name: "",
    quantity: "",
    average_price: "",
    current_price: "",
    dividend_yield: "",
    sector: "",
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

  const handleSearch = async () => {
    if (!searchTicker) return;
    try {
      const response = await fetch(`${API}/stocks/search/${searchTicker}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResult(data);
        setFormData({
          ticker: data.ticker || "",
          name: data.name || "",
          quantity: "",
          average_price: "",
          current_price: data.current_price?.toString() || "",
          dividend_yield: data.dividend_yield?.toString() || "",
          sector: data.sector || "",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ticker: formData.ticker,
      name: formData.name,
      quantity: parseFloat(formData.quantity),
      average_price: parseFloat(formData.average_price),
      current_price: formData.current_price ? parseFloat(formData.current_price) : null,
      dividend_yield: formData.dividend_yield ? parseFloat(formData.dividend_yield) : null,
      sector: formData.sector || null,
    };

    try {
      if (editingStock) {
        const response = await fetch(
          `${API}/portfolio/stocks/${editingStock.stock_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              quantity: payload.quantity,
              average_price: payload.average_price,
              current_price: payload.current_price,
              dividend_yield: payload.dividend_yield,
            }),
          }
        );
        if (response.ok) {
          toast.success("Ação atualizada com sucesso!");
          fetchStocks();
        }
      } else {
        const response = await fetch(`${API}/portfolio/stocks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          toast.success("Ação adicionada com sucesso!");
          fetchStocks();
        }
      }
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar ação");
      console.error("Error saving stock:", error);
    }
  };

  const handleDelete = async (stockId) => {
    if (!window.confirm("Tem certeza que deseja remover esta ação?")) return;

    try {
      const response = await fetch(`${API}/portfolio/stocks/${stockId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("Ação removida com sucesso!");
        fetchStocks();
      }
    } catch (error) {
      toast.error("Erro ao remover ação");
      console.error("Error deleting stock:", error);
    }
  };

  const handleEdit = (stock) => {
    setEditingStock(stock);
    setFormData({
      ticker: stock.ticker,
      name: stock.name,
      quantity: stock.quantity.toString(),
      average_price: stock.average_price.toString(),
      current_price: stock.current_price?.toString() || "",
      dividend_yield: stock.dividend_yield?.toString() || "",
      sector: stock.sector || "",
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      ticker: "",
      name: "",
      quantity: "",
      average_price: "",
      current_price: "",
      dividend_yield: "",
      sector: "",
    });
    setEditingStock(null);
    setSearchResult(null);
    setSearchTicker("");
    setIsAddDialogOpen(false);
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
      <div data-testid="portfolio-page" className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Minha Carteira</h1>
            <p className="text-muted-foreground">Gerencie suas ações e investimentos</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsAddDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-stock-btn"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,229,153,0.3)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Ação
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingStock ? "Editar Ação" : "Adicionar Ação"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingStock && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar ticker (ex: PETR4)"
                      value={searchTicker}
                      onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                      className="bg-input border-input"
                      data-testid="search-ticker-input"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSearch}
                      data-testid="search-ticker-btn"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticker">Ticker</Label>
                    <Input
                      id="ticker"
                      value={formData.ticker}
                      onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                      required
                      disabled={editingStock}
                      className="bg-input border-input font-mono"
                      data-testid="ticker-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={editingStock}
                      className="bg-input border-input"
                      data-testid="name-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      className="bg-input border-input font-mono"
                      data-testid="quantity-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="average_price">Preço Médio (R$)</Label>
                    <Input
                      id="average_price"
                      type="number"
                      step="0.01"
                      value={formData.average_price}
                      onChange={(e) => setFormData({ ...formData, average_price: e.target.value })}
                      required
                      className="bg-input border-input font-mono"
                      data-testid="average-price-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_price">Preço Atual (R$)</Label>
                    <Input
                      id="current_price"
                      type="number"
                      step="0.01"
                      value={formData.current_price}
                      onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                      className="bg-input border-input font-mono"
                      data-testid="current-price-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dividend_yield">Dividend Yield (%)</Label>
                    <Input
                      id="dividend_yield"
                      type="number"
                      step="0.01"
                      value={formData.dividend_yield}
                      onChange={(e) => setFormData({ ...formData, dividend_yield: e.target.value })}
                      className="bg-input border-input font-mono"
                      data-testid="dividend-yield-input"
                    />
                  </div>
                </div>

                {!editingStock && (
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor</Label>
                    <Select
                      value={formData.sector}
                      onValueChange={(value) => setFormData({ ...formData, sector: value })}
                    >
                      <SelectTrigger className="bg-input border-input" data-testid="sector-select">
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {SECTORS.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="save-stock-btn"
                  >
                    {editingStock ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stocks Grid */}
        {stocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks.map((stock) => {
              const currentPrice = stock.current_price || stock.average_price;
              const totalValue = stock.quantity * currentPrice;
              const totalInvested = stock.quantity * stock.average_price;
              const gain = totalValue - totalInvested;
              const gainPercent = ((currentPrice / stock.average_price) - 1) * 100;

              return (
                <Card
                  key={stock.stock_id}
                  className="bg-card border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                  data-testid={`stock-card-${stock.ticker}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-mono text-xl text-foreground">
                          {stock.ticker}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{stock.name}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(stock)}
                          data-testid={`edit-stock-${stock.ticker}`}
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(stock.stock_id)}
                          data-testid={`delete-stock-${stock.ticker}`}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Quantidade</span>
                        <span className="font-mono text-foreground">{stock.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Preço Médio</span>
                        <span className="font-mono text-foreground">
                          {formatCurrency(stock.average_price)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Preço Atual</span>
                        <span className="font-mono text-foreground">
                          {formatCurrency(currentPrice)}
                        </span>
                      </div>
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Valor Total</span>
                          <span className="font-mono font-semibold text-foreground">
                            {formatCurrency(totalValue)}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-muted-foreground">Rentabilidade</span>
                          <span
                            className={`font-mono font-semibold ${
                              gainPercent >= 0 ? "text-primary" : "text-destructive"
                            }`}
                          >
                            {gainPercent >= 0 ? "+" : ""}
                            {gainPercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      {stock.sector && (
                        <div className="pt-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            {stock.sector}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sua carteira está vazia
              </h3>
              <p className="text-muted-foreground mb-6">
                Comece adicionando suas primeiras ações
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="add-first-stock-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Ação
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
