import { useState } from "react";
import { MessageCircle, X, Heart, Copy, Check, HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";

const SUPPORT_EMAIL = "ayrton.kruscinski@hotmail.com";
const PIX_KEYS = [
  { label: "Celular", key: "+5547988607103", icon: "📱" },
  { label: "PicPay (Aleatória)", key: "5c435619-f86c-4e64-8f49-8f36b4a4004b", icon: "🎲" },
];

export const FloatingSupport = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopyPix = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      toast.success("Chave PIX copiada!");
      setTimeout(() => setCopiedKey(null), 3000);
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  const handleSupport = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Suporte StockFolio&body=Olá, preciso de ajuda com...`;
    setIsMenuOpen(false);
  };

  const handleFeedback = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Feedback StockFolio&body=Olá, gostaria de compartilhar um feedback...`;
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Floating Buttons Container */}
      <div className="fixed bottom-20 right-6 z-[60] flex flex-col gap-3">
        
        {/* Support Menu Options */}
        {isMenuOpen && (
          <div className="flex flex-col gap-2 animate-fade-in mb-2">
            {/* Support */}
            <button
              onClick={handleSupport}
              className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg shadow-lg hover:border-primary/50 transition-all duration-200 group whitespace-nowrap"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <HelpCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Suporte</p>
                <p className="text-xs text-muted-foreground">Precisa de ajuda?</p>
              </div>
            </button>

            {/* Feedback */}
            <button
              onClick={handleFeedback}
              className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg shadow-lg hover:border-primary/50 transition-all duration-200 group whitespace-nowrap"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <MessageSquare className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Feedback</p>
                <p className="text-xs text-muted-foreground">Envie sugestões</p>
              </div>
            </button>
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex flex-col gap-3 items-end">
          {/* Donation Button */}
          <Button
            onClick={() => setShowDonationModal(true)}
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg transition-all duration-300 bg-pink-500 hover:bg-pink-600 shadow-[0_0_20px_rgba(236,72,153,0.4)]"
            title="Fazer uma doação"
          >
            <Heart className="w-6 h-6 text-white" />
          </Button>

          {/* Support/Feedback Button */}
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            size="icon"
            className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
              isMenuOpen 
                ? "bg-muted hover:bg-muted/80" 
                : "bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(0,229,153,0.4)]"
            }`}
            title="Suporte e Feedback"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Donation Modal */}
      <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Apoie o StockFolio
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-6">
              Se o StockFolio está te ajudando a gerenciar seus investimentos, considere fazer uma doação para apoiar o desenvolvimento contínuo do projeto.
            </p>
            
            <div className="space-y-4">
              {PIX_KEYS.map((pix, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">{pix.icon}</span>
                    </div>
                    <span className="font-medium text-foreground">Chave PIX - {pix.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted/50 rounded-lg px-4 py-3 font-mono text-sm text-foreground overflow-x-auto">
                      <span className="whitespace-nowrap">{pix.key}</span>
                    </div>
                    <Button
                      onClick={() => handleCopyPix(pix.key)}
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 flex-shrink-0"
                    >
                      {copiedKey === pix.key ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Qualquer valor é bem-vindo e ajuda muito! 💚
            </p>

            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-center text-muted-foreground">
                <span className="text-primary font-medium">Obrigado!</span> Sua contribuição ajuda a manter o StockFolio gratuito e com novas funcionalidades.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingSupport;
