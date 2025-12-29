import { useEffect, useRef } from "react";

const AD_CLIENT = "ca-pub-1859251402912948";

export const AdBanner = ({ 
  slot = "auto", 
  format = "auto", 
  responsive = true,
  className = "" 
}) => {
  const adRef = useRef(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // Evita carregar o mesmo anúncio múltiplas vezes
    if (isAdLoaded.current) return;
    
    try {
      if (typeof window !== "undefined" && window.adsbygoogle) {
        window.adsbygoogle.push({});
        isAdLoaded.current = true;
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  return (
    <div className={`ad-container my-6 ${className}`}>
      <div className="text-center">
        <span className="text-xs text-muted-foreground">Publicidade</span>
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};

// Componente para anúncio horizontal entre seções
export const AdBannerHorizontal = ({ className = "" }) => (
  <AdBanner 
    format="horizontal" 
    responsive={true}
    className={`w-full ${className}`}
  />
);

// Componente para anúncio em feed (entre cards)
export const AdBannerInFeed = ({ className = "" }) => (
  <AdBanner 
    format="fluid" 
    responsive={true}
    className={className}
  />
);

// Componente para anúncio retangular
export const AdBannerRectangle = ({ className = "" }) => (
  <AdBanner 
    format="rectangle" 
    responsive={true}
    className={className}
  />
);

export default AdBanner;
