import { useState, useEffect, useRef, useCallback } from "react";
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
import { Plus, Trash2, Edit2, Search, Briefcase, Upload, Download, FileText, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { usePortfolioSafe } from "../context/PortfolioContext";
import { AdBannerHorizontal } from "../components/AdBanner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SECTORS = [
  // Ações - Setores do Investidor10
  "Bancos",
  "Petróleo, Gás e Biocombustíveis",
  "Mineração",
  "Energia Elétrica",
  "Siderurgia e Metalurgia",
  "Materiais Básicos",
  "Bens Industriais",
  "Consumo Cíclico",
  "Consumo não Cíclico",
  "Saúde",
  "Tecnologia da Informação",
  "Telecomunicações",
  "Utilidade Pública",
  "Financeiro",
  "Seguros",
  "Papel e Celulose",
  "Alimentos Processados",
  "Bebidas",
  "Comércio",
  "Construção e Engenharia",
  "Transporte",
  "Educação",
  // FIIs - Segmentos do Investidor10
  "Lajes Corporativas",
  "Logística",
  "Shoppings",
  "Títulos e Val. Mob.",
  "Híbrido",
  "Recebíveis",
  "Hospital",
  "Hotel",
  "Residencial",
  "Outros",
];

const ITEMS_PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: "ticker_asc", label: "Nome (A-Z)" },
  { value: "ticker_desc", label: "Nome (Z-A)" },
  { value: "date_desc", label: "Data (Mais Recente)" },
  { value: "date_asc", label: "Data (Mais Antiga)" },
];

const ASSET_TYPES = [
  { value: "acao", label: "Ação (Renda Variável)" },
  { value: "fii", label: "Fundo Imobiliário (FII)" },
  { value: "renda_fixa", label: "Renda Fixa" },
];

const FIXED_INCOME_TYPES = [
  { value: "CDB", label: "CDB" },
  { value: "LCI", label: "LCI" },
  { value: "LCA", label: "LCA" },
  { value: "Tesouro Selic", label: "Tesouro Selic" },
  { value: "Tesouro IPCA+", label: "Tesouro IPCA+" },
  { value: "Tesouro Prefixado", label: "Tesouro Prefixado" },
  { value: "Debenture", label: "Debênture" },
  { value: "CRI", label: "CRI" },
  { value: "CRA", label: "CRA" },
];

const RATE_TYPES = [
  { value: "CDI", label: "% do CDI" },
  { value: "IPCA+", label: "IPCA +" },
  { value: "Prefixado", label: "Prefixado" },
];

// Auto-detect asset type based on ticker
const detectAssetType = (ticker) => {
  if (!ticker) return "acao";
  const t = ticker.toUpperCase().trim();
  if (t.endsWith("11")) return "fii";
  return "acao";
};

