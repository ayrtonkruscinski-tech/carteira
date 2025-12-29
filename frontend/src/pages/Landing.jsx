import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { TrendingUp, PieChart, Calculator, Brain, ArrowRight, Shield, Zap } from "lucide-react";
import { FloatingSupport } from "../components/FloatingSupport";
import { AdBannerHorizontal } from "../components/AdBanner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (response.ok) {
          navigate('/dashboard');
        }
      } catch (error) {
        // Not authenticated, stay on landing
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const features = [
    {
      icon: PieChart,
      title: "Gestão de Carteira",
      description: "Acompanhe suas ações, rendimento e rentabilidade em tempo real",
    },
    {
      icon: TrendingUp,
      title: "Análise de Dividendos",
      description: "Monitore seus proventos e visualize o histórico de pagamentos",
    },
    {
      icon: Calculator,
      title: "Preço Teto",
      description: "Calcule o preço justo usando Gordon, Bazin e DCF",
    },
    {
      icon: Brain,
      title: "Análise com IA",
      description: "Obtenha insights inteligentes sobre suas ações com IA",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Header */}
          <header className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center glow-primary">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">Carteira Inteligente</span>
            </div>
            <Button
              onClick={handleLogin}
              data-testid="login-btn"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,229,153,0.3)] px-6"
            >
              Entrar com Google
            </Button>
          </header>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Análise inteligente para investidores brasileiros
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
              Gerencie sua carteira de ações da
              <span className="text-primary"> B3</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Acompanhe rendimentos, dividendos e calcule o preço teto das suas ações com métodos profissionais de valuation
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleLogin}
                data-testid="get-started-btn"
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,229,153,0.3)] px-8 py-6 text-lg"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Shield className="w-4 h-4" />
                Login seguro com Google
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para investir melhor
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas profissionais para análise e gestão de investimentos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-6 bg-card rounded-xl border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-primary transition-all duration-300">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdBannerHorizontal />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Crie sua conta gratuita e comece a gerenciar sua carteira de investimentos
          </p>
          <Button
            onClick={handleLogin}
            data-testid="cta-btn"
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,229,153,0.3)] px-10 py-6 text-lg"
          >
            Criar Conta Grátis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Carteira Inteligente</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Carteira de Investimentos Inteligente. Feito para investidores brasileiros.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Support Button */}
      <FloatingSupport />
    </div>
  );
}
