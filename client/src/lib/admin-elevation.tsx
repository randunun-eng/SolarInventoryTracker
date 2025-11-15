import { createContext, useContext, useState, ReactNode } from "react";

interface AdminElevationContextType {
  isElevated: boolean;
  elevate: () => void;
  revoke: () => void;
}

const AdminElevationContext = createContext<AdminElevationContextType | undefined>(undefined);

export function AdminElevationProvider({ children }: { children: ReactNode }) {
  const [isElevated, setIsElevated] = useState(false);

  const elevate = () => setIsElevated(true);
  const revoke = () => setIsElevated(false);

  return (
    <AdminElevationContext.Provider value={{ isElevated, elevate, revoke }}>
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
