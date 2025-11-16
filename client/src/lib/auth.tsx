import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getMockData } from "./mockData";

interface AuthContextType {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Check if mock mode is enabled
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      // Return mock data if enabled
      if (USE_MOCK_DATA) {
        console.log('🎭 Using mock authentication');
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        return getMockData('/api/auth/me');
      }

      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        // If not authenticated, return null instead of throwing
        if (res.status === 401) {
          return null;
        }

        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }

        return await res.json();
      } catch (error) {
        console.error("Auth check failed:", error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const value: AuthContextType = {
    user: authData?.user || null,
    isLoading,
    isAuthenticated: !!authData?.user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
