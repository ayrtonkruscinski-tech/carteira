import { useState } from "react";
import { MessageCircle, X, Mail, Heart, Copy, Check, HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";

const SUPPORT_EMAIL = "ayrton.kruscinski@hotmail.com";
const PIX_KEY = "+5547988607103";

export const FloatingSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      toast.success("Chave PIX copiada!");
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  const handleSupport = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Suporte StockFolio&body=Olá, preciso de ajuda com...`;
    setIsOpen(false);
  };

  const handleFeedback = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Feedback StockFolio&body=Olá, gostaria de compartilhar um feedback...`;
    setIsOpen(false);
  };

  const handleDonation = () => {
    setShowDonationModal(true);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-[60]">
        {/* Menu Options */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2 animate-fade-in">
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

            {/* Donation */}
            <button
              onClick={handleDonation}
              className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg shadow-lg hover:border-primary/50 transition-all duration-200 group whitespace-nowrap"
            >
              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Doar</p>
                <p className="text-xs text-muted-foreground">Apoie o projeto</p>
              </div>
            </button>
          </div>
        )}

        {/* Main Floating Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
            isOpen 
              ? "bg-muted hover:bg-muted/80 rotate-0" 
              : "bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(0,229,153,0.4)]"
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-foreground" />
          ) : (
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          )}
        </Button>
      </div>

      {/* Donation Modal */}
      <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
        <DialogContent className="sm:max-w-[425px]">
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
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">💳</span>
                </div>
                <span className="font-medium text-foreground">Chave PIX (Celular)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/50 rounded-lg px-4 py-3 font-mono text-sm text-foreground">
                  {PIX_KEY}
                </div>
                <Button
                  onClick={handleCopyPix}
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Qualquer valor é bem-vindo e ajuda muito! 💚
              </p>
            </div>

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