export default function Portfolio() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [saleConfirmDialogOpen, setSaleConfirmDialogOpen] = useState(false);
  const [pendingSalePayload, setPendingSalePayload] = useState(null);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [searchTicker, setSearchTicker] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [detectingType, setDetectingType] = useState(false);
  const fileInputRef = useRef(null);
  const detectTypeTimeoutRef = useRef(null);
  const [formData, setFormData] = useState({
    ticker: "",
    name: "",
    quantity: "",
    average_price: "",
    purchase_date: "",
    operation_type: "compra",
    include_in_results: true,
    asset_type: "acao",
    // Fixed income specific fields
    fixed_income_type: "",
    maturity_date: "",
    rate: "",
    rate_type: "",
    issuer: "",
    // Other fields
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
      // Fetch stock data and detect asset type in parallel
      const [searchResponse, typeResponse] = await Promise.all([
        fetch(`${API}/stocks/search/${searchTicker}`),
        fetch(`${API}/stocks/detect-type/${searchTicker}`)
      ]);
      
      let assetType = "acao"; // default
      let detectedName = "";
      let detectedSector = "";
      
      // Process type detection
      if (typeResponse.ok) {
        const typeData = await typeResponse.json();
        assetType = typeData.asset_type || "acao";
        detectedName = typeData.name || "";
        detectedSector = typeData.sector || "";
        
        if (typeData.source && typeData.source !== "pattern_fallback") {
          const typeLabel = assetType === "fii" ? "FII" : "Ação";
          toast.success(`${searchTicker.toUpperCase()} detectado como ${typeLabel}${detectedSector ? ` - ${detectedSector}` : ''}`);
        }
      }
      
      // Process search result
      if (searchResponse.ok) {
        const data = await searchResponse.json();
        setSearchResult(data);
        setFormData({
          ticker: data.ticker || "",
          name: data.name || detectedName || "",
          quantity: "",
          average_price: "",
          purchase_date: "",
          operation_type: "compra",
          include_in_results: true,
          asset_type: assetType,
          fixed_income_type: "",
          maturity_date: "",
          rate: "",
          rate_type: "",
          issuer: "",
          current_price: data.current_price?.toString() || "",
          dividend_yield: data.dividend_yield?.toString() || "",
          sector: detectedSector || data.sector || "",
          ceiling_price: "",
        });
        if (data.current_price) {
          toast.success(`Cotação carregada: R$ ${data.current_price?.toFixed(2)}`);
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
      operation_type: formData.operation_type || "compra",
      include_in_results: formData.include_in_results,
      asset_type: formData.asset_type || "acao",
      // Fixed income fields
      fixed_income_type: formData.fixed_income_type || null,
      maturity_date: formData.maturity_date || null,
      rate: formData.rate ? parseFloat(formData.rate) : null,
      rate_type: formData.rate_type || null,
      issuer: formData.issuer || null,
      // Other fields
      current_price: formData.current_price ? parseFloat(formData.current_price) : null,
      dividend_yield: formData.dividend_yield ? parseFloat(formData.dividend_yield) : null,
      sector: formData.sector || null,
      ceiling_price: formData.ceiling_price ? parseFloat(formData.ceiling_price) : null,
      portfolio_id: currentPortfolio?.portfolio_id || null,
    };

    // Se for venda e não está editando, perguntar sobre incluir no dashboard
    if (payload.operation_type === "venda" && !editingStock) {
      setPendingSalePayload(payload);
      setSaleConfirmDialogOpen(true);
      return;
    }

    await submitStock(payload);
  };

  const submitStock = async (payload) => {
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
              operation_type: payload.operation_type,
              include_in_results: payload.include_in_results,
              asset_type: payload.asset_type,
              fixed_income_type: payload.fixed_income_type,
              maturity_date: payload.maturity_date,
              rate: payload.rate,
              rate_type: payload.rate_type,
              issuer: payload.issuer,
              current_price: payload.current_price,
              dividend_yield: payload.dividend_yield,
              ceiling_price: payload.ceiling_price,
            }),
          }
        );
        if (response.ok) {
          toast.success("Lançamento atualizado com sucesso!");
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
          const opLabel = payload.operation_type === "venda" ? "Venda" : "Compra";
          toast.success(`${opLabel} registrada com sucesso!`);
          fetchStocks();
        }
      }
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar operação");
      console.error("Error saving stock:", error);
    }
  };

  const handleSaleConfirm = async (includeInResults) => {
    if (pendingSalePayload) {
      const payload = { ...pendingSalePayload, include_in_results: includeInResults };
      await submitStock(payload);
    }
    setSaleConfirmDialogOpen(false);
    setPendingSalePayload(null);
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
      operation_type: "compra",
      include_in_results: true,
      asset_type: "acao",
      fixed_income_type: "",
      maturity_date: "",
      rate: "",
      rate_type: "",
      issuer: "",
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

  // Auto-detect asset type when ticker changes by checking Investidor10
  const handleTickerChange = (ticker) => {
    // Update ticker immediately
    setFormData(prev => ({
      ...prev,
      ticker,
    }));

    // Clear previous timeout
    if (detectTypeTimeoutRef.current) {
      clearTimeout(detectTypeTimeoutRef.current);
    }

    // Only fetch asset type if ticker has minimum length (debounced)
    if (ticker.length >= 4) {
      setDetectingType(true);
      
      detectTypeTimeoutRef.current = setTimeout(async () => {
        try {
          console.log(`Detecting asset type for: ${ticker}`);
          const response = await fetch(`${API}/stocks/detect-type/${ticker}`);
          console.log(`Response status: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Detection result:`, data);
            
            // Update form with detected type and sector
            setFormData(prev => {
              const newData = {
                ...prev,
                asset_type: data.asset_type || "acao",
              };
              // Only set name if it's empty and we got one from API
              if (data.name && !prev.name) {
                newData.name = data.name;
              }
              // Set sector if detected
              if (data.sector) {
                newData.sector = data.sector;
              }
              console.log(`Updating formData asset_type to: ${newData.asset_type}, sector: ${newData.sector}`);
              return newData;
            });
            
            // Show toast for successful detection
            if (data.source && data.source !== "pattern_fallback") {
              const typeLabel = data.asset_type === "fii" ? "FII" : "Ação";
              toast.success(`${ticker} detectado como ${typeLabel}${data.sector ? ` - ${data.sector}` : ''}`);
            }
          } else {
            console.log(`Detection failed with status: ${response.status}`);
            // Fallback to pattern-based detection
            setFormData(prev => ({
              ...prev,
              asset_type: detectAssetType(ticker),
            }));
          }
        } catch (error) {
          console.error("Asset type detection error:", error);
          // Fallback to pattern-based detection
          setFormData(prev => ({
            ...prev,
            asset_type: detectAssetType(ticker),
          }));
        } finally {
          setDetectingType(false);
        }
      }, 800); // 800ms debounce for better UX
    } else {
      setDetectingType(false);
    }
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
  // Operações diferentes (compra/venda) também ficam separadas
  const groupedStocks = stocks.reduce((acc, stock) => {
    // Chave de agrupamento: ticker + data + tipo de operação
    const opType = stock.operation_type || "compra";
    const key = `${stock.ticker}_${stock.purchase_date || 'sem_data'}_${opType}`;
    const existing = acc.find(s => {
      const sOpType = s.operation_type || "compra";
      return `${s.ticker}_${s.purchase_date || 'sem_data'}_${sOpType}` === key;
    });
    
    if (existing) {
      // Mesmo ticker + mesma data + mesmo tipo: agrupa (calcula preço médio ponderado)
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
      // Ticker diferente OU data diferente OU tipo diferente: novo card
      acc.push({
        ...stock,
        operation_type: opType,
        stock_ids: [stock.stock_id]
      });
    }
    return acc;
  }, []);

  // Ordenar os stocks
  const sortedStocks = [...groupedStocks].sort((a, b) => {
    switch (sortBy) {
      case "ticker_asc":
        return a.ticker.localeCompare(b.ticker);
      case "ticker_desc":
        return b.ticker.localeCompare(a.ticker);
      case "date_desc":
        // Mais recente primeiro
        if (!a.purchase_date && !b.purchase_date) return 0;
        if (!a.purchase_date) return 1;
        if (!b.purchase_date) return -1;
        return b.purchase_date.localeCompare(a.purchase_date);
      case "date_asc":
        // Mais antiga primeiro
        if (!a.purchase_date && !b.purchase_date) return 0;
        if (!a.purchase_date) return 1;
        if (!b.purchase_date) return -1;
        return a.purchase_date.localeCompare(b.purchase_date);
      default:
        return 0;
    }
  });

  // Paginação
  const totalPages = Math.ceil(sortedStocks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStocks = sortedStocks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset página quando mudar ordenação ou dados
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, stocks.length]);

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
                  
                  {/* Tutorial B3 */}
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <p className="text-sm text-foreground font-medium mb-2 flex items-center gap-2">
                      <span className="text-primary">💡</span> Como obter o arquivo da B3:
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Acesse o site da <span className="text-primary font-medium">B3</span> → <span className="text-foreground">Extrato</span> → <span className="text-foreground">Negociações</span> → <span className="text-foreground">Baixar arquivo</span>. 
                      O arquivo estará salvo e pronto no seu dispositivo. Agora basta importar que nós fazemos o resto!
                    </p>
                  </div>
                  
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
                  Adicionar Lançamento
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {editingStock ? "Editar Lançamento" : "Adicionar Lançamento"}
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
                      <Label htmlFor="ticker">Ticker / Nome</Label>
                      <Input
                        id="ticker"
                        value={formData.ticker}
                        onChange={(e) => handleTickerChange(e.target.value.toUpperCase())}
                        required
                        disabled={editingStock}
                        className="bg-input border-input font-mono"
                        data-testid="ticker-input"
                        placeholder="Ex: PETR4, MXRF11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="asset_type">
                        Tipo de Ativo
                        {detectingType && <span className="ml-2 text-xs text-muted-foreground">(detectando...)</span>}
                      </Label>
                      <Select
                        value={formData.asset_type}
                        onValueChange={(value) => setFormData({ ...formData, asset_type: value })}
                        disabled={detectingType}
                      >
                        <SelectTrigger className={`bg-input border-input ${detectingType ? 'opacity-50' : ''}`}>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {ASSET_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  {/* Fixed Income specific fields */}
                  {formData.asset_type === "renda_fixa" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fixed_income_type">Tipo de Título</Label>
                          <Select
                            value={formData.fixed_income_type}
                            onValueChange={(value) => setFormData({ ...formData, fixed_income_type: value })}
                          >
                            <SelectTrigger className="bg-input border-input">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {FIXED_INCOME_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="issuer">Emissor</Label>
                          <Input
                            id="issuer"
                            value={formData.issuer}
                            onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                            placeholder="Ex: Banco XYZ"
                            className="bg-input border-input"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="rate">Taxa</Label>
                          <Input
                            id="rate"
                            type="number"
                            step="0.01"
                            value={formData.rate}
                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                            placeholder="Ex: 110"
                            className="bg-input border-input font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rate_type">Tipo de Taxa</Label>
                          <Select
                            value={formData.rate_type}
                            onValueChange={(value) => setFormData({ ...formData, rate_type: value })}
                          >
                            <SelectTrigger className="bg-input border-input">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {RATE_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maturity_date">Vencimento</Label>
                          <Input
                            id="maturity_date"
                            type="date"
                            value={formData.maturity_date}
                            onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                            className="bg-input border-input"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_price">Preço Compra/Venda (R$)</Label>
                      <Input
                        id="current_price"
                        type="number"
                        step="0.01"
                        value={formData.current_price}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            current_price: e.target.value,
                            average_price: e.target.value
                          });
                        }}
                        required
                        className="bg-input border-input font-mono"
                        data-testid="current-price-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="operation_type">Tipo de Operação *</Label>
                      <Select
                        value={formData.operation_type}
                        onValueChange={(value) => setFormData({ ...formData, operation_type: value })}
                        required
                      >
                        <SelectTrigger className="bg-input border-input">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compra">Compra</SelectItem>
                          <SelectItem value="venda">Venda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchase_date">Data da Operação</Label>
                      <Input
                        id="purchase_date"
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                        className="bg-input border-input"
                        data-testid="purchase-date-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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

        {/* Filtros e Ordenação */}
        {groupedStocks.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ordenar por:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {sortedStocks.length} lançamento{sortedStocks.length !== 1 ? 's' : ''} 
              {totalPages > 1 && ` • Página ${currentPage} de ${totalPages}`}
            </div>
          </div>
        )}

        {/* Stocks Grid */}
        {paginatedStocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedStocks.map((stock) => {
              const currentPrice = stock.current_price || stock.average_price;
              const totalValue = stock.quantity * currentPrice;
              const totalInvested = stock.quantity * stock.average_price;
              const gain = totalValue - totalInvested;
              const gainPercent = stock.average_price > 0 ? ((currentPrice / stock.average_price) - 1) * 100 : 0;
              const atCeiling = stock.ceiling_price && currentPrice >= stock.ceiling_price;
              const isVenda = stock.operation_type === "venda";
              const isBonificacao = stock.operation_type === "bonificacao";
              const isCompra = stock.operation_type === "compra" || !stock.operation_type;

              return (
                <Card
                  key={`${stock.stock_id}_${stock.purchase_date}_${stock.operation_type}`}
                  className={`bg-card border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 ${atCeiling ? 'border-accent/50' : ''} ${isCompra ? 'border-l-4 border-l-primary' : ''} ${isVenda ? 'border-l-4 border-l-destructive' : ''} ${isBonificacao ? 'border-l-4 border-l-purple-500' : ''}`}
                  data-testid={`stock-card-${stock.ticker}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-mono text-xl text-foreground flex items-center gap-2">
                          {stock.ticker}
                          {isCompra && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Compra</span>}
                          {isBonificacao && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Bonificação</span>}
                          {isVenda && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">Venda</span>}
                          {atCeiling && !isVenda && !isBonificacao && <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Teto!</span>}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {stock.name}
                          {stock.purchase_date && (
                            <span className="ml-2 text-xs text-blue-400">
                              ({(() => {
                                const parts = stock.purchase_date.split("-");
                                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : stock.purchase_date;
                              })()})
                            </span>
                          )}
                        </p>
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
                        <span className="font-mono text-foreground">{stock.quantity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Preço C/V</span>
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
                  Adicionar Lançamento
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
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

        {/* Sale Confirmation Dialog - Incluir no Dashboard */}
        <AlertDialog open={saleConfirmDialogOpen} onOpenChange={setSaleConfirmDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Registrar Venda</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Deseja incluir o lucro/prejuízo desta venda no resultado geral do Dashboard?
                <br /><br />
                <span className="text-xs">
                  • <strong>Sim</strong>: O resultado da venda será contabilizado na rentabilidade total.<br />
                  • <strong>Não</strong>: A venda será registrada mas não afetará os indicadores do Dashboard.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2">
              <AlertDialogCancel 
                onClick={() => {
                  setSaleConfirmDialogOpen(false);
                  setPendingSalePayload(null);
                }}
                className="bg-muted text-foreground hover:bg-muted/80"
              >
                Cancelar
              </AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => handleSaleConfirm(false)}
              >
                Não Incluir
              </Button>
              <Button
                onClick={() => handleSaleConfirm(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sim, Incluir
              </Button>
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
