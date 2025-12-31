import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Briefcase, Coins, Calculator, Brain, LogOut, Menu, X, Bell, ChevronDown, Plus, Pencil, Trash2 } from "lucide-react";
import { FloatingSupport } from "./FloatingSupport";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { TooltipProvider } from "./ui/tooltip";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { usePortfolioSafe } from "../context/PortfolioContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/portfolio", label: "Carteira", icon: Briefcase },
  { path: "/dividends", label: "Proventos", icon: Coins },
  { path: "/valuation", label: "Valuation", icon: Calculator },
  { path: "/analysis", label: "Análise IA", icon: Brain },
];

export const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  
  // Portfolio context - returns null if not wrapped in provider
  const portfolioContext = usePortfolioSafe();
  
  const { portfolios = [], currentPortfolio, selectPortfolio, createPortfolio, updatePortfolio, deletePortfolio } = portfolioContext || {};

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    const fetchAlertCount = async () => {
      try {
        const response = await fetch(`${API}/alerts/count`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setAlertCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching alert count:', error);
      }
    };
    
    fetchUser();
    fetchAlertCount();
    
    // Poll for alerts every 30 seconds
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    navigate('/');
  };

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim() || !createPortfolio) return;
    const portfolio = await createPortfolio(newPortfolioName.trim());
    if (portfolio) {
      toast.success(`Carteira "${portfolio.name}" criada!`);
      selectPortfolio(portfolio);
      setNewPortfolioName("");
      setIsCreateDialogOpen(false);
    } else {
      toast.error("Erro ao criar carteira");
    }
  };

  const handleEditPortfolio = async () => {
    if (!editingPortfolio || !editingPortfolio.name.trim() || !updatePortfolio) return;
    const updated = await updatePortfolio(editingPortfolio.portfolio_id, { name: editingPortfolio.name.trim() });
    if (updated) {
      toast.success("Carteira atualizada!");
      setIsEditDialogOpen(false);
      setEditingPortfolio(null);
    } else {
      toast.error("Erro ao atualizar carteira");
    }
  };

  const handleDeletePortfolio = async (portfolio) => {
    if (!deletePortfolio) return;
    if (portfolio.is_default) {
      toast.error("Não é possível excluir a carteira padrão");
      return;
    }
    if (window.confirm(`Excluir carteira "${portfolio.name}"? Todas as ações e dividendos serão removidos.`)) {
      const success = await deletePortfolio(portfolio.portfolio_id);
      if (success) {
        toast.success("Carteira excluída!");
      } else {
        toast.error("Erro ao excluir carteira");
      }
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground hidden sm:block">Carteira Inteligente</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.path.slice(1)}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Portfolio Selector Dropdown */}
              {portfolioContext && portfolios.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 max-w-[180px]">
                      <Briefcase className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="truncate">{currentPortfolio?.name || "Carteira"}</span>
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {portfolios.map((portfolio) => (
                      <DropdownMenuItem
                        key={portfolio.portfolio_id}
                        onClick={() => selectPortfolio(portfolio)}
                        className={`flex items-center justify-between ${
                          currentPortfolio?.portfolio_id === portfolio.portfolio_id ? "bg-primary/10" : ""
                        }`}
                      >
                        <span className="truncate flex-1">{portfolio.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground mr-1">{portfolio.stocks_count || 0}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-primary/20"
                            title="Renomear carteira"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPortfolio({ ...portfolio });
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          {!portfolio.is_default && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:bg-destructive/20"
                              title="Excluir carteira"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePortfolio(portfolio);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Carteira
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Alert Bell */}
              {alertCount > 0 && (
                <Link to="/dashboard" className="relative">
                  <Bell className="w-5 h-5 text-accent" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {alertCount}
                  </span>
                </Link>
              )}
              {user && (
                <div className="hidden sm:flex items-center gap-3">
                  <img
                    src={user.picture || `https://ui-avatars.com/api/?name=${user.name}&background=00E599&color=0B0F13`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm text-muted-foreground">{user.name?.split(' ')[0]}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="logout-btn"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="px-4 py-3 space-y-1">
              {/* Mobile Portfolio Selector */}
              {portfolioContext && portfolios.length > 0 && (
                <div className="px-4 py-2 mb-2">
                  <Label className="text-xs text-muted-foreground mb-2 block">Carteira</Label>
                  <select
                    value={currentPortfolio?.portfolio_id || ""}
                    onChange={(e) => {
                      const portfolio = portfolios.find(p => p.portfolio_id === e.target.value);
                      if (portfolio) selectPortfolio(portfolio);
                    }}
                    className="w-full bg-input border-input rounded-md px-3 py-2 text-sm"
                  >
                    {portfolios.map((p) => (
                      <option key={p.portfolio_id} value={p.portfolio_id}>
                        {p.name} ({p.stocks_count || 0} ações)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Create Portfolio Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Carteira</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio-name">Nome da Carteira</Label>
              <Input
                id="portfolio-name"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                placeholder="Ex: Dividendos, Crescimento..."
                onKeyDown={(e) => e.key === "Enter" && handleCreatePortfolio()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePortfolio} disabled={!newPortfolioName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Portfolio Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Carteira</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-portfolio-name">Nome da Carteira</Label>
              <Input
                id="edit-portfolio-name"
                value={editingPortfolio?.name || ""}
                onChange={(e) => setEditingPortfolio(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Nome da carteira"
                onKeyDown={(e) => e.key === "Enter" && handleEditPortfolio()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditPortfolio} disabled={!editingPortfolio?.name?.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Support Button */}
      <FloatingSupport />
    </div>
  );
};

export default Layout;
