import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./auth";
import { apiRequest } from "./queryClient";

interface AdminElevationContextType {
  isElevated: boolean;
  elevate: () => void;
  revoke: () => void;
  syncWithBackend: () => Promise<void>;
}

const AdminElevationContext = createContext<AdminElevationContextType | undefined>(undefined);

export function AdminElevationProvider({ children }: { children: ReactNode }) {
  const [isElevated, setIsElevated] = useState(false);
  const { isAuthenticated } = useAuth();

  // Sync elevation state with backend
  const syncWithBackend = async () => {
    try {
      const response = await apiRequest("GET", "/api/auth/me");
      setIsElevated(response.adminElevated || false);
    } catch (error) {
      // If request fails (e.g., 401), revoke elevation
      setIsElevated(false);
    }
  };

  // Sync with backend when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      syncWithBackend();
    } else {
      // Clear elevation on logout
      setIsElevated(false);
    }
  }, [isAuthenticated]);

  const elevate = () => {
    setIsElevated(true);
    // Sync with backend to ensure state is accurate
    syncWithBackend();
  };

  const revoke = () => {
    setIsElevated(false);
  };

  return (
    <AdminElevationContext.Provider value={{ isElevated, elevate, revoke, syncWithBackend }}>
      {children}
    </AdminElevationContext.Provider>
  );
}

export function useAdminElevation() {
  const context = useContext(AdminElevationContext);
  if (!context) {
    throw new Error("useAdminElevation must be used within AdminElevationProvider");
  }
  return context;
}
