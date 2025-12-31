import { useState, useEffect, useRef } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Plus, Trash2, Edit2, Search, Briefcase, Upload, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { usePortfolioSafe } from "../context/PortfolioContext";
import { AdBannerHorizontal } from "../components/AdBanner";

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
  "Papel e Celulose",
  "Alimentos",
  "Bebidas",
  "Outros",
];

export default function Portfolio() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [searchTicker, setSearchTicker] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    ticker: "",
    name: "",
    quantity: "",
    average_price: "",
    purchase_date: "",
    current_price: "",
    dividend_yield: "",
    sector: "",
    ceiling_price: "",
  });

  // Get current portfolio
  const portfolioContext = usePortfolioSafe();
  const currentPortfolio = portfolioContext?.currentPortfolio;
  const portfolioLoading = portfolioContext?.loading;

  useEffect(() => {
    if (!portfolioLoading) {
      fetchStocks();
    }
  }, [currentPortfolio?.portfolio_id, portfolioLoading]);

  const fetchStocks = async () => {
    try {
      const portfolioParam = currentPortfolio?.portfolio_id ? `?portfolio_id=${currentPortfolio.portfolio_id}` : "";
      const response = await fetch(`${API}/portfolio/stocks${portfolioParam}`, {
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
          purchase_date: "",
          current_price: data.current_price?.toString() || "",
          dividend_yield: data.dividend_yield?.toString() || "",
          sector: data.sector || "",
          ceiling_price: "",
        });
        if (data.source === "alpha_vantage") {
          toast.success(`Cotação em tempo real: R$ ${data.current_price?.toFixed(2)}`);
        }
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
      purchase_date: formData.purchase_date || null,
      current_price: formData.current_price ? parseFloat(formData.current_price) : null,
      dividend_yield: formData.dividend_yield ? parseFloat(formData.dividend_yield) : null,
      sector: formData.sector || null,
      ceiling_price: formData.ceiling_price ? parseFloat(formData.ceiling_price) : null,
      portfolio_id: currentPortfolio?.portfolio_id || null,
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
              purchase_date: payload.purchase_date,
              current_price: payload.current_price,
              dividend_yield: payload.dividend_yield,
              ceiling_price: payload.ceiling_price,
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
    try {
      const response = await fetch(`${API}/portfolio/stocks/${stockId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("Ação removida com sucesso!");
        fetchStocks();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Erro ao remover ação");
      }
    } catch (error) {
      toast.error("Erro ao remover ação");
      console.error("Error deleting stock:", error);
    } finally {
      setDeleteDialogOpen(false);
      setStockToDelete(null);
    }
  };

  const confirmDelete = (stock) => {
    setStockToDelete(stock);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAllStocks = async () => {
    setDeletingAll(true);
    try {
      const response = await fetch(`${API}/portfolio/stocks/all`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || "Todas as ações foram excluídas!");
        fetchStocks();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Erro ao excluir ações");
      }
    } catch (error) {
      console.error("Error deleting all stocks:", error);
      toast.error("Erro ao excluir ações");
    } finally {
      setDeletingAll(false);
      setDeleteAllDialogOpen(false);
    }
  };

  const handleEdit = (stock) => {
    setEditingStock(stock);
    setFormData({
      ticker: stock.ticker,
      name: stock.name,
      quantity: stock.quantity.toString(),
      average_price: stock.average_price.toString(),
      purchase_date: stock.purchase_date || "",
      current_price: stock.current_price?.toString() || "",
      dividend_yield: stock.dividend_yield?.toString() || "",
      sector: stock.sector || "",
      ceiling_price: stock.ceiling_price?.toString() || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleImportCSV = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar extensão
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExt)) {
      toast.error('Por favor, selecione um arquivo CSV ou Excel (.xlsx)');
      return;
    }

    setImporting(true);
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    if (currentPortfolio?.portfolio_id) {
      formDataObj.append('portfolio_id', currentPortfolio.portfolio_id);
    }

    try {
      const response = await fetch(`${API}/portfolio/import`, {
        method: 'POST',
        credentials: 'include',
        body: formDataObj,
      });

      const data = await response.json().catch(() => null);
      
      if (response.ok && data) {
        toast.success(data.message || 'Importação concluída!');
        fetchStocks();
        setIsImportDialogOpen(false);
      } else if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else {
        toast.error(data?.detail || `Erro ao importar arquivo (${response.status})`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro de conexão ao importar arquivo');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API}/portfolio/export/csv`, {
        credentials: 'include',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Carteira exportada com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao exportar carteira');
      console.error('Export error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      ticker: "",
      name: "",
      quantity: "",
      average_price: "",
      purchase_date: "",
      current_price: "",
      dividend_yield: "",
      sector: "",
      ceiling_price: "",
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

  // Agrupar ações por ticker para exibição consolidada
  // Agrupar por ticker + data de compra
  // Mesma data = agrupa no mesmo card
  // Datas diferentes = cards separados
  const groupedStocks = stocks.reduce((acc, stock) => {
    // Chave de agrupamento: ticker + data
    const key = `${stock.ticker}_${stock.purchase_date || 'sem_data'}`;
    const existing = acc.find(s => `${s.ticker}_${s.purchase_date || 'sem_data'}` === key);
    
    if (existing) {
      // Mesmo ticker + mesma data: agrupa (calcula preço médio ponderado)
      const totalQuantity = existing.quantity + stock.quantity;
      const newAveragePrice = (
        (existing.quantity * existing.average_price) + 
        (stock.quantity * stock.average_price)
      ) / totalQuantity;
      
      existing.quantity = totalQuantity;
      existing.average_price = newAveragePrice;
      if (stock.current_price) {
        existing.current_price = stock.current_price;
      }
      existing.stock_ids = [...(existing.stock_ids || [existing.stock_id]), stock.stock_id];
    } else {
      // Ticker diferente OU data diferente: novo card
      acc.push({
        ...stock,
        stock_ids: [stock.stock_id]
      });
    }
    return acc;
  }, []);

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
          <div className="flex gap-2 flex-wrap">
            {/* Import Button */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="import-btn">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Importar Carteira</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Importe sua carteira a partir de um arquivo CSV ou Excel:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Extrato CEI/B3 (CSV ou XLSX)</li>
                    <li>Planilha Excel (.xlsx)</li>
                    <li>CSV genérico (ticker, quantidade, preco)</li>
                  </ul>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleImportCSV}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-primary hover:underline"
                    >
                      {importing ? 'Importando...' : 'Clique para selecionar arquivo (CSV ou Excel)'}
                    </label>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Export Button */}
            <Button variant="outline" onClick={handleExportCSV} data-testid="export-btn">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>

            {/* Delete All Button */}
            <Button
              variant="outline"
              onClick={() => setDeleteAllDialogOpen(true)}
              disabled={deletingAll || stocks.length === 0}
              className="border-destructive text-destructive hover:bg-destructive/10"
              data-testid="delete-all-stocks-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Todas
            </Button>

            {/* Add Stock Button */}
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
              <DialogContent className="bg-card border-border max-w-lg">
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
                      <Label htmlFor="purchase_date">Data de Compra</Label>
                      <Input
                        id="purchase_date"
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                        className="bg-input border-input"
                        data-testid="purchase-date-input"
                      />
                    </div>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="ceiling_price">Preço Teto (R$)</Label>
                      <Input
                        id="ceiling_price"
                        type="number"
                        step="0.01"
                        value={formData.ceiling_price}
                        onChange={(e) => setFormData({ ...formData, ceiling_price: e.target.value })}
                        className="bg-input border-input font-mono"
                        placeholder="Opcional"
                        data-testid="ceiling-price-input"
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
        </div>

        {/* Ad Banner */}
        <AdBannerHorizontal />

        {/* Stocks Grid */}
        {groupedStocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedStocks.map((stock) => {
              const currentPrice = stock.current_price || stock.average_price;
              const totalValue = stock.quantity * currentPrice;
              const totalInvested = stock.quantity * stock.average_price;
              const gain = totalValue - totalInvested;
              const gainPercent = ((currentPrice / stock.average_price) - 1) * 100;
              const atCeiling = stock.ceiling_price && currentPrice >= stock.ceiling_price;
              const hasMultipleEntries = stock.entries && stock.entries.length > 1;

              return (
                <Card
                  key={stock.stock_id}
                  className={`bg-card border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 ${atCeiling ? 'border-accent/50' : ''}`}
                  data-testid={`stock-card-${stock.ticker}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-mono text-xl text-foreground flex items-center gap-2">
                          {stock.ticker}
                          {atCeiling && <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Teto!</span>}
                          {hasMultipleEntries && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                              {stock.entries.length} lotes
                            </span>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{stock.name}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(stock)}
                          data-testid={`edit-stock-${stock.ticker}`}
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(stock)}
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
                        <span className="text-sm text-muted-foreground">Quantidade Total</span>
                        <span className="font-mono text-foreground">{stock.quantity.toFixed(0)}</span>
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
                      {stock.ceiling_price && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Preço Teto</span>
                          <span className="font-mono text-accent">
                            {formatCurrency(stock.ceiling_price)}
                          </span>
                        </div>
                      )}
                      {/* Mostrar lançamentos individuais se houver múltiplos */}
                      {hasMultipleEntries && (
                        <div className="border-t border-border pt-2 mt-2">
                          <p className="text-xs text-muted-foreground mb-2">Lançamentos:</p>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {stock.entries.map((entry, idx) => {
                              // Format date without timezone issues
                              const formatDateBR = (dateStr) => {
                                if (!dateStr) return "";
                                const parts = dateStr.split("-");
                                if (parts.length === 3) {
                                  return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                }
                                return dateStr;
                              };
                              return (
                                <div key={entry.stock_id} className="text-xs flex justify-between text-muted-foreground">
                                  <span>{entry.quantity} × {formatCurrency(entry.average_price)}</span>
                                  {entry.purchase_date && (
                                    <span>{formatDateBR(entry.purchase_date)}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
                Comece adicionando suas primeiras ações ou importe do CEI/B3
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar CSV
                </Button>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="add-first-stock-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Ação
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Tem certeza que deseja remover <span className="font-mono font-semibold text-foreground">{stockToDelete?.ticker}</span> da sua carteira? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted text-foreground hover:bg-muted/80">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(stockToDelete?.stock_id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete All Stocks Confirmation Dialog */}
        <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Excluir todas as ações?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Esta ação não pode ser desfeita. Todas as {stocks.length} ações e seus dividendos associados serão permanentemente excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted text-muted-foreground hover:bg-muted/80">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAllStocks}
                disabled={deletingAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingAll ? "Excluindo..." : "Excluir Todas"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
