import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PortfolioContext = createContext(null);

export const PortfolioProvider = ({ children }) => {
  const [portfolios, setPortfolios] = useState([]);
  const [currentPortfolio, setCurrentPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolios = useCallback(async () => {
    try {
      const response = await fetch(`${API}/portfolios`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
        
        // Set current portfolio from localStorage or use default
        const savedPortfolioId = localStorage.getItem("currentPortfolioId");
        const savedPortfolio = data.find(p => p.portfolio_id === savedPortfolioId);
        const defaultPortfolio = data.find(p => p.is_default) || data[0];
        
        setCurrentPortfolio(savedPortfolio || defaultPortfolio);
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const selectPortfolio = useCallback((portfolio) => {
    setCurrentPortfolio(portfolio);
    localStorage.setItem("currentPortfolioId", portfolio.portfolio_id);
  }, []);

  const createPortfolio = useCallback(async (name, description = "") => {
    try {
      const response = await fetch(`${API}/portfolios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description }),
      });
      if (response.ok) {
        const newPortfolio = await response.json();
        setPortfolios(prev => [...prev, newPortfolio]);
        return newPortfolio;
      }
    } catch (error) {
      console.error("Error creating portfolio:", error);
    }
    return null;
  }, []);

  const updatePortfolio = useCallback(async (portfolioId, data) => {
    try {
      const response = await fetch(`${API}/portfolios/${portfolioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updated = await response.json();
        setPortfolios(prev => prev.map(p => p.portfolio_id === portfolioId ? updated : p));
        if (currentPortfolio?.portfolio_id === portfolioId) {
          setCurrentPortfolio(updated);
        }
        return updated;
      }
    } catch (error) {
      console.error("Error updating portfolio:", error);
    }
    return null;
  }, [currentPortfolio]);

  const deletePortfolio = useCallback(async (portfolioId) => {
    try {
      const response = await fetch(`${API}/portfolios/${portfolioId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setPortfolios(prev => prev.filter(p => p.portfolio_id !== portfolioId));
        // If deleting current portfolio, switch to default
        if (currentPortfolio?.portfolio_id === portfolioId) {
          const defaultPortfolio = portfolios.find(p => p.is_default && p.portfolio_id !== portfolioId);
          if (defaultPortfolio) {
            selectPortfolio(defaultPortfolio);
          }
        }
        return true;
      }
    } catch (error) {
      console.error("Error deleting portfolio:", error);
    }
    return false;
  }, [currentPortfolio, portfolios, selectPortfolio]);

  return (
    <PortfolioContext.Provider
      value={{
        portfolios,
        currentPortfolio,
        loading,
        selectPortfolio,
        createPortfolio,
        updatePortfolio,
        deletePortfolio,
        refreshPortfolios: fetchPortfolios,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

// Hook that returns null if not inside provider (safe version)
export const usePortfolioSafe = () => {
  return useContext(PortfolioContext);
};

// Hook that throws if not inside provider
export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};
